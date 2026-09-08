"""HTTP-level tests for app/main.py's endpoints.

All DB access is replaced by the fake_db fixture (conftest.py) and all
vision calls by set_vision_reading -- no real Postgres or Gemini traffic.
Session state itself (app.orchestration.engine) is real, so these tests
exercise the actual wiring between the HTTP layer and the state machine.
"""

import pytest

from app.otp.dev_adapter import DEV_OTP_CODE
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


class TestSelectEquipment:
    def test_unknown_equipment_is_a_400(self, client):
        res = client.post(
            "/select-equipment", json={"equipment": "Not A Real Router", "fault_light_state": "off"}
        )
        assert res.status_code == 400

    def test_unknown_light_state_is_a_400(self, client):
        res = client.post(
            "/select-equipment", json={"equipment": EQUIPMENT, "fault_light_state": "shiny"}
        )
        assert res.status_code == 400

    def test_reported_fault_state_returns_a_real_first_step(self, client, fake_db):
        res = client.post(
            "/select-equipment",
            json={"equipment": EQUIPMENT, "fault_light_state": "blinking_red"},
        )

        assert res.status_code == 200
        body = res.json()
        assert body["low_confidence"] is False
        assert body["session_id"] == body["scan_id"]
        assert body["next_step"]["step_number"] == 1
        assert fake_db.scans[body["scan_id"]]["outcome"] == "in_progress"

    def test_reported_healthy_state_resolves_immediately(self, client, fake_db):
        res = client.post(
            "/select-equipment",
            json={"equipment": EQUIPMENT, "fault_light_state": "solid_green"},
        )

        body = res.json()
        assert body["next_step"] is None
        assert fake_db.scans[body["scan_id"]]["outcome"] == "resolved"

    def test_returned_session_id_works_against_verify_step(self, client, fake_db, set_vision_reading):
        diagnosis = client.post(
            "/select-equipment",
            json={"equipment": EQUIPMENT, "fault_light_state": "blinking_red"},
        ).json()

        set_vision_reading(healthy_reading())
        res = client.post(
            "/verify-step", json={"image_base64": "fake", "session_id": diagnosis["session_id"]}
        )

        body = res.json()
        assert body["resolved"] is True
        assert body["escalate"] is False


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
        # Providing a number is not the same as verifying it -- never
        # blocked, but never assumed verified either.
        assert ticket["contact_phone_verified"] is False


class TestEscalateOtp:
    def test_send_otp_does_not_require_admin_auth(self, client):
        res = client.post("/escalate/send-otp", json={"contact_phone": "555-0100"})
        assert res.status_code == 200

    def test_verify_otp_with_the_dev_code_succeeds(self, client):
        res = client.post("/escalate/verify-otp", json={"contact_phone": "555-0100", "code": DEV_OTP_CODE})

        assert res.status_code == 200
        assert res.json()["verified_token"]

    def test_verify_otp_with_the_wrong_code_is_a_401(self, client):
        res = client.post("/escalate/verify-otp", json={"contact_phone": "555-0100", "code": "000000"})
        assert res.status_code == 401

    def test_escalating_with_a_valid_verified_token_marks_the_ticket_verified(self, client, fake_db):
        verify_res = client.post("/escalate/verify-otp", json={"contact_phone": "555-0100", "code": DEV_OTP_CODE})
        token = verify_res.json()["verified_token"]

        res = client.post(
            "/escalate",
            json={"session_id": "does-not-exist", "contact_phone": "555-0100", "phone_verified_token": token},
        )

        ticket = fake_db.tickets[res.json()["ticket_id"]]
        assert ticket["contact_phone_verified"] is True

    def test_escalating_without_a_verified_token_still_succeeds_but_unverified(self, client, fake_db):
        res = client.post("/escalate", json={"session_id": "does-not-exist", "contact_phone": "555-0100"})

        assert res.status_code == 200
        ticket = fake_db.tickets[res.json()["ticket_id"]]
        assert ticket["contact_phone_verified"] is False

    def test_a_verified_token_for_a_different_phone_does_not_count(self, client, fake_db):
        verify_res = client.post("/escalate/verify-otp", json={"contact_phone": "555-0100", "code": DEV_OTP_CODE})
        token = verify_res.json()["verified_token"]

        # Same token, but escalating with a different contact_phone than the
        # one it was actually verified for.
        res = client.post(
            "/escalate",
            json={"session_id": "does-not-exist", "contact_phone": "555-9999", "phone_verified_token": token},
        )

        ticket = fake_db.tickets[res.json()["ticket_id"]]
        assert ticket["contact_phone_verified"] is False


