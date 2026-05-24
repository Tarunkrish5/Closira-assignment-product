"""Application configuration.

Settings are loaded from environment variables with sensible defaults so the
service runs out of the box for evaluation. In production, secrets and the
database URL would come from a secrets manager.
"""
from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration for the Closira backend."""

    # Application
    app_name: str = "Closira Enquiry API"
    app_version: str = "1.0.0"
    environment: str = "development"

    # Database — SQLite by default for zero-config evaluation. Override with
    # DATABASE_URL=postgresql+psycopg://user:pass@host/db for Postgres.
    database_url: str = "sqlite:///./closira.db"

    # Multi-tenancy stub. In production this would be derived from an auth
    # token; for the assignment we accept it as a header and default to a demo
    # tenant so endpoints remain testable.
    default_tenant_id: str = "tenant_demo"

    # Logging
    log_level: str = "INFO"
    log_json: bool = True

    # Background processing
    sop_match_artificial_delay_ms: int = 0  # raise to simulate real work

    model_config = SettingsConfigDict(env_file=".env", env_prefix="", extra="ignore")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Cached settings accessor.

    Cached because env parsing is non-trivial and these values are immutable
    for the lifetime of the process.
    """
    return Settings()
