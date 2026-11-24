"""WhatsApp chat listing, message retrieval, and outbound dispatch."""

import asyncio
import logging
from datetime import datetime, timezone
from typing import List, Optional
from uuid import uuid4

import httpx

from app.core.config import settings
from app.core.http import create_async_client
from app.core.whatsapp_ws_manager import whatsapp_ws_manager
from app.db import SqlClient
from app.repositories import whatsapp as whatsapp_repo
from app.schemas.whatsapp import (
    WhatsAppChatListResponse,
    WhatsAppChatResponse,
    WhatsAppMediaAttachment,
    WhatsAppMessageResponse,
)
from app.services.whatsapp.eve_ai import forward_to_worker, handle_eve_response
from app.services.whatsapp.session import ensure_eve_chat, sync_worker_chats_background
from app.services.whatsapp_trigger import should_eve_reply

logger = logging.getLogger(__name__)


def _chat_sort_key(chat: WhatsAppChatResponse):
    is_pinned = 1 if (chat.pinned or chat.id == "eve") else 0
    has_message = 1 if (chat.last_message and chat.last_message.content) else 0
    ts = chat.last_message.timestamp if (chat.last_message and chat.last_message.timestamp) else None
    if isinstance(ts, str):
        try:
            ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        except Exception:
            ts = None
    if ts is None:
        ts = datetime.min.replace(tzinfo=timezone.utc)
    return (is_pinned, has_message, ts)


async def list_chats(
    database: SqlClient,
    user_id: str,
    limit: int = 30,
    cursor: Optional[str] = None,
) -> WhatsAppChatListResponse:
    chats, next_cursor, has_more = await asyncio.to_thread(
        whatsapp_repo.list_whatsapp_chats,
        database,
        user_id,
        limit=limit,
        cursor=cursor,
    )

    if not cursor and not any(c.id == "eve" for c in chats):
        await asyncio.to_thread(ensure_eve_chat, database, user_id)
        chats, next_cursor, has_more = await asyncio.to_thread(
            whatsapp_repo.list_whatsapp_chats,
            database,
            user_id,
            limit=limit,
            cursor=cursor,
        )

    if not cursor:
        asyncio.create_task(sync_worker_chats_background(database, user_id))

    chats.sort(key=_chat_sort_key, reverse=True)
    return WhatsAppChatListResponse(items=chats, next_cursor=next_cursor, has_more=has_more)


async def get_messages(
    database: SqlClient,
    user_id: str,
    chat_id: str,
    limit: int = 50,
    before: Optional[str] = None,
) -> List[WhatsAppMessageResponse]:
    if chat_id != "eve":
        try:
            worker_url = settings.whatsapp_gateway_url
            async with create_async_client(timeout=httpx.Timeout(0.8, connect=0.5)) as client:
                resp = await client.get(f"{worker_url}/session/messages/{user_id}/{chat_id}")
                if resp.is_success:
                    for wm in resp.json().get("messages") or []:
                        media_data = wm.get("media")
                        msg_obj = WhatsAppMessageResponse(
                            id=wm.get("id") or f"msg-{uuid4().hex[:12]}",
                            chat_id=chat_id,
                            sender_id=wm.get("senderId") or "me",
                            sender_name=wm.get("senderName"),
                            is_from_me=bool(wm.get("isFromMe", False)),
                            is_eve=False,
                            is_forwarded=bool(wm.get("isForwarded", False)),
                            content=wm.get("content") or "",
                            media=WhatsAppMediaAttachment(**media_data) if media_data else None,
                            reply_to_message_id=wm.get("replyToMessageId"),
                            sender_avatar_url=wm.get("senderAvatarUrl") or wm.get("sender_avatar_url"),
                            timestamp=(
                                datetime.fromisoformat(wm["timestamp"].replace("Z", "+00:00"))
                                if isinstance(wm.get("timestamp"), str)
                                else datetime.now(timezone.utc)
                            ),
                            status=wm.get("status", "delivered"),
                        )
                        await asyncio.to_thread(whatsapp_repo.save_whatsapp_message, database, user_id, chat_id, msg_obj)
        except Exception:
            pass
    return await asyncio.to_thread(whatsapp_repo.list_whatsapp_messages, database, user_id, chat_id, limit, before)


async def send_message(
    database: SqlClient,
    user_id: str,
    chat_id: str,
    content: str,
    media: Optional[WhatsAppMediaAttachment] = None,
    reply_to_message_id: Optional[str] = None,
) -> WhatsAppMessageResponse:
    msg = WhatsAppMessageResponse(
        id=f"msg-{uuid4().hex[:12]}",
        chat_id=chat_id,
        sender_id="me",
        sender_name="Me",
        is_from_me=True,
        is_eve=False,
        content=content,
        timestamp=datetime.now(timezone.utc),
        status="sent",
        media=media,
        reply_to_message_id=reply_to_message_id,
    )

    whatsapp_repo.save_whatsapp_message(database, user_id, chat_id, msg)

    if chat_id != "eve":
        await forward_to_worker(user_id, chat_id, content)

    await whatsapp_ws_manager.broadcast_to_user(
        user_id,
        {"type": "new_message", "message": msg.model_dump(mode="json")},
    )

    user_settings = whatsapp_repo.get_whatsapp_settings(database, user_id)
    if should_eve_reply(
        chat_id,
        content,
        user_settings,
        sender_id="me",
        sender_name="Me",
    ):
        await handle_eve_response(database, user_id, chat_id, content)

    return msg
