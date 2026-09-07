"""HTTP-level tests for app/main.py's endpoints.

All DB access is replaced by the fake_db fixture (conftest.py) and all
vision calls by set_vision_reading -- no real Postgres or Gemini traffic.
Session state itself (app.orchestration.engine) is real, so these tests
exercise the actual wiring between the HTTP layer and the state machine.
"""

from app.vision.base import VisionReading

EQUIPMENT = "Netgear Nighthawk R7000"


def unhealthy_reading():
    return VisionReading(
        equipment=EQUIPMENT,
        confidence=0.9,
        status_lights={"power": "solid_green", "internet": "blinking_red", "wifi": "solid_green"},
    )


def healthy_reading():
    return VisionReading(
        equipment=EQUIPMENT,
        confidence=0.9,
        status_lights={"power": "solid_green", "internet": "solid_green", "wifi": "solid_green"},
    )


def start_real_session(client, set_vision_reading):
    """Drives a real /diagnose call so tests get a session id the in-memory
    engine actually recognizes, rather than a fabricated one."""
    set_vision_reading(unhealthy_reading())
    res = client.post("/diagnose", json={"image_base64": "fake"})
    assert res.status_code == 200
    return res.json()


def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


class TestDiagnose:
    def test_recognized_unhealthy_equipment_returns_first_step(self, client, fake_db, set_vision_reading):
        set_vision_reading(unhealthy_reading())

        res = client.post("/diagnose", json={"image_base64": "fake"})

        assert res.status_code == 200
        body = res.json()
        assert body["low_confidence"] is False
        assert body["equipment"] == EQUIPMENT
        assert body["session_id"] == body["scan_id"]
        assert body["next_step"]["step_number"] == 1
        assert fake_db.scans[body["scan_id"]]["outcome"] == "in_progress"

    def test_recognized_healthy_equipment_has_no_next_step(self, client, fake_db, set_vision_reading):
        set_vision_reading(healthy_reading())

        res = client.post("/diagnose", json={"image_base64": "fake"})

        body = res.json()
        assert body["next_step"] is None
        assert body["low_confidence"] is False
        assert fake_db.scans[body["scan_id"]]["outcome"] == "resolved"

    def test_unrecognized_equipment_is_low_confidence_with_no_session(self, client, fake_db, set_vision_reading):
        set_vision_reading(VisionReading(equipment="unknown", confidence=0.9, status_lights={}))

        res = client.post("/diagnose", json={"image_base64": "fake"})

        body = res.json()
        assert body["low_confidence"] is True
        assert body["session_id"] == ""
        scan = fake_db.scans[body["scan_id"]]
        assert scan["session_id"] is None
        assert scan["outcome"] == "unrecognized"

    def test_confidence_below_threshold_is_low_confidence_even_if_recognized(self, client, fake_db, set_vision_reading):
        set_vision_reading(
            VisionReading(equipment=EQUIPMENT, confidence=0.1, status_lights={"internet": "blinking_red"})
        )

        res = client.post("/diagnose", json={"image_base64": "fake"})

        assert res.json()["low_confidence"] is True


class TestVerifyStep:
    def test_missing_session_id_is_a_400(self, client):
        res = client.post("/verify-step", json={"image_base64": "fake"})
        assert res.status_code == 400

    def test_unknown_session_id_escalates_without_a_db_write(self, client, fake_db, set_vision_reading):
        set_vision_reading(unhealthy_reading())

        res = client.post("/verify-step", json={"image_base64": "fake", "session_id": "does-not-exist"})

        body = res.json()
        assert body["resolved"] is False
        assert body["escalate"] is True
        assert fake_db.scan_outcome_calls == []

    def test_healthy_photo_resolves_and_updates_the_scan(self, client, fake_db, set_vision_reading):
        diagnosis = start_real_session(client, set_vision_reading)

        set_vision_reading(healthy_reading())
        res = client.post(
            "/verify-step", json={"image_base64": "fake", "session_id": diagnosis["session_id"]}
        )

        body = res.json()
        assert body["resolved"] is True
        assert body["escalate"] is False
        assert fake_db.scan_outcome_calls[-1]["outcome"] == "resolved"

    def test_unhealthy_photo_advances_without_concluding_the_scan(self, client, fake_db, set_vision_reading):
        diagnosis = start_real_session(client, set_vision_reading)

        set_vision_reading(unhealthy_reading())
        res = client.post(
            "/verify-step", json={"image_base64": "fake", "session_id": diagnosis["session_id"]}
        )

        body = res.json()
        assert body["resolved"] is False
        assert body["escalate"] is False
        assert body["next_step"]["step_number"] == 2
        assert fake_db.scan_outcome_calls == []

    def test_running_out_of_steps_escalates_and_updates_the_scan(self, client, fake_db, set_vision_reading):
        diagnosis = start_real_session(client, set_vision_reading)
        total_steps = diagnosis["next_step"]["total_steps"]

        set_vision_reading(unhealthy_reading())
        body = None
        for _ in range(total_steps):
            res = client.post(
                "/verify-step", json={"image_base64": "fake", "session_id": diagnosis["session_id"]}
            )
            body = res.json()

        assert body["escalate"] is True
        assert body["next_step"] is None
        assert fake_db.scan_outcome_calls[-1]["outcome"] == "escalated"


