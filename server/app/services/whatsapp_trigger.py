"""Eve WhatsApp reply gate — a HARD `@eve`-only trigger.

Eve must never message a WhatsApp chat unless the incoming text explicitly
mentions her. No keyword, owner-alias, or free-text heuristic may widen this:
the only exception is the dedicated in-app Eve assistant chat (``chat_id == "eve"``),
which is a direct line to Eve rather than a real WhatsApp contact.

Both entry points (worker webhook and in-app send) call
:func:`should_eve_reply` so the rule cannot drift between them.
"""

import re

EVE_CHAT_ID = "eve"
DEFAULT_EVE_TAG = "@eve"

# Case-insensitive mention: `@eve` with a token boundary so `@evelyn` never matches.
_EVE_TAG_TOKEN = re.compile(r"(?<![a-z0-9_])@eve(?![a-z0-9_])", re.IGNORECASE)


def is_eve_chat(chat_id: str) -> bool:
    """True for the dedicated in-app Eve assistant conversation."""
    return chat_id == EVE_CHAT_ID


def mentions_eve(content: str, user_settings) -> bool:
    """True only when the text contains an explicit Eve mention token."""
    tag = ((getattr(user_settings, "eve_tag", None) or DEFAULT_EVE_TAG).strip().lower())
    text = content or ""
    if not tag:
        return False
    if tag == DEFAULT_EVE_TAG:
        return _EVE_TAG_TOKEN.search(text) is not None
    # Custom tag (e.g. "@assistant") must also stand alone as a token.
    pattern = re.compile(
        r"(?<![a-z0-9_])" + re.escape(tag) + r"(?![a-z0-9_])", re.IGNORECASE
    )
    return pattern.search(text) is not None


def should_eve_reply(
    chat_id: str,
    content: str,
    user_settings,
    *,
    sender_id: str = "",
    sender_name: str = "",
    is_from_me: bool = False,
) -> bool:
    """Single source of truth for whether Eve may auto-reply in a WhatsApp chat.

    Hard limits, all mandatory:
    - never reply to her own messages (``sender_id == "eve"`` / name starts with Eve);
    - the in-app Eve chat only answers incoming messages;
    - every real WhatsApp chat requires an explicit ``@eve`` mention.
    """
    if (sender_id or "").lower() == "eve":
        return False
    if (sender_name or "").lower().startswith("eve"):
        return False

    if is_eve_chat(chat_id):
        return not is_from_me

    return mentions_eve(content, user_settings)