class TestCustomerAuth:
    def test_send_otp_does_not_require_admin_auth(self, client):
        res = client.post("/customer/send-otp", json={"phone": "555-0100"})
        assert res.status_code == 200

    def test_signup_with_the_dev_code_succeeds(self, client):
        res = client.post(
            "/customer/signup",
            json={"name": "Asha Rao", "phone": "555-0100", "city": "Bengaluru", "code": DEV_OTP_CODE},
        )

        assert res.status_code == 200
        body = res.json()
        assert body["token"]
        assert body["name"] == "Asha Rao"
        assert body["phone"] == "555-0100"
        assert body["city"] == "Bengaluru"

    def test_signup_with_the_wrong_code_is_a_401(self, client):
        res = client.post(
            "/customer/signup",
            json={"name": "Asha Rao", "phone": "555-0100", "city": "Bengaluru", "code": "000000"},
        )
        assert res.status_code == 401

    def test_signing_up_again_with_the_same_phone_updates_the_existing_row_not_a_duplicate(self, client, fake_db):
        client.post(
            "/customer/signup",
            json={"name": "Asha Rao", "phone": "555-0100", "city": "Bengaluru", "code": DEV_OTP_CODE},
        )
        second = client.post(
            "/customer/signup",
            json={"name": "Asha R.", "phone": "555-0100", "city": "Mumbai", "code": DEV_OTP_CODE},
        )

        assert second.json()["name"] == "Asha R."
        assert second.json()["city"] == "Mumbai"
        assert len(fake_db.customers) == 1


class TestTickets:
    def test_list_tickets_requires_admin_auth(self, client, fake_db):
        res = client.get("/tickets")
        assert res.status_code == 401

    def test_list_tickets(self, client, fake_db, admin_headers):
        fake_db.create_ticket("ITS-1", None, "unknown", {}, [])

        res = client.get("/tickets", headers=admin_headers)

        assert res.status_code == 200
        assert len(res.json()) == 1

    def test_get_ticket_404_when_missing(self, client, admin_headers):
        res = client.get("/tickets/does-not-exist", headers=admin_headers)
        assert res.status_code == 404

    def test_get_ticket_found(self, client, fake_db, admin_headers):
        fake_db.create_ticket("ITS-1", None, "unknown", {}, [])

        res = client.get("/tickets/ITS-1", headers=admin_headers)

        assert res.status_code == 200
        assert res.json()["id"] == "ITS-1"

    def test_patch_status_404_when_missing(self, client, admin_headers):
        res = client.patch("/tickets/does-not-exist", json={"status": "resolved"}, headers=admin_headers)
        assert res.status_code == 404

    def test_patch_status_updates_and_returns_the_ticket(self, client, fake_db, admin_headers):
        fake_db.create_ticket("ITS-1", None, "unknown", {}, [])

        res = client.patch("/tickets/ITS-1", json={"status": "resolved"}, headers=admin_headers)

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

    def test_rating_above_5_is_rejected(self, client, fake_db):
        fake_db.create_scan("scan-1", "session-1", EQUIPMENT, "resolved")

        res = client.post("/scans/scan-1/feedback", json={"rating": 999})

        assert res.status_code == 422
        assert fake_db.feedback_calls == []

    def test_rating_below_1_is_rejected(self, client, fake_db):
        fake_db.create_scan("scan-1", "session-1", EQUIPMENT, "resolved")

        res = client.post("/scans/scan-1/feedback", json={"rating": 0})

        assert res.status_code == 422
        assert fake_db.feedback_calls == []