class TestSkipStep:
    def test_unknown_session_id_escalates_without_crashing(self, client, fake_db):
        res = client.post("/skip-step", json={"session_id": "does-not-exist"})

        body = res.json()
        assert body["escalate"] is True
        assert body["next_step"] is None
        assert fake_db.scan_outcome_calls == []

    def test_skip_advances_to_the_next_step(self, client, fake_db, set_vision_reading):
        diagnosis = start_real_session(client, set_vision_reading)

        res = client.post("/skip-step", json={"session_id": diagnosis["session_id"]})

        body = res.json()
        assert body["escalate"] is False
        assert body["next_step"]["step_number"] == 2
        assert fake_db.scan_outcome_calls == []

    def test_skipping_every_step_escalates_and_updates_the_scan(self, client, fake_db, set_vision_reading):
        diagnosis = start_real_session(client, set_vision_reading)
        total_steps = diagnosis["next_step"]["total_steps"]

        body = None
        for _ in range(total_steps):
            res = client.post("/skip-step", json={"session_id": diagnosis["session_id"]})
            body = res.json()

        assert body["escalate"] is True
        assert body["next_step"] is None
        assert fake_db.scan_outcome_calls[-1]["outcome"] == "escalated"


class TestEscalate:
    def test_escalating_a_real_session_carries_its_diagnosis(self, client, fake_db, set_vision_reading):
        diagnosis = start_real_session(client, set_vision_reading)

        res = client.post("/escalate", json={"session_id": diagnosis["session_id"]})

        assert res.status_code == 200
        ticket_id = res.json()["ticket_id"]
        assert ticket_id.startswith("ITS-")
        ticket = fake_db.tickets[ticket_id]
        assert ticket["equipment"] == EQUIPMENT
        assert ticket["contact_phone"] is None

    def test_escalating_an_unknown_session_still_creates_a_ticket(self, client, fake_db):
        res = client.post("/escalate", json={"session_id": "does-not-exist"})

        ticket = fake_db.tickets[res.json()["ticket_id"]]
        assert ticket["equipment"] == "unknown"
        assert ticket["status_lights"] == {}
        assert ticket["history"] == []

    def test_contact_phone_is_stored_when_provided(self, client, fake_db):
        res = client.post("/escalate", json={"session_id": "does-not-exist", "contact_phone": "555-0100"})

        ticket = fake_db.tickets[res.json()["ticket_id"]]
        assert ticket["contact_phone"] == "555-0100"


class TestTickets:
    def test_list_tickets(self, client, fake_db):
        fake_db.create_ticket("ITS-1", None, "unknown", {}, [])

        res = client.get("/tickets")

        assert res.status_code == 200
        assert len(res.json()) == 1

    def test_get_ticket_404_when_missing(self, client):
        res = client.get("/tickets/does-not-exist")
        assert res.status_code == 404

    def test_get_ticket_found(self, client, fake_db):
        fake_db.create_ticket("ITS-1", None, "unknown", {}, [])

        res = client.get("/tickets/ITS-1")

        assert res.status_code == 200
        assert res.json()["id"] == "ITS-1"

    def test_patch_status_404_when_missing(self, client):
        res = client.patch("/tickets/does-not-exist", json={"status": "resolved"})
        assert res.status_code == 404

    def test_patch_status_updates_and_returns_the_ticket(self, client, fake_db):
        fake_db.create_ticket("ITS-1", None, "unknown", {}, [])

        res = client.patch("/tickets/ITS-1", json={"status": "resolved"})

        assert res.status_code == 200
        assert res.json()["status"] == "resolved"


class TestScanFeedback:
    def test_404_when_scan_missing(self, client):
        res = client.post("/scans/does-not-exist/feedback", json={"rating": 5})
        assert res.status_code == 404

    def test_records_rating_and_feedback(self, client, fake_db):
        fake_db.create_scan("scan-1", "session-1", EQUIPMENT, "resolved")

        res = client.post("/scans/scan-1/feedback", json={"rating": 5, "feedback": "Great"})

        assert res.status_code == 200
        assert fake_db.feedback_calls == [("scan-1", 5, "Great")]


class TestAnalyticsSummary:
    def test_formats_missing_resolution_time_as_an_em_dash(self, client, fake_db):
        res = client.get("/analytics/summary")

        assert res.status_code == 200
        assert res.json()["avg_resolution_time"] == "—"

    def test_formats_a_real_duration_in_minutes_and_seconds(self, client, fake_db):
        fake_db.analytics_summary["avg_resolution_time_seconds"] = 125.4

        res = client.get("/analytics/summary")

        assert res.json()["avg_resolution_time"] == "2m 5s"

    def test_passes_through_the_rest_of_the_summary_unchanged(self, client, fake_db):
        fake_db.analytics_summary.update(
            {
                "total_scans": 10,
                "resolution_rate": 0.8,
                "csat": 4.5,
                "top_troubleshooting_steps": [{"label": "Restart the router", "count": 3}],
            }
        )

        body = client.get("/analytics/summary").json()

        assert body["total_scans"] == 10
        assert body["resolution_rate"] == 0.8
        assert body["csat"] == 4.5
        assert body["top_troubleshooting_steps"] == [{"label": "Restart the router", "count": 3}]
