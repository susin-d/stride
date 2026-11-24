"""Eve AI integration for WhatsApp: auto-replies, drafts, and summaries."""

import logging
from datetime import datetime, timezone
from typing import List, Optional
from uuid import uuid4

from app.core.config import settings
from app.core.http import create_async_client
from app.core.whatsapp_ws_manager import whatsapp_ws_manager
from app.db import SqlClient
from app.repositories import whatsapp as whatsapp_repo
from app.schemas.whatsapp import WhatsAppMessageResponse
from app.services.prompts import whatsapp_draft_prompt, whatsapp_summary_prompt

logger = logging.getLogger(__name__)


async def forward_to_worker(user_id: str, chat_id: str, content: str) -> None:
    """Forward an outbound message to the Go WhatsMeow worker (best effort)."""
    try:
        worker_url = settings.whatsapp_gateway_url
        async with create_async_client(timeout=5.0) as client:
            await client.post(
                f"{worker_url}/session/send",
                json={"userId": user_id, "chatId": chat_id, "content": content},
            )
    except Exception as exc:
        logger.warning("Could not forward message to whatsmeow worker: %s", exc)


def _format_history(database: SqlClient, user_id: str, chat_id: str, limit: int) -> str:
    recent = whatsapp_repo.list_whatsapp_messages(database, user_id, chat_id, limit=limit)
    return "\n".join(
        f"[{'Me' if m.is_from_me else (m.sender_name or 'Them')}]: {m.content}" for m in recent
    )


async def handle_eve_response(
    database: SqlClient, user_id: str, chat_id: str, user_prompt: str
) -> None:
    from app.services.eve import chat_with_eve

    recent_messages = whatsapp_repo.list_whatsapp_messages(database, user_id, chat_id, limit=10)
    eve_conversation = [
        {
            "role": "assistant" if (m.is_eve or not m.is_from_me) else "user",
            "content": m.content,
        }
        for m in recent_messages
    ]
    if not eve_conversation or eve_conversation[-1]["content"] != user_prompt:
        eve_conversation.append({"role": "user", "content": user_prompt})

    is_error = False
    try:
        eve_reply_text, _, _ = chat_with_eve(
            database=database,
            user={"uid": user_id},
            messages=eve_conversation,
            session_id=None,
        )
        eve_reply_text = (eve_reply_text or "").strip()
        if (
            not eve_reply_text
            or "could not generate a response" in eve_reply_text.lower()
            or "trouble processing" in eve_reply_text.lower()
        ):
            is_error = True
            logger.error(
                "[Eve WhatsApp Error] Eve produced empty or error response for user %s in chat %s: %s",
                user_id,
                chat_id,
                eve_reply_text,
            )
    except Exception as err:
        is_error = True
        logger.exception(
            "[Eve WhatsApp Error] Exception generating response for user %s in chat %s: %s",
            user_id,
            chat_id,
            err,
        )
        eve_reply_text = ""

    if is_error:
        logger.warning(
            "[Eve WhatsApp Blocked] Suppressing error message from being sent to external WhatsApp chat %s (user %s)",
            chat_id,
            user_id,
        )
        if chat_id != "eve":
            return
        eve_reply_text = "I could not generate a response. Please check the server logs for details."

    eve_msg = WhatsAppMessageResponse(
        id=f"msg-{uuid4().hex[:12]}",
        chat_id=chat_id,
        sender_id="eve",
        sender_name="Eve AI",
        is_from_me=False,
        is_eve=True,
        content=eve_reply_text,
        timestamp=datetime.now(timezone.utc),
        status="delivered",
    )
    whatsapp_repo.save_whatsapp_message(database, user_id, chat_id, eve_msg)

    if chat_id != "eve" and eve_reply_text:
        await forward_to_worker(user_id, chat_id, eve_reply_text)

    await whatsapp_ws_manager.broadcast_to_user(
        user_id,
        {"type": "new_message", "message": eve_msg.model_dump(mode="json")},
    )


async def generate_draft(
    database: SqlClient, user_id: str, chat_id: str, instruction: str
) -> str:
    from app.services.eve import chat_with_eve

    prompt = whatsapp_draft_prompt(_format_history(database, user_id, chat_id, limit=10), instruction)
    try:
        draft, _, _ = chat_with_eve(
            database=database,
            user={"uid": user_id},
            messages=[{"role": "user", "content": prompt}],
        )
        draft = (draft or "").strip()
        if not draft or "could not generate a response" in draft.lower():
            logger.error("[Eve Draft Error] Could not generate draft reply for user %s in chat %s: %s", user_id, chat_id, draft)
            return ""
        return draft
    except Exception as err:
        logger.exception("[Eve Draft Error] Failed generating draft for chat %s: %s", chat_id, err)
        return ""


async def summarize_chat(database: SqlClient, user_id: str, chat_id: str) -> str:
    from app.services.eve import chat_with_eve

    prompt = whatsapp_summary_prompt(_format_history(database, user_id, chat_id, limit=30))
    try:
        summary, _, _ = chat_with_eve(
            database=database,
            user={"uid": user_id},
            messages=[{"role": "user", "content": prompt}],
        )
        summary = (summary or "").strip()
        if not summary or "could not generate a response" in summary.lower():
            logger.error("[Eve Summary Error] Could not generate summary for user %s in chat %s: %s", user_id, chat_id, summary)
            return ""
        return summary
    except Exception as err:
        logger.exception("[Eve Summary Error] Failed summarizing chat %s: %s", chat_id, err)
        return ""


async def chat_about_summary(
    database: SqlClient,
    user_id: str,
    chat_id: str,
    summary: Optional[str],
    messages: List[dict],
) -> str:
    from app.services.eve import chat_with_eve

    history_text = _format_history(database, user_id, chat_id, limit=35)
    chat_obj = whatsapp_repo.get_whatsapp_chat(database, user_id, chat_id)
    chat_name = chat_obj.name if chat_obj else chat_id

    system_context = (
        "You are Eve, an intelligent personal AI assistant helping the user review and interact with a WhatsApp conversation.\n"
        f"Target Chat: '{chat_name}' (ID: {chat_id})\n\n"
        f"=== Recent WhatsApp Messages History ===\n{history_text or 'No prior messages.'}\n\n"
    )
    if summary:
        system_context += f"=== AI Generated Conversation Summary ===\n{summary}\n\n"
    system_context += (
        "The user is asking questions, requesting deeper explanations, asking to draft replies, "
        "inquiring about specific participants, checking action items, or seeking scheduling guidance. "
        "Answer directly, helpfully, accurately, and concisely based on the conversation context."
    )

    eve_messages = [{"role": "system", "content": system_context}]
    for m in messages:
        role = m.get("role", "user")
        content = m.get("content", "")
        if role in ("user", "assistant") and content:
            eve_messages.append({"role": role, "content": content})

    if len(eve_messages) <= 1:
        return "How can I help you with this conversation?"

    try:
        reply, _, _ = chat_with_eve(
            database=database,
            user={"uid": user_id},
            messages=eve_messages,
        )
        return (reply or "").strip()
    except Exception as err:
        logger.exception("[Eve Summary Chat Error] Failed for user %s on chat %s: %s", user_id, chat_id, err)
        return f"I ran into an issue answering your question: {err}"
