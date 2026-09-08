"""Shared fixtures for the HTTP-level tests in test_main.py.

Importing app.main runs init_db() at module load time, which would open a
real Postgres connection just to collect tests. That's patched to a no-op
here, before app.main is ever imported, so the whole suite runs offline --
every DB-touching function app.main calls is then replaced per-test with an
in-memory fake (see fake_db below), and the vision engine with a
fully-controllable fake (see set_vision_reading).
"""

import app.db

app.db.init_db = lambda: None

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app as fastapi_app  # noqa: E402
from app.vision.base import VisionReading  # noqa: E402


class FakeVisionEngine:
    def __init__(self, reading: VisionReading):
        self.reading = reading
        self.calls: list[str] = []
        self.session_ids: list[str | None] = []

    def interpret(self, image_base64: str, session_id: str | None = None) -> VisionReading:
        self.calls.append(image_base64)
        self.session_ids.append(session_id)
        return self.reading


class FakeDb:
    """In-memory stand-in for every DB-touching function app.main imports
    from app.db, so HTTP tests never open a real Postgres connection."""

    def __init__(self):
        self.scans: dict[str, dict] = {}
        self.tickets: dict[str, dict] = {}
        self.customers: dict[str, dict] = {}  # keyed by phone, the natural key
        self.scan_outcome_calls: list[dict] = []
        self.feedback_calls: list[tuple] = []
        self.analytics_summary: dict = {
            "total_scans": 0,
            "resolution_rate": 0.0,
            "escalation_rate": 0.0,
            "first_contact_resolution": 0.0,
            "avg_resolution_time_seconds": None,
            "csat": None,
            "resolution_trend": [],
            "escalation_trend": [],
            "top_troubleshooting_steps": [],
        }

    def create_scan(self, scan_id, session_id, equipment, outcome):
        self.scans[scan_id] = {
            "id": scan_id,
            "session_id": session_id,
            "equipment": equipment,
            "outcome": outcome,
            "steps_completed": 0,
            "history": [],
            "rating": None,
            "feedback": None,
            "created_at": "2026-09-07T00:00:00Z",
        }

    def update_scan_outcome(self, session_id, outcome, steps_completed, history):
        self.scan_outcome_calls.append(
            {"session_id": session_id, "outcome": outcome, "steps_completed": steps_completed, "history": history}
        )
        for scan in self.scans.values():
            if scan["session_id"] == session_id:
                scan["outcome"] = outcome
                scan["steps_completed"] = steps_completed
                scan["history"] = history

    def update_scan_feedback(self, scan_id, rating, feedback):
        self.feedback_calls.append((scan_id, rating, feedback))
        scan = self.scans.get(scan_id)
        if scan is None:
            return None
        scan["rating"] = rating
        scan["feedback"] = feedback
        return scan

    def create_ticket(
        self, ticket_id, session_id, equipment, status_lights, history, contact_phone=None, contact_phone_verified=False
    ):
        self.tickets[ticket_id] = {
            "id": ticket_id,
            "session_id": session_id,
            "equipment": equipment,
            "status": "escalated",
            "status_lights": status_lights,
            "history": history,
            "contact_phone": contact_phone,
            "contact_phone_verified": contact_phone_verified,
            "created_at": "2026-09-07T00:00:00Z",
        }

    def upsert_customer(self, customer_id, phone, name, city):
        existing = self.customers.get(phone)
        customer = {"id": existing["id"] if existing else customer_id, "phone": phone, "name": name, "city": city}
        self.customers[phone] = customer
        return customer

    def list_tickets(self):
        return list(self.tickets.values())

    def get_ticket(self, ticket_id):
        return self.tickets.get(ticket_id)

    def update_ticket_status(self, ticket_id, status):
        ticket = self.tickets.get(ticket_id)
        if ticket is None:
            return None
        ticket["status"] = status
        return ticket

    def get_scans_summary(self):
        return self.analytics_summary

    def get_recent_feedback(self, limit=20):
        rated = [scan for scan in self.scans.values() if scan.get("rating") is not None]
        rated.sort(key=lambda scan: scan["created_at"], reverse=True)
        return rated[:limit]

    def get_feedback(self, scan_id):
        scan = self.scans.get(scan_id)
        if scan is None or scan.get("rating") is None:
            return None
        return scan

    def get_feedback_summary(self):
        rated = [scan for scan in self.scans.values() if scan.get("rating") is not None]
        total = len(rated)
        return {
            "total": total,
            "average_rating": (sum(s["rating"] for s in rated) / total) if total else None,
            "five_star_percent": (sum(1 for s in rated if s["rating"] == 5) / total) if total else 0.0,
            "low_rating_count": sum(1 for s in rated if s["rating"] <= 2),
        }


@pytest.fixture
def fake_db(monkeypatch):
    db = FakeDb()
    for name in (
        "create_scan",
        "update_scan_outcome",
        "update_scan_feedback",
        "create_ticket",
        "upsert_customer",
        "list_tickets",
        "get_ticket",
        "update_ticket_status",
        "get_scans_summary",
        "get_recent_feedback",
        "get_feedback",
        "get_feedback_summary",
    ):
        monkeypatch.setattr(f"app.main.{name}", getattr(db, name))
    return db


@pytest.fixture
def set_vision_reading(monkeypatch):
    """Call with a VisionReading to control what the next /diagnose or
    /verify-step call sees, without touching the real Gemini/mock engine."""

    def _set(reading: VisionReading) -> FakeVisionEngine:
        engine = FakeVisionEngine(reading)
        monkeypatch.setattr("app.main.get_vision_engine", lambda: engine)
        return engine

    return _set


@pytest.fixture
def client(fake_db):
    return TestClient(fastapi_app)


@pytest.fixture
def admin_headers():
    from app.auth import create_admin_token

    return {"Authorization": f"Bearer {create_admin_token()}"}