class TestFeedbackRecent:
    def test_requires_admin_auth(self, client, fake_db):
        res = client.get("/feedback/recent")
        assert res.status_code == 401

    def test_only_returns_scans_that_have_a_rating(self, client, fake_db, admin_headers):
        fake_db.create_scan("scan-1", "session-1", EQUIPMENT, "resolved")
        fake_db.create_scan("scan-2", "session-2", EQUIPMENT, "resolved")
        fake_db.update_scan_feedback("scan-1", 4, "Worked great")

        res = client.get("/feedback/recent", headers=admin_headers)

        assert res.status_code == 200
        body = res.json()
        assert len(body) == 1
        assert body[0]["id"] == "scan-1"
        assert body[0]["rating"] == 4
        assert body[0]["feedback"] == "Worked great"

    def test_feedback_without_written_comment_is_still_returned(self, client, fake_db, admin_headers):
        fake_db.create_scan("scan-1", "session-1", EQUIPMENT, "resolved")
        fake_db.update_scan_feedback("scan-1", 5, None)

        res = client.get("/feedback/recent", headers=admin_headers)

        body = res.json()
        assert body[0]["rating"] == 5
        assert body[0]["feedback"] is None

    def test_limit_query_param_is_respected(self, client, fake_db, admin_headers):
        for i in range(3):
            fake_db.create_scan(f"scan-{i}", f"session-{i}", EQUIPMENT, "resolved")
            fake_db.update_scan_feedback(f"scan-{i}", 5, None)

        res = client.get("/feedback/recent?limit=2", headers=admin_headers)

        assert len(res.json()) == 2


class TestFeedbackDetail:
    def test_requires_admin_auth(self, client, fake_db):
        res = client.get("/feedback/scan-1")
        assert res.status_code == 401

    def test_404_when_scan_has_no_feedback(self, client, fake_db, admin_headers):
        fake_db.create_scan("scan-1", "session-1", EQUIPMENT, "resolved")

        res = client.get("/feedback/scan-1", headers=admin_headers)

        assert res.status_code == 404

    def test_404_when_scan_missing_entirely(self, client, fake_db, admin_headers):
        res = client.get("/feedback/does-not-exist", headers=admin_headers)
        assert res.status_code == 404

    def test_returns_the_full_feedback_record(self, client, fake_db, admin_headers):
        fake_db.create_scan("scan-1", "session-1", EQUIPMENT, "resolved")
        fake_db.update_scan_feedback("scan-1", 3, "Took too long")

        res = client.get("/feedback/scan-1", headers=admin_headers)

        assert res.status_code == 200
        body = res.json()
        assert body["id"] == "scan-1"
        assert body["session_id"] == "session-1"
        assert body["equipment"] == EQUIPMENT
        assert body["outcome"] == "resolved"
        assert body["rating"] == 3
        assert body["feedback"] == "Took too long"


class TestFeedbackSummary:
    def test_requires_admin_auth(self, client, fake_db):
        res = client.get("/feedback/summary")
        assert res.status_code == 401

    def test_summary_with_no_feedback_yet(self, client, fake_db, admin_headers):
        res = client.get("/feedback/summary", headers=admin_headers)

        assert res.status_code == 200
        body = res.json()
        assert body["total"] == 0
        assert body["average_rating"] is None
        assert body["five_star_percent"] == 0.0
        assert body["low_rating_count"] == 0

    def test_summary_computes_averages_and_low_ratings(self, client, fake_db, admin_headers):
        fake_db.create_scan("scan-1", "session-1", EQUIPMENT, "resolved")
        fake_db.create_scan("scan-2", "session-2", EQUIPMENT, "resolved")
        fake_db.create_scan("scan-3", "session-3", EQUIPMENT, "resolved")
        fake_db.update_scan_feedback("scan-1", 5, None)
        fake_db.update_scan_feedback("scan-2", 5, None)
        fake_db.update_scan_feedback("scan-3", 1, "Issue not fixed")

        res = client.get("/feedback/summary", headers=admin_headers)

        body = res.json()
        assert body["total"] == 3
        assert body["average_rating"] == pytest.approx(11 / 3)
        assert body["five_star_percent"] == pytest.approx(2 / 3)
        assert body["low_rating_count"] == 1


