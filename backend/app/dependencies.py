"""Shared FastAPI dependencies.

We stub multi-tenancy with an ``X-Tenant-Id`` header that defaults to the
demo tenant configured in settings. In production this dependency would
extract the tenant from a validated JWT instead, but the rest of the
codebase only sees an opaque ``tenant_id`` string — swapping in real auth
is a one-file change.
"""
from __future__ import annotations

from fastapi import Header

from app.config import get_settings


def get_tenant_id(
    x_tenant_id: str | None = Header(default=None, alias="X-Tenant-Id"),
) -> str:
    """Resolve the tenant ID from the request header, falling back to the demo tenant."""
    return x_tenant_id or get_settings().default_tenant_id
