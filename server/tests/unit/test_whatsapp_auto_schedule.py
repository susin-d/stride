"""Unit tests for WhatsApp webhook auto-scheduling and notifications."""

from types import SimpleNamespace

import pytest

from app.db import get_firestore
from app.repositories import NotificationRepository, todos as todos_repo
from app.repositories.eve_schedules import EveScheduleRepository
from app.repositories.jobs import JobRepository
from app.schemas.whatsapp import WhatsAppSettings
from app.services.whatsapp import auto_schedule


class _FakeClient:
    def __init__(self, text: str):
        self._text = text
        self.calls = 0

    def call(self, **_kwargs):
        self.calls += 1
        return SimpleNamespace(text=self._text)


class TestParseScheduledItems:
    def test_parses_json_with_markdown_fences(self):
        raw = '```json\n{"items": [{"kind": "todo", "title": "Submit report", "due_date": "2026-12-01"}]}\n```'
        items = auto_schedule.parse_scheduled_items(raw)
        assert len(items) == 1
        assert items[0]["kind"] == "todo"
        assert items[0]["due_date"] == "2026-12-01"

    def test_invalid_json_returns_empty(self):
        assert auto_schedule.parse_scheduled_items("not json") == []
        assert auto_schedule.parse_scheduled_items(None) == []