class TestAnalyticsSummary:
    def test_requires_admin_auth(self, client, fake_db):
        res = client.get("/analytics/summary")
        assert res.status_code == 401

    def test_formats_missing_resolution_time_as_an_em_dash(self, client, fake_db, admin_headers):
        res = client.get("/analytics/summary", headers=admin_headers)

        assert res.status_code == 200
        assert res.json()["avg_resolution_time"] == "—"

    def test_formats_a_real_duration_in_minutes_and_seconds(self, client, fake_db, admin_headers):
        fake_db.analytics_summary["avg_resolution_time_seconds"] = 125.4

        res = client.get("/analytics/summary", headers=admin_headers)

        assert res.json()["avg_resolution_time"] == "2m 5s"

    def test_passes_through_the_rest_of_the_summary_unchanged(self, client, fake_db, admin_headers):
        fake_db.analytics_summary.update(
            {
                "total_scans": 10,
                "resolution_rate": 0.8,
                "csat": 4.5,
                "top_troubleshooting_steps": [{"label": "Restart the router", "count": 3}],
            }
        )

        body = client.get("/analytics/summary", headers=admin_headers).json()

        assert body["total_scans"] == 10
        assert body["resolution_rate"] == 0.8
        assert body["csat"] == 4.5


class TestAdminLogin:
    def _set_admin_credentials(self, monkeypatch, email="admin@example.com", password="correct-horse"):
        monkeypatch.setattr("app.main.ADMIN_EMAIL", email)
        monkeypatch.setattr("app.main.ADMIN_PASSWORD", password)

    def test_correct_email_and_password_returns_a_working_token(self, client, monkeypatch):
        self._set_admin_credentials(monkeypatch)

        res = client.post("/admin/login", json={"email": "admin@example.com", "password": "correct-horse"})

        assert res.status_code == 200
        token = res.json()["token"]

        protected = client.get("/analytics/summary", headers={"Authorization": f"Bearer {token}"})
        assert protected.status_code == 200

    def test_email_match_is_case_insensitive(self, client, monkeypatch):
        self._set_admin_credentials(monkeypatch)

        res = client.post("/admin/login", json={"email": "Admin@Example.com", "password": "correct-horse"})

        assert res.status_code == 200

    def test_wrong_password_is_a_401(self, client, monkeypatch):
        self._set_admin_credentials(monkeypatch)

        res = client.post("/admin/login", json={"email": "admin@example.com", "password": "wrong"})

        assert res.status_code == 401

    def test_wrong_email_is_a_401(self, client, monkeypatch):
        self._set_admin_credentials(monkeypatch)

        res = client.post("/admin/login", json={"email": "someone-else@example.com", "password": "correct-horse"})

        assert res.status_code == 401

    def test_no_admin_credentials_configured_rejects_every_login(self, client, monkeypatch):
        monkeypatch.setattr("app.main.ADMIN_EMAIL", "")
        monkeypatch.setattr("app.main.ADMIN_PASSWORD", "")

        res = client.post("/admin/login", json={"email": "", "password": ""})

        assert res.status_code == 401

    def test_garbage_token_is_rejected(self, client):
        res = client.get("/analytics/summary", headers={"Authorization": "Bearer not-a-real-token"})
        assert res.status_code == 401

    def test_missing_authorization_header_is_a_401(self, client):
        res = client.get("/tickets")
        assert res.status_code == 401
