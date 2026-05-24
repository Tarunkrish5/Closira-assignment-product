"""Database engine, session factory, and FastAPI dependency.

We use SQLAlchemy 2.0 with a thin session-per-request pattern. SQLite is the
default for frictionless evaluation; flipping ``DATABASE_URL`` to a Postgres
DSN works with no code changes thanks to the dialect-agnostic ORM layer.
"""
from __future__ import annotations

from collections.abc import Generator
from typing import Any

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings

settings = get_settings()


# SQLite needs ``check_same_thread=False`` because FastAPI may dispatch a
# single connection across the request thread and the BackgroundTasks thread.
# For Postgres this flag is ignored.
_connect_args: dict[str, Any] = (
    {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
)

engine = create_engine(
    settings.database_url,
    connect_args=_connect_args,
    pool_pre_ping=True,
    future=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a request-scoped DB session.

    Commit is the caller's responsibility — keeps transaction boundaries
    explicit and easy to reason about.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create tables. In production we would use Alembic migrations instead."""
    # Import models so they register with the metadata before create_all.
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
