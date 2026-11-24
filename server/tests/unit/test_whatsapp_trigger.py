"""Unit tests: Eve WhatsApp reply gate is a hard `@eve`-only trigger."""

from types import SimpleNamespace

import pytest

from app.services.whatsapp_trigger import (
    mentions_eve,
    should_deliver_to_whatsapp,
    should_eve_reply,
)


def _settings(**overrides):
    base = {
        "eve_tag": "@eve",
        "keywords": ["@eve", "eve", "urgent", "help", "summary"],
        "owner_aliases": ["@susindran", "@susin"],
    }
    base.update(overrides)
    return SimpleNamespace(**base)


class TestMentionsEve:
    @pytest.mark.parametrize(
        "text",
        ["@eve what is on my calendar?", "hey @EVE help", "plan tomorrow @eve, thanks"],
    )
    def test_explicit_mention_matches(self, text):
        assert mentions_eve(text, _settings()) is True

    @pytest.mark.parametrize(
        "text",
        [
            "just chatting",
            "urgent: call me back",  # keyword only — must not match
            "help me with the summary",  # keyword only — must not match
            "@susindran ping",  # owner alias — must not match
            "eve said hello",  # bare word — must not match
            "@evelyn can you help?",  # different handle — must not match
            "",
        ],
    )
    def test_non_mentions_rejected(self, text):
        assert mentions_eve(text, _settings()) is False

    def test_custom_tag_requires_exact_token(self):
        settings = _settings(eve_tag="@assistant")
        assert mentions_eve("@assistant summarize", settings) is True
        assert mentions_eve("@assistants summarize", settings) is False
        assert mentions_eve("@eve summarize", settings) is False


class TestShouldEveReply:
    def test_mention_in_external_chat_allowed(self):
        assert (
            should_eve_reply(
                "friend@s.whatsapp.net",
                "@eve draft a reply",
                _settings(),
                sender_id="friend@s.whatsapp.net",
                sender_name="Friend",
            )
            is True
        )

    def test_keyword_only_message_blocked(self):
        assert (
            should_eve_reply(
                "friend@s.whatsapp.net",
                "urgent, call me",
                _settings(),
                sender_id="friend@s.whatsapp.net",
                sender_name="Friend",
            )
            is False
        )

    def test_never_replies_to_own_eve_messages(self):
        assert (
            should_eve_reply(
                "eve",
                "@eve hello",
                _settings(),
                sender_id="eve",
                sender_name="Eve AI",
                is_from_me=False,
            )
            is False
        )

    def test_eve_assistant_chat_only_answers_incoming(self):
        assert should_eve_reply("eve", "hello", _settings(), is_from_me=False) is True
        assert should_eve_reply("eve", "hello", _settings(), is_from_me=True) is False

    def test_in_app_send_to_eve_chat_still_triggers(self):
        """The user typing into Eve's chat sends as sender 'me' — must still reach Eve."""
        assert (
            should_eve_reply("eve", "what is on my calendar?", _settings(), sender_id="me", sender_name="Me")
            is True
        )

    def test_external_chat_send_requires_mention(self):
        """An outbound message without @eve must not summon Eve in a real chat."""
        assert (
            should_eve_reply(
                "friend@s.whatsapp.net", "see you at 5", _settings(), sender_id="me", sender_name="Me"
            )
            is False
        )


class TestShouldDeliverToWhatsapp:
    """Gate for the Eve agent's outbound send tool."""

    def test_requires_mention_in_content(self):
        assert should_deliver_to_whatsapp("a@s.whatsapp.net", "@eve tell them I'll call") is True
        assert should_deliver_to_whatsapp("a@s.whatsapp.net", "tell them I'll call") is False

    def test_never_delivers_to_in_app_eve_chat(self):
        assert should_deliver_to_whatsapp("eve", "@eve hello") is False

    def test_empty_content_blocked(self):
        assert should_deliver_to_whatsapp("a@s.whatsapp.net", "") is False


class TestAgentSendToolGate:
    def test_blocked_without_mention_and_nothing_persisted(self, monkeypatch):
        from app.services.eve.handlers import whatsapp as handler

        saved = []

        monkeypatch.setattr(
            "app.repositories.whatsapp.save_whatsapp_message",
            lambda *a, **k: saved.append(a),
        )

        result, _, _ = handler.handle_send_whatsapp_message(
            object(), "user-1", {"chat_id": "a@s.whatsapp.net", "content": "see you at 5"}
        )

        assert result["sent"] is False
        assert "Blocked" in result["error"]
        assert saved == []

    def test_allowed_with_mention(self, monkeypatch):
        from app.services.eve.handlers import whatsapp as handler

        saved = []

        monkeypatch.setattr(
            "app.repositories.whatsapp.save_whatsapp_message",
            lambda *a, **k: saved.append(a),
        )

        result, _, _ = handler.handle_send_whatsapp_message(
            object(), "user-1", {"chat_id": "a@s.whatsapp.net", "content": "@eve see you at 5"}
        )

        assert result["sent"] is True
        assert len(saved) == 1
