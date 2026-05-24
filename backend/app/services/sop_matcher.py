"""Standard Operating Procedure matcher.

The assignment asks for 3–5 hardcoded SOPs matched by keywords. We define
five, each with:

* a list of trigger keywords (lower-cased, substring match)
* a suggested response template that the agent dashboard can preview
* a priority — important because real customer messages often hit multiple
  buckets (e.g. "the price was wrong, this is a complaint"). The matcher
  picks the highest-priority hit; if nothing matches, the caller is expected
  to escalate.

This module is intentionally pure: no DB, no I/O. That keeps it trivial to
unit-test and to swap for an ML classifier later without touching callers.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class SOP:
    code: str
    label: str
    keywords: tuple[str, ...]
    suggested_response: str
    priority: int  # higher wins


# After-hours wins over everything when "closed/hours/timing" appears — a
# customer messaging at 2am needs the right framing before pricing/booking
# logic kicks in. Complaint outranks pricing so an angry pricing message
# routes correctly. Order in the list is informational only; ``priority``
# drives selection.
SOPS: tuple[SOP, ...] = (
    SOP(
        code="after_hours",
        label="After-hours message",
        keywords=("closed", "open", "hours", "timing", "when do you", "still open"),
        suggested_response=(
            "Thanks for reaching out! Our team is currently outside business hours. "
            "We'll get back to you first thing tomorrow morning."
        ),
        priority=50,
    ),
    SOP(
        code="complaint",
        label="Complaint",
        keywords=(
            "complaint", "unhappy", "refund", "dissatisfied", "issue", "problem",
            "terrible", "bad", "worst", "angry", "manager",
        ),
        suggested_response=(
            "I'm sorry to hear about this experience. I'm flagging your case for a "
            "senior team member who will reach out within the next hour."
        ),
        priority=40,
    ),
    SOP(
        code="booking_enquiry",
        label="Booking enquiry",
        keywords=("book", "booking", "appointment", "schedule", "reserve", "slot"),
        suggested_response=(
            "Happy to help you book! Could you share your preferred date and time, "
            "and the number of guests?"
        ),
        priority=30,
    ),
    SOP(
        code="pricing_question",
        label="Pricing question",
        keywords=("price", "cost", "quote", "how much", "pricing", "rate", "charges"),
        suggested_response=(
            "Thanks for your interest! Pricing depends on the package — could you "
            "share a little more about what you're looking for so I can send the "
            "right quote?"
        ),
        priority=20,
    ),
    SOP(
        code="product_info",
        label="Product information",
        keywords=("features", "details", "about", "info", "what is", "tell me about"),
        suggested_response=(
            "Sure — happy to walk you through. Which area would you like to start "
            "with: features, integrations, or onboarding?"
        ),
        priority=10,
    ),
)


def match_sop(message: str) -> SOP | None:
    """Return the best-matching SOP for a customer message, or ``None``.

    Strategy: lower-case the message, then iterate through every SOP and check
    each keyword as a substring. We pick the SOP with the highest priority
    among those with at least one keyword hit.
    """
    text = (message or "").lower()
    best: SOP | None = None
    for sop in SOPS:
        if any(keyword in text for keyword in sop.keywords):
            if best is None or sop.priority > best.priority:
                best = sop
    return best
