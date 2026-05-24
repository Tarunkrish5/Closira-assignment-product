"""Enquiry endpoints.

These four routes form the core of the assignment. Each is intentionally thin
— it delegates to ``app.services.enquiry_service`` for any non-trivial work,
which keeps the HTTP layer testable in isolation and the business logic
re-usable from a future Celery worker or admin script.
"""
from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Path, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_tenant_id
from app.logger import get_logger
from app.schemas import (
    EnquiryAccepted,
    EnquiryCreate,
    EnquiryHistory,
    EnquiryRead,
    ErrorResponse,
    EscalationCreate,
    FollowUpCreate,
    FollowUpRead,
)
from app.services import enquiry_service

router = APIRouter(prefix="/enquiry", tags=["Enquiry"])
logger = get_logger(__name__)


# A reusable Path() for the ``id`` param so /docs renders consistent metadata.
EnquiryIdPath = Path(..., description="UUID of the enquiry.", min_length=36, max_length=36)


# ---------------------------------------------------------------------------
# POST /enquiry
# ---------------------------------------------------------------------------

@router.post(
    "",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=EnquiryAccepted,
    summary="Create an inbound customer enquiry",
    description=(
        "Accepts a new enquiry from any supported channel, persists it, and "
        "**immediately returns** a job ID. The SOP-matching work runs in a "
        "background task — clients should poll ``GET /enquiry/{id}/history`` "
        "to observe the result.\n\n"
        "Returns ``202 Accepted`` to make the asynchronous contract explicit."
    ),
    responses={
        202: {"description": "Enquiry accepted and queued for processing."},
        422: {"model": ErrorResponse, "description": "Invalid payload."},
    },
)
def create_enquiry(
    payload: EnquiryCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
) -> EnquiryAccepted:
    enquiry = enquiry_service.create_enquiry(
        db,
        tenant_id=tenant_id,
        channel=payload.channel,
        customer_name=payload.customer_name,
        message=payload.message,
    )
    # Dispatch the SOP-matching worker. ``process_enquiry`` opens its own
    # session, so it is safe to run after the request returns.
    background_tasks.add_task(enquiry_service.process_enquiry, enquiry.id, tenant_id)

    return EnquiryAccepted(job_id=enquiry.id, status="processing")


# ---------------------------------------------------------------------------
# POST /enquiry/{id}/followup
# ---------------------------------------------------------------------------

@router.post(
    "/{enquiry_id}/followup",
    status_code=status.HTTP_201_CREATED,
    response_model=FollowUpRead,
    summary="Schedule a follow-up for an open enquiry",
    description=(
        "Creates a pending follow-up that the platform's scheduled-jobs worker "
        "would later pick up and send to the customer. ``delay_minutes`` is "
        "added to the current server time; ``message_template`` is optional "
        "and supports ``{{customer_name}}``-style placeholders that the sender "
        "would substitute at fire time."
    ),
    responses={
        201: {"description": "Follow-up scheduled."},
        404: {"model": ErrorResponse, "description": "Enquiry not found."},
        409: {"model": ErrorResponse, "description": "Enquiry is closed."},
        422: {"model": ErrorResponse, "description": "Invalid payload."},
    },
)
def schedule_followup(
    payload: FollowUpCreate,
    enquiry_id: str = EnquiryIdPath,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
) -> FollowUpRead:
    enquiry = enquiry_service.get_enquiry(db, enquiry_id, tenant_id)
    if enquiry is None:
        raise HTTPException(status_code=404, detail="Enquiry not found.")
    if enquiry.status == "resolved":
        raise HTTPException(
            status_code=409, detail="Cannot schedule a follow-up on a resolved enquiry."
        )

    followup = enquiry_service.schedule_followup(
        db,
        enquiry=enquiry,
        delay_minutes=payload.delay_minutes,
        message_template=payload.message_template,
    )
    return FollowUpRead.model_validate(followup)


# ---------------------------------------------------------------------------
# POST /enquiry/{id}/escalate
# ---------------------------------------------------------------------------

@router.post(
    "/{enquiry_id}/escalate",
    response_model=EnquiryRead,
    summary="Escalate an enquiry to a human agent",
    description=(
        "Records the escalation reason, appends an entry to the status "
        "timeline, and updates the enquiry's current status to ``escalated``. "
        "Idempotent — escalating an already-escalated enquiry is a no-op."
    ),
    responses={
        200: {"description": "Enquiry escalated (or already escalated)."},
        404: {"model": ErrorResponse, "description": "Enquiry not found."},
        422: {"model": ErrorResponse, "description": "Invalid payload."},
    },
)
def escalate_enquiry(
    payload: EscalationCreate,
    enquiry_id: str = EnquiryIdPath,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
) -> EnquiryRead:
    enquiry = enquiry_service.get_enquiry(db, enquiry_id, tenant_id)
    if enquiry is None:
        raise HTTPException(status_code=404, detail="Enquiry not found.")

    updated = enquiry_service.escalate_enquiry(db, enquiry=enquiry, reason=payload.reason)
    return EnquiryRead.model_validate(updated)


# ---------------------------------------------------------------------------
# GET /enquiry/{id}/history
# ---------------------------------------------------------------------------

@router.get(
    "/{enquiry_id}/history",
    response_model=EnquiryHistory,
    summary="Full conversation history and status timeline",
    description=(
        "Returns the enquiry, its append-only conversation thread, its full "
        "status timeline, and any scheduled follow-ups — everything the "
        "dashboard needs to render a conversation detail screen in one round-trip."
    ),
    responses={
        200: {"description": "Enquiry history."},
        404: {"model": ErrorResponse, "description": "Enquiry not found."},
    },
)
def get_history(
    enquiry_id: str = EnquiryIdPath,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id),
) -> EnquiryHistory:
    enquiry = enquiry_service.get_enquiry_with_history(db, enquiry_id, tenant_id)
    if enquiry is None:
        raise HTTPException(status_code=404, detail="Enquiry not found.")

    return EnquiryHistory(
        enquiry=EnquiryRead.model_validate(enquiry),
        messages=[__import_msg(m) for m in enquiry.messages],
        status_timeline=[__import_status(s) for s in enquiry.status_events],
        followups=[FollowUpRead.model_validate(f) for f in enquiry.followups],
    )


# Tiny local validators — keep the imports out of the router signature.
def __import_msg(m):  # noqa: ANN001
    from app.schemas import ConversationMessageRead

    return ConversationMessageRead.model_validate(m)


def __import_status(s):  # noqa: ANN001
    from app.schemas import StatusEventRead

    return StatusEventRead.model_validate(s)
