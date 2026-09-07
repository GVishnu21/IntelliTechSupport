"""Unit tests for the in-memory session state machine (app/orchestration/engine.py).

Pure and DB/network-free: everything here operates on the module-level
_SESSIONS dict via VisionReading objects.
"""

from app.orchestration.engine import get_session, skip_step, start_session, verify_step
from app.vision.base import VisionReading


def unhealthy_reading(equipment="Netgear Nighthawk R7000"):
    return VisionReading(
        equipment=equipment,
        confidence=0.9,
        status_lights={"power": "solid_green", "internet": "blinking_red", "wifi": "solid_green"},
    )


def healthy_reading(equipment="Netgear Nighthawk R7000"):
    return VisionReading(
        equipment=equipment,
        confidence=0.9,
        status_lights={"power": "solid_green", "internet": "solid_green", "wifi": "solid_green"},
    )


class TestStartSession:
    def test_unhealthy_reading_returns_the_first_step(self):
        session, first_step = start_session(unhealthy_reading())

        assert session.resolved is False
        assert first_step is not None
        assert first_step == session.steps[0]
        assert get_session(session.id) is session

    def test_healthy_reading_is_resolved_immediately_with_no_step(self):
        session, first_step = start_session(healthy_reading())

        assert session.resolved is True
        assert first_step is None
        assert session.history == []


class TestVerifyStep:
    def test_healthy_photo_resolves_and_records_completed_history(self):
        session, _ = start_session(unhealthy_reading())

        resolved, escalate, next_step = verify_step(session.id, healthy_reading())

        assert resolved is True
        assert escalate is False
        assert next_step is None
        assert session.history == [{"step": session.steps[0]["instruction"], "outcome": "completed"}]
        assert session.resolved is True

    def test_unhealthy_photo_advances_to_the_next_step_and_records_failed(self):
        session, _ = start_session(unhealthy_reading())

        resolved, escalate, next_step = verify_step(session.id, unhealthy_reading())

        assert resolved is False
        assert escalate is False
        assert next_step == session.steps[1]
        assert session.step_index == 1
        assert session.history == [{"step": session.steps[0]["instruction"], "outcome": "failed"}]

    def test_running_out_of_steps_escalates(self):
        session, _ = start_session(unhealthy_reading())
        total_steps = len(session.steps)

        result = None
        for _ in range(total_steps):
            result = verify_step(session.id, unhealthy_reading())

        resolved, escalate, next_step = result
        assert resolved is False
        assert escalate is True
        assert next_step is None
        assert session.step_index == total_steps
        assert len(session.history) == total_steps
        assert all(item["outcome"] == "failed" for item in session.history)

    def test_unknown_session_id_escalates_without_crashing(self):
        resolved, escalate, next_step = verify_step("does-not-exist", unhealthy_reading())

        assert resolved is False
        assert escalate is True
        assert next_step is None

    def test_last_status_lights_is_updated_from_the_latest_reading(self):
        session, _ = start_session(unhealthy_reading())
        new_reading = unhealthy_reading()
        new_reading.status_lights = {"power": "off"}

        verify_step(session.id, new_reading)

        assert session.last_status_lights == {"power": "off"}


class TestSkipStep:
    def test_skip_advances_and_records_skipped_history(self):
        session, _ = start_session(unhealthy_reading())
        first_instruction = session.steps[0]["instruction"]

        escalate, next_step = skip_step(session.id)

        assert escalate is False
        assert next_step == session.steps[1]
        assert session.step_index == 1
        assert session.history == [{"step": first_instruction, "outcome": "skipped"}]

    def test_skipping_never_resolves_and_escalates_once_steps_run_out(self):
        session, _ = start_session(unhealthy_reading())
        total_steps = len(session.steps)

        result = None
        for _ in range(total_steps):
            result = skip_step(session.id)

        escalate, next_step = result
        assert escalate is True
        assert next_step is None
        assert session.resolved is False
        assert len(session.history) == total_steps
        assert all(item["outcome"] == "skipped" for item in session.history)

    def test_unknown_session_id_escalates_without_crashing(self):
        escalate, next_step = skip_step("does-not-exist")

        assert escalate is True
        assert next_step is None


class TestGetSession:
    def test_returns_none_for_unknown_id(self):
        assert get_session("does-not-exist") is None
