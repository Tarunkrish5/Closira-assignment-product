"""Structured logging configuration.

We emit JSON logs so that key events (enquiry created, task processed, SOP
matched, escalation triggered) are machine-parseable by downstream tools such
as Datadog, ELK, or CloudWatch. Every log line is a single JSON object with a
consistent set of fields — ``event``, ``level``, ``timestamp``, plus any
contextual key/value pairs supplied at the call site.
"""
from __future__ import annotations

import logging
import sys
from typing import Any

import structlog

from app.config import get_settings


def configure_logging() -> None:
    """Configure structlog + stdlib logging once at process start."""
    settings = get_settings()
    level = getattr(logging, settings.log_level.upper(), logging.INFO)

    # Route stdlib logs (FastAPI/Uvicorn/SQLAlchemy) through structlog so the
    # whole application speaks one log format.
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=level,
    )

    shared_processors: list[Any] = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    if settings.log_json:
        renderer: Any = structlog.processors.JSONRenderer()
    else:
        renderer = structlog.dev.ConsoleRenderer()

    structlog.configure(
        processors=shared_processors + [renderer],
        wrapper_class=structlog.make_filtering_bound_logger(level),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str | None = None) -> structlog.stdlib.BoundLogger:
    """Return a bound structlog logger.

    Prefer module-level ``logger = get_logger(__name__)`` so the source of
    each event is visible in production logs.
    """
    return structlog.get_logger(name or "closira")
