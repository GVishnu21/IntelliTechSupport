"""Unit tests for the mock vision engine (app/vision/mock_adapter.py).

This used to track a single process-wide call counter (`self._calls`),
becoming permanently "healthy" after the 2nd call ever made -- across every
customer/session sharing the cached engine instance. Behavior is now keyed
on whether a session_id was passed (present only for /verify-step, never
for /diagnose), so it can't cross-contaminate between sessions.
"""

from app.vision.mock_adapter import MockVisionEngine


def test_diagnose_style_call_with_no_session_reports_unhealthy():
    engine = MockVisionEngine()

    reading = engine.interpret("fake-image", session_id=None)

    assert reading.status_lights["online"] == "blinking_amber"


def test_verify_step_style_call_with_a_session_reports_healthy():
    engine = MockVisionEngine()

    reading = engine.interpret("fake-image", session_id="session-1")

    assert reading.status_lights["online"] == "solid_green"


def test_two_interleaved_sessions_do_not_contaminate_each_other():
    engine = MockVisionEngine()

    # Session A's initial /diagnose call.
    reading_a = engine.interpret("fake-image", session_id=None)
    # Session B's /verify-step call, interleaved on the same cached engine
    # before A ever calls /verify-step itself.
    reading_b = engine.interpret("fake-image", session_id="session-b")

    assert reading_a.status_lights["online"] == "blinking_amber"
    assert reading_b.status_lights["online"] == "solid_green"
