"""WhatsApp handlers — single responsibility: WhatsApp chat and message tools."""

from datetime import datetime, timezone
from uuid import uuid4

from app.db import SqlClient


def handle_list_whatsapp_chats(database: SqlClient, user_id: str, arguments: dict) -> tuple[dict, None, None]:
    from app.repositories import whatsapp as wa_repo

    chats, _, _ = wa_repo.list_whatsapp_chats(database, user_id)
    return {"chats": [c.model_dump(mode="json") for c in chats]}, None, None



def handle_read_whatsapp_messages(database: SqlClient, user_id: str, arguments: dict) -> tuple[dict, None, None]:
    from app.repositories import whatsapp as wa_repo

    chat_id = arguments["chat_id"]
    limit = arguments.get("limit", 20)
    messages = wa_repo.list_whatsapp_messages(database, user_id, chat_id, limit=limit)
    return {"chat_id": chat_id, "messages": [m.model_dump(mode="json") for m in messages]}, None, None


def handle_send_whatsapp_message(database: SqlClient, user_id: str, arguments: dict) -> tuple[dict, None, None]:
    from app.repositories import whatsapp as wa_repo
    from app.schemas.whatsapp import WhatsAppMessageResponse
    from app.services.whatsapp_trigger import should_deliver_to_whatsapp

    chat_id = arguments["chat_id"]
    content = arguments["content"]

    # Hard limit (ADR 0064): Eve may only deliver a message to a real WhatsApp
    # chat when the user's request explicitly mentions her with @eve. Without
    # this the agent could message an arbitrary contact unprompted.
    if not should_deliver_to_whatsapp(chat_id, content):
        return (
            {
                "sent": False,
                "chat_id": chat_id,
                "error": (
                    "Blocked: sending to a WhatsApp chat requires an explicit @eve mention "
                    "in the message. Ask the user to confirm with @eve."
                ),
            },
            None,
            None,
        )

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
    )
    wa_repo.save_whatsapp_message(database, user_id, chat_id, msg)
    return {"sent": True, "message_id": msg.id, "chat_id": chat_id, "content": content}, None, None


def handle_summarize_whatsapp_chat(database: SqlClient, user_id: str, arguments: dict) -> tuple[dict, None, None]:
    from app.repositories import whatsapp as wa_repo

    chat_id = arguments["chat_id"]
    messages = wa_repo.list_whatsapp_messages(database, user_id, chat_id, limit=20)
    formatted = "\n".join(f"{'Me' if m.is_from_me else (m.sender_name or 'Them')}: {m.content}" for m in messages)
    return {"chat_id": chat_id, "transcript": formatted}, None, None
