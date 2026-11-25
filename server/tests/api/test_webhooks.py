"""API tests: POST /api/webhooks/schedulable-email and /api/v1/schedulable-mail/*."""

from unittest.mock import patch

from tests.conftest import TEST_USER


def _seed_test_user() -> None:
    from app.db import get_firestore

    db = get_firestore()
    db.collection("users").document(TEST_USER["uid"]).set(
        {
            "email": TEST_USER["email"],
            "name": TEST_USER["name"],
            "display_name": TEST_USER["name"],
        }
    )


class TestSchedulableEmailWebhook:
    def test_valid_payload_returns_200_and_calls_processor(self, client, auth_client, db):
        _seed_test_user()
        payload = {
            "sender": "team@example.com",
            "subject": "Quarterly Review Tomorrow at 10am",
            "body": "Let's meet tomorrow at 10:00 AM to review Q4 goals.",
            "receivedAt": "2026-11-25T08:00:00Z",
            "isSchedulable": True,
        }
        with patch("app.services.schedulable_email.processSchedulableEmail") as mock_proc:
            res = client.post("/api/webhooks/schedulable-email", json=payload)

        assert res.status_code == 200
        assert res.json() == {"status": "received", "schedulable": True}
        mock_proc.assert_called_once()
        called_payload = mock_proc.call_args[0][0]
        assert called_payload.sender == "team@example.com"
        assert called_payload.subject == "Quarterly Review Tomorrow at 10am"

        listed = auth_client.get("/api/v1/schedulable-mail")
        assert listed.status_code == 200
        items = listed.json()
        assert len(items) == 1
        assert items[0]["sender"] == "team@example.com"
        assert items[0]["status"] == "pending"

    def test_missing_required_fields_returns_400(self, client, db):
        for bad_payload in (
            {},
            {"sender": "a@b.com", "subject": "Hi"},
            {"sender": "a@b.com", "body": "Hello"},
            {"subject": "Hi", "body": "Hello"},
            {"sender": "", "subject": "Hi", "body": "Hello"},
        ):
            res = client.post("/api/webhooks/schedulable-email", json=bad_payload)
            assert res.status_code == 400

    def test_invalid_json_returns_400(self, client, db):
        res = client.post(
            "/api/webhooks/schedulable-email",
            content="{not valid json",
            headers={"Content-Type": "application/json"},
        )
        assert res.status_code == 400

    def test_webhook_secret_enforced_when_configured(self, client, db, monkeypatch):
        from dataclasses import replace
        from app.api.routes import webhooks as webhooks_route

        monkeypatch.setattr(
            webhooks_route,
            "settings",
            replace(webhooks_route.settings, webhook_secret="top-secret-123"),
        )
        payload = {
            "sender": "team@example.com",
            "subject": "Sync",
            "body": "Tomorrow at 9am",
            "isSchedulable": True,
        }
        res_unauth = client.post("/api/webhooks/schedulable-email", json=payload)
        assert res_unauth.status_code == 401

        res_ok = client.post(
            "/api/webhooks/schedulable-email",
            json=payload,
            headers={"X-Webhook-Secret": "top-secret-123"},
        )
        assert res_ok.status_code == 200


class TestSchedulableMailActions:
    def test_schedule_to_calendar_and_eve(self, client, auth_client, db):
        _seed_test_user()
        res = client.post(
            "/api/webhooks/schedulable-email",
            json={
                "sender": "pm@example.com",
                "subject": "Design Review",
                "body": "Please review the mockups by Friday.",
                "isSchedulable": True,
            },
        )
        assert res.status_code == 200
        email_id = auth_client.get("/api/v1/schedulable-mail").json()[0]["id"]

        cal_res = auth_client.post(
            f"/api/v1/schedulable-mail/{email_id}/schedule-todo",
            json={"title": "Design Review", "due_date": "2026-11-27", "target": "calendar"},
        )
        assert cal_res.status_code == 200
        data = cal_res.json()
        assert data["email"]["status"] == "scheduled"
        assert data["email"]["scheduled_target"] == "calendar"
        assert data["todo"]["title"] == "Design Review"
        assert data["todo"]["due_date"] == "2026-11-27"

        eve_res = auth_client.post(
            f"/api/v1/schedulable-mail/{email_id}/schedule-eve",
            json={"title": "Design Review Follow-up", "schedule_type": "one_time"},
        )
        assert eve_res.status_code == 200
        assert eve_res.json()["email"]["scheduled_target"] == "eve_schedule"
