"""Unit tests for the in-memory session state machine (app/orchestration/engine.py).

Pure and DB/network-free: everything here operates on the module-level
_SESSIONS dict via VisionReading objects.
"""

from app.orchestration.engine import REBOOT_WAIT_STEP, get_session, skip_step, start_session, verify_step
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


def wifi_off_reading(equipment="Netgear Nighthawk R7000"):
    return VisionReading(
        equipment=equipment,
        confidence=0.9,
        status_lights={"power": "solid_green", "internet": "solid_green", "wifi": "off"},
    )


def rebooting_reading(equipment="Netgear Nighthawk R7000"):
    return VisionReading(
        equipment=equipment,
        confidence=0.9,
        status_lights={"power": "blinking_amber", "internet": "off", "wifi": "off"},
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

    def test_skipping_the_reboot_wait_step_goes_to_real_step_zero_without_skipping_it(self):
        session, first_step = start_session(rebooting_reading())
        assert first_step == REBOOT_WAIT_STEP  # sanity check on the fixture

        escalate, next_step = skip_step(session.id)

        assert escalate is False
        assert next_step == session.steps[0]
        assert session.awaiting_reboot is False
        # step_index must still be 0 -- step 0 hasn't been attempted yet,
        # only the wait step was skipped.
        assert session.step_index == 0
        assert session.history == [{"step": REBOOT_WAIT_STEP["instruction"], "outcome": "skipped"}]

        # And step 0 itself can still be normally skipped afterward.
        escalate, next_step = skip_step(session.id)
        assert escalate is False
        assert next_step == session.steps[1]
        assert session.step_index == 1


class TestGetSession:
    def test_returns_none_for_unknown_id(self):
        assert get_session("does-not-exist") is None


class TestWifiOffDetection:
    def test_wifi_off_is_not_healthy_even_though_internet_is_fine(self):
        session, first_step = start_session(wifi_off_reading())

        assert session.resolved is False
        assert first_step == session.steps[0]

    def test_resolves_once_wifi_comes_back_on(self):
        session, _ = start_session(wifi_off_reading())

        resolved, escalate, next_step = verify_step(session.id, healthy_reading())

        assert resolved is True
        assert escalate is False
        assert next_step is None

    def test_manual_selection_style_reading_with_no_wifi_key_is_unaffected(self):
        # /select-equipment only ever reports the one light the customer was
        # asked about -- wifi is never present. That must not block
        # resolution forever.
        reading = VisionReading(
            equipment="Netgear Nighthawk R7000",
            confidence=1.0,
            status_lights={"internet": "solid_green"},
        )

        session, first_step = start_session(reading)

        assert session.resolved is True
        assert first_step is None


class TestRebootDetection:
    def test_blinking_power_returns_the_wait_step_not_the_first_catalog_step(self):
        session, first_step = start_session(rebooting_reading())

        assert session.resolved is False
        assert session.awaiting_reboot is True
        assert first_step == REBOOT_WAIT_STEP
        assert session.step_index == 0

    def test_still_broken_after_waiting_moves_into_the_real_step_chain_at_step_zero(self):
        session, _ = start_session(rebooting_reading())

        resolved, escalate, next_step = verify_step(session.id, unhealthy_reading())

        assert resolved is False
        assert escalate is False
        assert next_step == session.steps[0]
        assert session.awaiting_reboot is False
        # step_index was never touched while waiting, so step 0 hasn't
        # actually been attempted yet -- it must not be skipped.
        assert session.step_index == 0
        assert session.history == [{"step": REBOOT_WAIT_STEP["instruction"], "outcome": "failed"}]

    def test_resolves_directly_from_the_wait_step_if_it_finished_rebooting_healthy(self):
        session, _ = start_session(rebooting_reading())

        resolved, escalate, next_step = verify_step(session.id, healthy_reading())

        assert resolved is True
        assert escalate is False
        assert next_step is None
        assert session.history == [{"step": REBOOT_WAIT_STEP["instruction"], "outcome": "completed"}]
