"""Health endpoint."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.logger import get_logger
from app.schemas import HealthResponse

router = APIRouter(tags=["Health"])
logger = get_logger(__name__)


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="API and database health check",
    description=(
        "Lightweight liveness probe. Reports the API status and whether the "
        "database is reachable. Returns 200 even when the DB is unreachable "
        "(with a ``degraded`` status) so load balancers can distinguish "
        "between 'process is up but degraded' and 'process is down'."
    ),
    responses={
        200: {
            "description": "Service is up. Inspect ``database`` to know if DB is healthy.",
            "content": {
                "application/json": {
                    "example": {
                        "status": "ok",
                        "database": "ok",
                        "version": "1.0.0",
                        "environment": "development",
                    }
                }
            },
        }
    },
)
def health(db: Session = Depends(get_db)) -> HealthResponse:
    settings = get_settings()
    try:
        db.execute(text("SELECT 1"))
        db_status: str = "ok"
        overall: str = "ok"
    except Exception as exc:  # noqa: BLE001
        logger.error("health.db_unreachable", error=str(exc))
        db_status = "unreachable"
        overall = "degraded"

    return HealthResponse(
        status=overall,  # type: ignore[arg-type]
        database=db_status,  # type: ignore[arg-type]
        version=settings.app_version,
        environment=settings.environment,
    )
