"""SQLAlchemy ORM models for the enquiry pipeline.

Schema reasoning (see README for the full write-up):

* ``Enquiry`` is the aggregate root. It owns its conversation, status timeline,
  and scheduled follow-ups. ``tenant_id`` is included on every row so the same
  tables can serve every SMB on the platform — even though auth is stubbed in
  this assignment, the schema is multi-tenant from day one.
* ``ConversationMessage`` is append-only. We never mutate messages, which keeps
  the history endpoint a simple ordered read and makes audit trails trivial.
* ``StatusEvent`` is also append-only. The current ``Enquiry.status`` is
  derived/cached state; the timeline is the source of truth.
* ``FollowUp`` lets the platform replay scheduled outbound nudges. Its own
  status is decoupled from the parent enquiry so a follow-up can be cancelled
  independently.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Enumerated string constants — kept as plain strings rather than DB enums so
# the schema is portable across SQLite and Postgres without migrations.
# ---------------------------------------------------------------------------

class Channel:
    WHATSAPP = "whatsapp"
    EMAIL = "email"
    CALL = "call"
    ALL = (WHATSAPP, EMAIL, CALL)


class EnquiryStatus:
    NEW = "new"
    PROCESSING = "processing"
    QUALIFIED = "qualified"
    ESCALATED = "escalated"
    RESOLVED = "resolved"
    ALL = (NEW, PROCESSING, QUALIFIED, ESCALATED, RESOLVED)


class MessageRole:
    CUSTOMER = "customer"
    AGENT = "agent"
    SYSTEM = "system"
    AI = "ai"


class FollowUpStatus:
    PENDING = "pending"
    SENT = "sent"
    CANCELLED = "cancelled"


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class Enquiry(Base):
    """An inbound customer enquiry — the aggregate root of the pipeline."""

    __tablename__ = "enquiries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    tenant_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)

    channel: Mapped[str] = mapped_column(String(16), nullable=False)
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)

    status: Mapped[str] = mapped_column(
        String(16), nullable=False, default=EnquiryStatus.NEW, index=True
    )
    matched_sop: Mapped[str | None] = mapped_column(String(64), nullable=True)
    suggested_response: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow, nullable=False
    )

    # Relationships — cascade so deleting an enquiry tidies its history.
    messages: Mapped[list["ConversationMessage"]] = relationship(
        back_populates="enquiry",
        cascade="all, delete-orphan",
        order_by="ConversationMessage.created_at",
    )
    status_events: Mapped[list["StatusEvent"]] = relationship(
        back_populates="enquiry",
        cascade="all, delete-orphan",
        order_by="StatusEvent.created_at",
    )
    followups: Mapped[list["FollowUp"]] = relationship(
        back_populates="enquiry",
        cascade="all, delete-orphan",
        order_by="FollowUp.scheduled_for",
    )

    __table_args__ = (
        Index("ix_enquiries_tenant_status", "tenant_id", "status"),
        Index("ix_enquiries_tenant_created", "tenant_id", "created_at"),
    )


class ConversationMessage(Base):
    """Append-only message in an enquiry's conversation thread."""

    __tablename__ = "conversation_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    enquiry_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("enquiries.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[str] = mapped_column(String(16), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )

    enquiry: Mapped["Enquiry"] = relationship(back_populates="messages")

    __table_args__ = (Index("ix_messages_enquiry_created", "enquiry_id", "created_at"),)


class StatusEvent(Base):
    """Append-only transition in the enquiry's status timeline."""

    __tablename__ = "status_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    enquiry_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("enquiries.id", ondelete="CASCADE"), nullable=False
    )
    from_status: Mapped[str | None] = mapped_column(String(16), nullable=True)
    to_status: Mapped[str] = mapped_column(String(16), nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )

    enquiry: Mapped["Enquiry"] = relationship(back_populates="status_events")

    __table_args__ = (Index("ix_status_enquiry_created", "enquiry_id", "created_at"),)


class FollowUp(Base):
    """Scheduled outbound follow-up message for an enquiry."""

    __tablename__ = "followups"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    enquiry_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("enquiries.id", ondelete="CASCADE"), nullable=False
    )
    scheduled_for: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    message_template: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(16), nullable=False, default=FollowUpStatus.PENDING
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )

    enquiry: Mapped["Enquiry"] = relationship(back_populates="followups")

    __table_args__ = (Index("ix_followups_status_scheduled", "status", "scheduled_for"),)
