"""Pydantic request/response schemas.

Every schema carries ``json_schema_extra`` examples so the auto-generated
``/docs`` page is fully populated — a working playground rather than empty
field placeholders.
"""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# Channel + status string literals are mirrored from models.py so the OpenAPI
# spec advertises the exact allowed values.
ChannelLiteral = Literal["whatsapp", "email", "call"]
StatusLiteral = Literal["new", "processing", "qualified", "escalated", "resolved"]


# ---------------------------------------------------------------------------
# Enquiry creation
# ---------------------------------------------------------------------------

class EnquiryCreate(BaseModel):
    channel: ChannelLiteral = Field(..., description="Inbound channel.")
    customer_name: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1, max_length=5000)

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "channel": "whatsapp",
                    "customer_name": "Sarah M.",
                    "message": "Hi, can I get a quote for the deluxe package?",
                }
            ]
        }
    )


class EnquiryAccepted(BaseModel):
    """202 response — the enquiry has been queued for async processing."""

    job_id: str = Field(..., description="Use this to poll /enquiry/{id}/history.")
    status: StatusLiteral
    message: str = "Enquiry accepted for processing."

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "job_id": "f4b8a2e0-1c9d-4f7a-9c3b-2e1d8a7b6c5a",
                    "status": "processing",
                    "message": "Enquiry accepted for processing.",
                }
            ]
        }
    )


# ---------------------------------------------------------------------------
# Follow-up
# ---------------------------------------------------------------------------

class FollowUpCreate(BaseModel):
    delay_minutes: int = Field(..., ge=1, le=60 * 24 * 30, description="Minutes from now.")
    message_template: str | None = Field(
        default=None,
        max_length=2000,
        description="Optional template; the worker fills in customer details at send time.",
    )

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "delay_minutes": 60,
                    "message_template": "Hi {{customer_name}}, just checking in on your enquiry.",
                }
            ]
        }
    )


class FollowUpRead(BaseModel):
    id: str
    enquiry_id: str
    scheduled_for: datetime
    message_template: str | None
    status: Literal["pending", "sent", "cancelled"]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Escalation
# ---------------------------------------------------------------------------

class EscalationCreate(BaseModel):
    reason: str = Field(..., min_length=1, max_length=1000)

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [{"reason": "Customer requested to speak with a manager."}]
        }
    )


# ---------------------------------------------------------------------------
# History endpoint
# ---------------------------------------------------------------------------

class ConversationMessageRead(BaseModel):
    id: str
    role: Literal["customer", "agent", "system", "ai"]
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class StatusEventRead(BaseModel):
    id: str
    from_status: StatusLiteral | None
    to_status: StatusLiteral
    reason: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EnquiryRead(BaseModel):
    id: str
    tenant_id: str
    channel: ChannelLiteral
    customer_name: str
    message: str
    status: StatusLiteral
    matched_sop: str | None
    suggested_response: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EnquiryHistory(BaseModel):
    enquiry: EnquiryRead
    messages: list[ConversationMessageRead]
    status_timeline: list[StatusEventRead]
    followups: list[FollowUpRead]


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    database: Literal["ok", "unreachable"]
    version: str
    environment: str


# ---------------------------------------------------------------------------
# Error envelope — consistent shape across every failure case.
# ---------------------------------------------------------------------------

class ErrorResponse(BaseModel):
    detail: str
    code: str | None = None
