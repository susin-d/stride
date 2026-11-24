"""WhatsApp session pairing, status, and background chat sync."""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

import httpx

from app.core.config import settings
from app.core.http import create_async_client
from app.core.whatsapp_ws_manager import whatsapp_ws_manager
from app.db import SqlClient
from app.repositories import whatsapp as whatsapp_repo
from app.schemas.whatsapp import (
    WhatsAppMessageResponse,
    WhatsAppPairResponse,
    WhatsAppStatusResponse,
)

logger = logging.getLogger(__name__)


async def get_status(database: SqlClient, user_id: str) -> WhatsAppStatusResponse:
    try:
        worker_url = settings.whatsapp_gateway_url
        async with create_async_client(timeout=httpx.Timeout(1.5, connect=0.8)) as client:
            resp = await client.get(f"{worker_url}/session/status/{user_id}")
            if resp.is_success:
                data = resp.json()
                if data.get("connected"):
                    phone_number = data.get("phoneNumber") or "+1 (555) 019-2834"
                    push_name = data.get("pushName") or "Stride User"
                    try:
                        await asyncio.to_thread(
                            whatsapp_repo.save_whatsapp_session,
                            database,
                            user_id,
                            True,
                            phone_number,
                            push_name,
                        )
                    except Exception:
                        pass
                    return WhatsAppStatusResponse(
                        connected=True,
                        phone_number=phone_number,
                        push_name=push_name,
                        platform="whatsmeow",
                        last_sync_at=datetime.now(timezone.utc),
                    )
    except Exception:
        pass
    return await asyncio.to_thread(whatsapp_repo.get_whatsapp_status, database, user_id)


async def initiate_pairing(
    database: SqlClient, user_id: str, phone_number: Optional[str] = None
) -> WhatsAppPairResponse:
    pairing_code = None
    qr_code = None

    try:
        worker_url = settings.whatsapp_gateway_url
        payload = {"userId": user_id}
        if phone_number:
            payload["phoneNumber"] = phone_number

        async with create_async_client(timeout=12.0) as client:
            if not phone_number:
                try:
                    status_resp = await client.get(f"{worker_url}/session/status/{user_id}", timeout=2.0)
                    if status_resp.is_success:
                        status_data = status_resp.json()
                        qr_code = status_data.get("qrCode") or qr_code
                        pairing_code = status_data.get("pairingCode") or pairing_code
                except Exception:
                    pass

            if not qr_code and not pairing_code:
                resp = await client.post(f"{worker_url}/session/pair", json=payload)
                if resp.is_success:
                    data = resp.json()
                    qr_code = data.get("qrCode") or qr_code
                    pairing_code = data.get("pairingCode") or pairing_code
    except Exception as exc:
        logger.warning("Could not reach whatsmeow worker at %s: %s", settings.whatsapp_gateway_url, exc)

    response = WhatsAppPairResponse(
        status="qr_ready" if qr_code else "waiting",
        qr_code=qr_code,
        pairing_code=pairing_code,
        expires_at=datetime.now(timezone.utc),
        message="Scan the real WhatsApp QR code on your phone or use pairing code." if qr_code else "Connecting to WhatsApp gateway...",
    )

    await whatsapp_ws_manager.broadcast_to_user(
        user_id,
        {
            "type": "qr_update",
            "status": "qr_ready" if qr_code else "waiting",
            "qr_code": qr_code,
            "pairing_code": pairing_code,
        },
    )
    return response


def ensure_eve_chat(database: SqlClient, user_id: str) -> None:
    chats, _, _ = whatsapp_repo.list_whatsapp_chats(database, user_id, limit=20)
    if any(c.id == "eve" or c.is_eve for c in chats):
        return
    whatsapp_repo.upsert_whatsapp_chat(
        database=database,
        user_id=user_id,
        chat_id="eve",
        name="Eve AI Assistant",
        phone_number="eve@stride.app",
        is_group=False,
        is_eve=True,
        unread_count=0,
        pinned=True,
        eve_auto_reply=True,
    )
    welcome_msg = WhatsAppMessageResponse(
        id=f"msg-{uuid4().hex[:10]}",
        chat_id="eve",
        sender_id="eve",
        sender_name="Eve AI",
        is_from_me=False,
        is_eve=True,
        content="Hello! I'm Eve, your Stride AI assistant on WhatsApp. You can ask me questions, have me manage your workspace, draft replies, or message your contacts.",
        timestamp=datetime.now(timezone.utc),
        status="read",
    )
    whatsapp_repo.save_whatsapp_message(database, user_id, "eve", welcome_msg)


async def confirm_connection(
    database: SqlClient,
    user_id: str,
    phone_number: str = "+1 (555) 019-2834",
    push_name: str = "Stride User",
) -> WhatsAppStatusResponse:
    whatsapp_repo.save_whatsapp_session(
        database=database,
        user_id=user_id,
        connected=True,
        phone_number=phone_number,
        push_name=push_name,
    )
    ensure_eve_chat(database, user_id)

    status_resp = WhatsAppStatusResponse(
        connected=True,
        phone_number=phone_number,
        push_name=push_name,
        platform="web",
        last_sync_at=datetime.now(timezone.utc),
    )
    await whatsapp_ws_manager.broadcast_to_user(
        user_id,
        {
            "type": "connection_state",
            "connected": True,
            "phone_number": phone_number,
            "push_name": push_name,
        },
    )
    return status_resp


async def disconnect(database: SqlClient, user_id: str) -> dict:
    whatsapp_repo.clear_whatsapp_session(database, user_id)
    await whatsapp_ws_manager.broadcast_to_user(
        user_id,
        {"type": "connection_state", "connected": False},
    )
    return {"status": "disconnected"}


async def sync_worker_chats_background(database: SqlClient, user_id: str) -> None:
    try:
        worker_url = settings.whatsapp_gateway_url
        async with create_async_client(timeout=httpx.Timeout(1.5, connect=0.8)) as client:
            resp = await client.get(f"{worker_url}/session/chats/{user_id}")
            if not resp.is_success:
                return
            worker_chats = resp.json().get("chats") or []
            for wc in worker_chats:
                chat_id = wc.get("id")
                last_msg_text = wc.get("lastMessage")
                last_msg_data = None
                if last_msg_text:
                    last_msg_data = {
                        "id": f"last-{chat_id}",
                        "sender_id": "contact",
                        "sender_name": wc.get("name") or "Contact",
                        "content": last_msg_text,
                        "timestamp": wc.get("updatedAt"),
                        "status": "delivered",
                    }
                await asyncio.to_thread(
                    whatsapp_repo.upsert_whatsapp_chat,
                    database,
                    user_id,
                    chat_id=chat_id,
                    name=wc.get("name") or chat_id,
                    phone_number=wc.get("phoneNumber"),
                    avatar_url=wc.get("avatarUrl"),
                    is_group=bool(wc.get("isGroup", False)),
                    participants=wc.get("participants"),
                    description=wc.get("description"),
                    unread_count=int(wc.get("unreadCount", 0)),
                    last_message=last_msg_data,
                )
    except Exception:
        pass
