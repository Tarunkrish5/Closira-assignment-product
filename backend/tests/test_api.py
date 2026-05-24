"""End-to-end smoke tests using FastAPI's TestClient.

Run with: ``pytest -q``

These tests exercise every endpoint and the background-task path. We use the
real SQLite engine (in a temporary file) so the SQL we generate is actually
exercised — a true in-memory test runs faster but lets dialect bugs hide.
"""
from __future__ import annotations

import os
import tempfile
import time
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="module")
def client() -> Iterator[TestClient]:
    # Use an isolated SQLite file per test run so we never collide with the
    # dev database next to the source tree.
    tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    tmp.close()
    os.environ["DATABASE_URL"] = f"sqlite:///{tmp.name}"

    # Import after env vars are set so settings pick them up.
    from app.main import app  # noqa: WPS433

    with TestClient(app) as c:
        yield c

    os.unlink(tmp.name)


def test_health(client: TestClient) -> None:
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["database"] == "ok"


def test_create_enquiry_returns_202_and_processes_in_background(client: TestClient) -> None:
    resp = client.post(
        "/enquiry",
        json={
            "channel": "whatsapp",
            "customer_name": "Sarah M.",
            "message": "How much does the deluxe package cost?",
        },
    )
    assert resp.status_code == 202
    job_id = resp.json()["job_id"]

    # BackgroundTasks runs after the response — give it a brief moment.
    for _ in range(20):
        time.sleep(0.05)
        history = client.get(f"/enquiry/{job_id}/history").json()
        if history["enquiry"]["status"] in ("qualified", "escalated"):
            break

    assert history["enquiry"]["status"] == "qualified"
    assert history["enquiry"]["matched_sop"] == "pricing_question"
    # Customer message + AI reply
    assert len(history["messages"]) == 2


def test_no_sop_match_auto_escalates(client: TestClient) -> None:
    resp = client.post(
        "/enquiry",
        json={
            "channel": "call",
            "customer_name": "Anita P.",
            "message": "Just calling to say hello.",
        },
    )
    job_id = resp.json()["job_id"]

    for _ in range(20):
        time.sleep(0.05)
        history = client.get(f"/enquiry/{job_id}/history").json()
        if history["enquiry"]["status"] == "escalated":
            break

    assert history["enquiry"]["status"] == "escalated"
    # Status timeline: new -> processing -> escalated
    statuses = [s["to_status"] for s in history["status_timeline"]]
    assert statuses == ["new", "processing", "escalated"]


def test_manual_escalate_and_followup(client: TestClient) -> None:
    create = client.post(
        "/enquiry",
        json={"channel": "email", "customer_name": "Test", "message": "Hello there"},
    ).json()
    eid = create["job_id"]

    # Schedule a follow-up
    fu = client.post(f"/enquiry/{eid}/followup", json={"delay_minutes": 30})
    assert fu.status_code == 201
    assert fu.json()["status"] == "pending"

    # Manually escalate
    esc = client.post(f"/enquiry/{eid}/escalate", json={"reason": "VIP customer"})
    assert esc.status_code == 200
    assert esc.json()["status"] == "escalated"


def test_404_on_unknown_enquiry(client: TestClient) -> None:
    resp = client.get("/enquiry/00000000-0000-0000-0000-000000000000/history")
    assert resp.status_code == 404


def test_422_on_invalid_payload(client: TestClient) -> None:
    resp = client.post(
        "/enquiry",
        json={"channel": "smoke_signal", "customer_name": "", "message": ""},
    )
    assert resp.status_code == 422