class TestProcessMessageForScheduling:
    @pytest.mark.asyncio
    async def test_creates_todo_job_and_eve_schedule_and_notifies(self, db, monkeypatch):
        fake_payload = """{
          "items": [
            {"kind": "todo", "title": "Send proposal deck", "due_date": "2026-12-02"},
            {"kind": "job", "company": "Acme Corp", "role": "Backend Engineer", "status": "Interview", "interview_date": "2026-12-04"},
            {"kind": "eve_schedule", "title": "Follow up with Alice", "prompt": "Remind me to ping Alice", "execute_at": "2026-12-03T09:00:00Z"}
          ]
        }"""
        fake_client = _FakeClient(fake_payload)
        broadcasts = []

        async def fake_broadcast(uid, payload):
            broadcasts.append((uid, payload))

        monkeypatch.setattr(auto_schedule, "any_provider_available", lambda: True)
        monkeypatch.setattr(
            auto_schedule,
            "resolve_ai_config",
            lambda _db, _uid: SimpleNamespace(provider="openai", model="gpt-test", client_options={}),
        )
        monkeypatch.setitem(auto_schedule.PROVIDER_CLIENTS, "openai", lambda _opts: fake_client)
        monkeypatch.setattr(auto_schedule.whatsapp_ws_manager, "broadcast_to_user", fake_broadcast)

        database = get_firestore()
        created = await auto_schedule.process_message_for_scheduling(
            database=database,
            user_id="user-1",
            chat_id="15551234567@s.whatsapp.net",
            chat_name="Alice",
            sender_name="Alice",
            content="Please send the proposal deck by Dec 2. Also Acme Corp interview on Dec 4 and remind me Dec 3.",
            is_from_me=False,
            is_group=False,
        )

        assert len(created) == 3
        assert {item["kind"] for item in created} == {"todo", "job", "eve_schedule"}

        saved_todos = todos_repo.list_todos(database, "user-1")
        assert any(t.title == "Send proposal deck" and str(t.due_date) == "2026-12-02" for t in saved_todos)

        jobs, _, _ = JobRepository(database, "user-1").list_page(None, 20)
        assert any(j["company"] == "Acme Corp" and j["role"] == "Backend Engineer" for j in jobs)

        schedules = EveScheduleRepository(database, "user-1").list()
        assert any(s["title"] == "Follow up with Alice" for s in schedules)

        notifs, _, _ = NotificationRepository(database, "user-1").list_page(None, 20)
        assert len(notifs) == 1
        assert notifs[0]["type"] == "whatsapp_scheduled"
        assert "Alice" in notifs[0]["title"]

        assert len(broadcasts) == 1
        assert broadcasts[0][0] == "user-1"
        assert broadcasts[0][1]["type"] == "workspace_scheduled"

    @pytest.mark.asyncio
    async def test_skips_when_disabled_or_ineligible(self, db, monkeypatch):
        fake_client = _FakeClient('{"items": [{"kind": "todo", "title": "Should not run"}]}')
        monkeypatch.setattr(auto_schedule, "any_provider_available", lambda: True)
        monkeypatch.setattr(
            auto_schedule.whatsapp_repo,
            "get_whatsapp_settings",
            lambda _db, _uid: WhatsAppSettings(auto_schedule_enabled=False),
        )

        database = get_firestore()
        res = await auto_schedule.process_message_for_scheduling(
            database=database,
            user_id="user-1",
            chat_id="15551234567@s.whatsapp.net",
            chat_name="Alice",
            sender_name="Alice",
            content="Remind me to submit the report tomorrow",
        )
        assert res == []
        assert fake_client.calls == 0

    @pytest.mark.asyncio
    async def test_deduplicates_identical_todo(self, db, monkeypatch):
        fake_client = _FakeClient('{"items": [{"kind": "todo", "title": "Buy milk", "due_date": "2026-12-01"}]}')
        monkeypatch.setattr(auto_schedule, "any_provider_available", lambda: True)
        monkeypatch.setattr(
            auto_schedule,
            "resolve_ai_config",
            lambda _db, _uid: SimpleNamespace(provider="openai", model="gpt-test", client_options={}),
        )
        monkeypatch.setitem(auto_schedule.PROVIDER_CLIENTS, "openai", lambda _opts: fake_client)

        async def noop_broadcast(_uid, _payload):
            return None

        monkeypatch.setattr(auto_schedule.whatsapp_ws_manager, "broadcast_to_user", noop_broadcast)

        database = get_firestore()
        first = await auto_schedule.process_message_for_scheduling(
            database=database,
            user_id="user-1",
            chat_id="15551234567@s.whatsapp.net",
            chat_name="Alice",
            sender_name="Alice",
            content="Can you buy milk tomorrow?",
        )
        second = await auto_schedule.process_message_for_scheduling(
            database=database,
            user_id="user-1",
            chat_id="15551234567@s.whatsapp.net",
            chat_name="Alice",
            sender_name="Alice",
            content="Can you buy milk tomorrow?",
        )
        assert len(first) == 1
        assert second == []

    @pytest.mark.asyncio
    async def test_schedules_self_chat_message_but_skips_other_outgoing_and_eve_echo(self, db, monkeypatch):
        fake_client = _FakeClient('{"items": [{"kind": "todo", "title": "Renew passport", "due_date": "2026-12-10"}]}')
        monkeypatch.setattr(auto_schedule, "any_provider_available", lambda: True)
        monkeypatch.setattr(
            auto_schedule,
            "resolve_ai_config",
            lambda _db, _uid: SimpleNamespace(provider="openai", model="gpt-test", client_options={}),
        )
        monkeypatch.setitem(auto_schedule.PROVIDER_CLIENTS, "openai", lambda _opts: fake_client)

        async def noop_broadcast(_uid, _payload):
            return None

        monkeypatch.setattr(auto_schedule.whatsapp_ws_manager, "broadcast_to_user", noop_broadcast)

        database = get_firestore()

        # Outgoing message to another contact should still be skipped.
        skipped_other = await auto_schedule.process_message_for_scheduling(
            database=database,
            user_id="user-1",
            chat_id="15559998888@s.whatsapp.net",
            chat_name="Bob",
            sender_name="You",
            content="Remind me to renew passport by Dec 10",
            is_from_me=True,
            is_group=False,
            sender_id="15551234567:2@s.whatsapp.net",
        )
        assert skipped_other == []
        assert fake_client.calls == 0

        # Self-chat message (matching user JID despite :device suffix) should be scheduled.
        created_self = await auto_schedule.process_message_for_scheduling(
            database=database,
            user_id="user-1",
            chat_id="15551234567@s.whatsapp.net",
            chat_name="+15551234567",
            sender_name="You",
            content="Remind me to renew passport by Dec 10",
            is_from_me=True,
            is_group=False,
            sender_id="15551234567:2@s.whatsapp.net",
        )
        assert len(created_self) == 1
        assert created_self[0]["kind"] == "todo"
        assert fake_client.calls == 1

        # Eve's own echoed reply in self-chat should be skipped.
        from datetime import datetime, timezone
        from app.repositories import whatsapp as whatsapp_repo
        from app.schemas.whatsapp import WhatsAppMessageResponse

        eve_reply = WhatsAppMessageResponse(
            id="msg-eve-echo",
            chat_id="15551234567@s.whatsapp.net",
            sender_id="eve",
            sender_name="Eve AI",
            is_from_me=False,
            is_eve=True,
            content="I added a todo to renew your passport on Dec 10.",
            timestamp=datetime.now(timezone.utc),
            status="delivered",
        )
        whatsapp_repo.save_whatsapp_message(database, "user-1", "15551234567@s.whatsapp.net", eve_reply)

        skipped_echo = await auto_schedule.process_message_for_scheduling(
            database=database,
            user_id="user-1",
            chat_id="15551234567@s.whatsapp.net",
            chat_name="+15551234567",
            sender_name="You",
            content="I added a todo to renew your passport on Dec 10.",
            is_from_me=True,
            is_group=False,
            sender_id="15551234567@s.whatsapp.net",
        )
        assert skipped_echo == []
        assert fake_client.calls == 1
