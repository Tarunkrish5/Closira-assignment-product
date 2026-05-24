"""FastAPI application entry point.

Composes routers, registers exception handlers so no unhandled exception ever
reaches the client, and bootstraps the database on startup.
"""
from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.config import get_settings
from app.database import init_db
from app.logger import configure_logging, get_logger
from app.routers import enquiry, health

configure_logging()
logger = get_logger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Initialise the DB on startup; no teardown work required."""
    logger.info("app.starting", version=settings.app_version, env=settings.environment)
    init_db()
    logger.info("app.ready")
    yield
    logger.info("app.shutdown")


tags_metadata = [
    {
        "name": "Enquiry",
        "description": "Inbound customer enquiries — create, schedule follow-ups, escalate, and read history.",
    },
    {"name": "Health", "description": "Service liveness and dependency checks."},
]


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "REST API + async worker that powers Closira's customer enquiry-handling "
        "pipeline. Inbound messages from WhatsApp / email / phone are accepted, "
        "matched against business SOPs in a background task, and either qualified "
        "with a suggested response or escalated to a human agent.\n\n"
        "### Async contract\n"
        "`POST /enquiry` returns ``202 Accepted`` immediately. Poll "
        "`GET /enquiry/{id}/history` to see the SOP-match outcome.\n\n"
        "### Multi-tenancy\n"
        "Send `X-Tenant-Id: <id>` to scope every request to a single tenant. "
        "If the header is omitted, the demo tenant is used."
    ),
    openapi_tags=tags_metadata,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


# Permissive CORS during development so the React Native app (or any other
# client) can hit the API. Production deployments would restrict origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Global exception handlers — every error path returns a consistent envelope.
# ---------------------------------------------------------------------------

@app.exception_handler(RequestValidationError)
async def _validation_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    logger.info(
        "request.validation_error",
        path=request.url.path,
        errors=exc.errors(),
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Validation failed.", "code": "validation_error", "errors": exc.errors()},
    )


@app.exception_handler(SQLAlchemyError)
async def _db_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    logger.error("request.db_error", path=request.url.path, error=str(exc), exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": "Database error — please retry.", "code": "db_error"},
    )


@app.exception_handler(Exception)
async def _unhandled_handler(request: Request, exc: Exception) -> JSONResponse:
    # Last-resort safety net so the client never sees a stack trace.
    logger.error(
        "request.unhandled_exception",
        path=request.url.path,
        error=str(exc),
        exc_info=True,
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error.", "code": "internal_error"},
    )


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(health.router)
app.include_router(enquiry.router)


@app.get("/", include_in_schema=False)
def root() -> dict[str, str]:
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
    }
