"""Enquiry domain service.

All write paths that touch an enquiry funnel through this module. Keeping the
routers thin and pushing logic here means we get one well-tested place to
enforce invariants like:

* every status change writes a row to ``status_events``;
* the initial customer message is always the first row in
  ``conversation_messages``;
* escalation is idempotent — repeating it does not duplicate timeline entries.
"""
from __future__ import annotations

import time
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.config import get_settings
from app.logger import get_logger
from app.models import (
    ConversationMessage,
    Enquiry,
    EnquiryStatus,
    FollowUp,
    FollowUpStatus,
    MessageRole,
    StatusEvent,
)
from app.services.sop_matcher import match_sop

logger = get_logger(__name__)
settings = get_settings()


# ---------------------------------------------------------------------------
# Reads
# ---------------------------------------------------------------------------

def get_enquiry(db: Session, enquiry_id: str, tenant_id: str) -> Enquiry | None:
    """Fetch an enquiry scoped to a tenant — returns ``None`` if not found."""
    stmt = select(Enquiry).where(Enquiry.id == enquiry_id, Enquiry.tenant_id == tenant_id)
    return db.execute(stmt).scalar_one_or_none()


def get_enquiry_with_history(
    db: Session, enquiry_id: str, tenant_id: str
) -> Enquiry | None:
    """Fetch an enquiry with messages, status events, and follow-ups eager-loaded."""
    stmt = (
        select(Enquiry)
        .where(Enquiry.id == enquiry_id, Enquiry.tenant_id == tenant_id)
        .options(
            selectinload(Enquiry.messages),
            selectinload(Enquiry.status_events),
            selectinload(Enquiry.followups),
        )
    )
    return db.execute(stmt).scalar_one_or_none()


# ---------------------------------------------------------------------------
# Writes
# ---------------------------------------------------------------------------

def create_enquiry(
    db: Session,
    *,
    tenant_id: str,
    channel: str,
    customer_name: str,
    message: str,
) -> Enquiry:
    """Persist a new enquiry plus its first conversation message and status event."""
    enquiry = Enquiry(
        tenant_id=tenant_id,
        channel=channel,
        customer_name=customer_name,
        message=message,
        status=EnquiryStatus.NEW,
    )
    db.add(enquiry)
    db.flush()  # populate enquiry.id before adding children

    db.add(
        ConversationMessage(
            enquiry_id=enquiry.id, role=MessageRole.CUSTOMER, content=message
        )
    )
    db.add(StatusEvent(enquiry_id=enquiry.id, from_status=None, to_status=EnquiryStatus.NEW))

    db.commit()
    db.refresh(enquiry)

    logger.info(
        "enquiry.created",
        enquiry_id=enquiry.id,
        tenant_id=tenant_id,
        channel=channel,
        customer_name=customer_name,
    )
    return enquiry


def _transition_status(
    db: Session, enquiry: Enquiry, *, to_status: str, reason: str | None = None
) -> None:
    """Move an enquiry to a new status and append a status event."""
    if enquiry.status == to_status:
        # Idempotent — log and skip duplicating the timeline.
        logger.info(
            "enquiry.status.noop",
            enquiry_id=enquiry.id,
            status=to_status,
            reason=reason,
        )
        return

    db.add(
        StatusEvent(
            enquiry_id=enquiry.id,
            from_status=enquiry.status,
            to_status=to_status,
            reason=reason,
        )
    )
    enquiry.status = to_status


def process_enquiry(enquiry_id: str, tenant_id: str) -> None:
    """Background worker: match an SOP, persist the result, or escalate.

    This function opens its own DB session because it runs outside the FastAPI
    request lifecycle (BackgroundTasks dispatches it after the response is
    flushed). Errors are logged but never re-raised — there is no client to
    surface them to.
    """
    # Local import keeps the module import-time dependency graph clean.
    from app.database import SessionLocal

    if settings.sop_match_artificial_delay_ms:
        time.sleep(settings.sop_match_artificial_delay_ms / 1000)

    db = SessionLocal()
    try:
        enquiry = get_enquiry(db, enquiry_id, tenant_id)
        if enquiry is None:
            logger.warning(
                "enquiry.process.not_found", enquiry_id=enquiry_id, tenant_id=tenant_id
            )
            return

        _transition_status(db, enquiry, to_status=EnquiryStatus.PROCESSING)

        sop = match_sop(enquiry.message)
        if sop is None:
            _transition_status(
                db,
                enquiry,
                to_status=EnquiryStatus.ESCALATED,
                reason="No SOP matched — automatically escalated to a human agent.",
            )
            db.add(
                ConversationMessage(
                    enquiry_id=enquiry.id,
                    role=MessageRole.SYSTEM,
                    content="No SOP matched — escalated to a human agent.",
                )
            )
            db.commit()
            logger.warning(
                "enquiry.escalation.triggered",
                enquiry_id=enquiry.id,
                tenant_id=tenant_id,
                reason="no_sop_match",
            )
            return

        enquiry.matched_sop = sop.code
        enquiry.suggested_response = sop.suggested_response
        _transition_status(db, enquiry, to_status=EnquiryStatus.QUALIFIED)
        db.add(
            ConversationMessage(
                enquiry_id=enquiry.id,
                role=MessageRole.AI,
                content=sop.suggested_response,
            )
        )
        db.commit()
        logger.info(
            "enquiry.sop.matched",
            enquiry_id=enquiry.id,
            tenant_id=tenant_id,
            sop=sop.code,
            sop_label=sop.label,
        )
        logger.info(
            "enquiry.task.processed",
            enquiry_id=enquiry.id,
            tenant_id=tenant_id,
            outcome="qualified",
        )
    except Exception as exc:  # noqa: BLE001 — last-resort safety net
        db.rollback()
        logger.error(
            "enquiry.process.failed",
            enquiry_id=enquiry_id,
            tenant_id=tenant_id,
            error=str(exc),
            exc_info=True,
        )
    finally:
        db.close()


def schedule_followup(
    db: Session,
    *,
    enquiry: Enquiry,
    delay_minutes: int,
    message_template: str | None,
) -> FollowUp:
    """Create a pending follow-up scheduled ``delay_minutes`` from now."""
    scheduled_for = datetime.now(timezone.utc) + timedelta(minutes=delay_minutes)
    followup = FollowUp(
        enquiry_id=enquiry.id,
        scheduled_for=scheduled_for,
        message_template=message_template,
        status=FollowUpStatus.PENDING,
    )
    db.add(followup)
    db.commit()
    db.refresh(followup)

    logger.info(
        "followup.scheduled",
        enquiry_id=enquiry.id,
        followup_id=followup.id,
        scheduled_for=scheduled_for.isoformat(),
        delay_minutes=delay_minutes,
    )
    return followup


def escalate_enquiry(db: Session, *, enquiry: Enquiry, reason: str) -> Enquiry:
    """Mark an enquiry as escalated to a human agent."""
    _transition_status(db, enquiry, to_status=EnquiryStatus.ESCALATED, reason=reason)
    db.add(
        ConversationMessage(
            enquiry_id=enquiry.id,
            role=MessageRole.SYSTEM,
            content=f"Manually escalated: {reason}",
        )
    )
    db.commit()
    db.refresh(enquiry)
    logger.warning(
        "enquiry.escalation.manual",
        enquiry_id=enquiry.id,
        tenant_id=enquiry.tenant_id,
        reason=reason,
    )
    return enquiry
