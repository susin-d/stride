"""WhatsApp auto-scheduling — extracts todos, jobs, hackathons, and Eve schedules from incoming messages."""

import asyncio
import json
import logging
import re
from datetime import datetime, timezone
from typing import Any

from pydantic import ValidationError

from app.core.cache import cache_invalidate_prefix
from app.core.whatsapp_ws_manager import whatsapp_ws_manager
from app.db import SqlClient
from app.repositories import NotificationRepository, todos as todos_repo
from app.repositories import whatsapp as whatsapp_repo
from app.repositories.eve_schedules import EveScheduleRepository
from app.repositories.jobs import JobRepository
from app.schemas.eve_schedule import EveScheduleCreate
from app.schemas.todo import TodoCreate
from app.schemas.workspace import HackathonCreate, JobCreate
from app.services.ai_models import PROVIDER_CLIENTS, any_provider_available, resolve_ai_config
from app.services.notifications import send_multicast_notification
from app.services.prompts import whatsapp_schedule_extraction_prompt

logger = logging.getLogger(__name__)

MAX_SCHEDULED_ITEMS = 3
MIN_MESSAGE_CHARS = 8
MAX_MESSAGE_CHARS = 2000


def parse_scheduled_items(raw: str | None) -> list[dict[str, Any]]:
    """Parse AI JSON output into at most MAX_SCHEDULED_ITEMS candidate dicts."""
    if not raw:
        return []
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip(), flags=re.IGNORECASE).strip()
    try:
        parsed = json.loads(text)
    except Exception:
        return []

    if isinstance(parsed, dict):
        items = parsed.get("items")
    elif isinstance(parsed, list):
        items = parsed
    else:
        return []

    if not isinstance(items, list):
        return []
    return [item for item in items if isinstance(item, dict)][:MAX_SCHEDULED_ITEMS]


def _jid_user(jid: str | None) -> str:
    raw = (jid or "").strip()
    if not raw:
        return ""
    return raw.split("@", 1)[0].split(":", 1)[0].strip()


def _is_self_chat(
    database: SqlClient,
    user_id: str,
    chat_id: str,
    sender_id: str,
    is_group: bool,
) -> bool:
    if is_group or not chat_id or chat_id == "eve" or chat_id.endswith("@g.us"):
        return False
    chat_user = _jid_user(chat_id)
    sender_user = _jid_user(sender_id)
    if chat_user and sender_user and chat_user == sender_user:
        return True
    status = whatsapp_repo.get_whatsapp_status(database, user_id)
    own_digits = re.sub(r"\D", "", getattr(status, "phone_number", None) or "")
    chat_digits = re.sub(r"\D", "", chat_user)
    return bool(own_digits and chat_digits and own_digits == chat_digits)


def _is_eve_echo(database: SqlClient, user_id: str, chat_id: str, content: str) -> bool:
    recent = whatsapp_repo.list_whatsapp_messages(database, user_id, chat_id, limit=5)
    stripped = (content or "").strip()
    return any(m.is_eve and (m.content or "").strip() == stripped for m in recent)


def _is_eligible_message(
    chat_id: str,
    content: str,
    is_from_me: bool,
    is_group: bool,
    user_settings: Any,
    is_self_chat: bool = False,
) -> bool:
    if chat_id == "eve" or (is_from_me and not is_self_chat):
        return False
    if not content or len(content.strip()) < MIN_MESSAGE_CHARS:
        return False
    if not getattr(user_settings, "auto_schedule_enabled", True):
        return False
    if is_group and not getattr(user_settings, "auto_schedule_include_groups", False):
        return False
    return True


def _invalidate_resource_caches(user_id: str, kind: str) -> None:
    prefix_map = {
        "todo": f"workspace:todos:{user_id}",
        "job": f"workspace:jobs:{user_id}",
        "hackathon": f"workspace:hackathons:{user_id}",
    }
    if kind in prefix_map:
        cache_invalidate_prefix(prefix_map[kind])
    cache_invalidate_prefix(f"workspace:overview:{user_id}")


def _create_todo_item(database: SqlClient, user_id: str, item: dict[str, Any]) -> dict[str, str] | None:
    title = str(item.get("title") or "").strip()[:300]
    if not title:
        return None
    existing = todos_repo.list_todos(database, user_id)
    if any(t.title.strip().lower() == title.lower() and not t.completed for t in existing):
        return None
    payload = TodoCreate(title=title, due_date=item.get("due_date") or None)
    created = todos_repo.create_todo(database, user_id, payload)
    label = f"Todo: {created.title}" + (f" (due {created.due_date})" if created.due_date else "")
    return {"kind": "todo", "id": created.id, "label": label}


def _create_job_item(database: SqlClient, user_id: str, item: dict[str, Any], sender_name: str) -> dict[str, str] | None:
    company = str(item.get("company") or "").strip()[:200]
    role = str(item.get("role") or item.get("title") or "").strip()[:200]
    if not company or not role:
        return None
    payload = JobCreate(
        company=company,
        role=role,
        status=str(item.get("status") or "Saved")[:50],
        interview_date=item.get("interview_date") or None,
        deadline=item.get("deadline") or None,
        notes=str(item.get("notes") or f"Extracted from WhatsApp message by {sender_name}")[:5000],
    )
    created = JobRepository(database, user_id).create(payload)
    return {"kind": "job", "id": created["id"], "label": f"Job: {role} at {company}"}


def _create_hackathon_item(database: SqlClient, user_id: str, item: dict[str, Any]) -> dict[str, str] | None:
    title = str(item.get("title") or "").strip()[:300]
    starts_at = item.get("starts_at")
    ends_at = item.get("ends_at") or starts_at
    if not title or not starts_at:
        return None
    payload = HackathonCreate(
        title=title,
        organizer=str(item.get("organizer") or "")[:200],
        starts_at=starts_at,
        ends_at=ends_at,
        mode=str(item.get("mode") or "Online")[:80],
    )
    ref = database.collection("users").document(user_id).collection("hackathons").document()
    ref.set(payload.model_dump(mode="python"))
    return {"kind": "hackathon", "id": ref.id, "label": f"Hackathon: {title}"}


def _create_eve_schedule_item(database: SqlClient, user_id: str, item: dict[str, Any]) -> dict[str, str] | None:
    title = str(item.get("title") or "").strip()[:200]
    prompt = str(item.get("prompt") or title).strip()[:2000]
    execute_at = item.get("execute_at")
    if not title or not execute_at:
        return None
    payload = EveScheduleCreate(
        title=title,
        prompt=prompt,
        schedule_type="one_time",
        action_type="chat_prompt",
        execute_at=str(execute_at),
    )
    created = EveScheduleRepository(database, user_id).create(payload)
    return {"kind": "eve_schedule", "id": created["id"], "label": f"Reminder: {title}"}


def _create_scheduled_item(
    database: SqlClient, user_id: str, item: dict[str, Any], sender_name: str
) -> dict[str, str] | None:
    kind = str(item.get("kind") or "").strip().lower()
    try:
        if kind == "todo":
            created = _create_todo_item(database, user_id, item)
        elif kind == "job":
            created = _create_job_item(database, user_id, item, sender_name)
        elif kind == "hackathon":
            created = _create_hackathon_item(database, user_id, item)
        elif kind == "eve_schedule":
            created = _create_eve_schedule_item(database, user_id, item)
        else:
            return None
    except (ValidationError, ValueError) as exc:
        logger.debug("[WhatsApp Auto-Schedule] Skipped invalid %s item: %s", kind, exc)
        return None

    if created:
        _invalidate_resource_caches(user_id, kind)
    return created


def _notify_scheduled_items(
    database: SqlClient,
    user_id: str,
    sender_name: str,
    created_items: list[dict[str, str]],
) -> dict[str, Any] | None:
    summary_text = "; ".join(item["label"] for item in created_items)
    title = f"Scheduled from WhatsApp ({sender_name})"
    message = summary_text

    created_notif = None
    try:
        created_notif = NotificationRepository(database, user_id).create(
            type="whatsapp_scheduled",
            title=title,
            message=message,
        )
        cache_invalidate_prefix(f"workspace:notifications:{user_id}")
        cache_invalidate_prefix(f"workspace:overview:{user_id}")
    except Exception as exc:
        logger.warning("[WhatsApp Auto-Schedule] Could not persist notification for %s: %s", user_id, exc)

    try:
        docs = list(database.collection("users").document(user_id).collection("devices").stream())
        tokens = [doc.to_dict().get("token") for doc in docs if doc.to_dict().get("token")]
        if tokens:
            send_multicast_notification(
                device_tokens=tokens,
                title=title,
                body=message,
                data={"type": "whatsapp_scheduled"},
            )
    except Exception as exc:
        logger.debug("[WhatsApp Auto-Schedule] Push dispatch skipped for %s: %s", user_id, exc)

    return created_notif


def _extract_and_schedule_sync(
    database: SqlClient,
    user_id: str,
    chat_id: str,
    chat_name: str,
    sender_name: str,
    content: str,
    is_from_me: bool,
    is_group: bool,
    sender_id: str = "",
) -> tuple[list[dict[str, str]], dict[str, Any] | None]:
    user_settings = whatsapp_repo.get_whatsapp_settings(database, user_id)
    is_self_chat = _is_self_chat(database, user_id, chat_id, sender_id, is_group) if is_from_me else False
    if not _is_eligible_message(
        chat_id,
        content,
        is_from_me,
        is_group,
        user_settings,
        is_self_chat=is_self_chat,
    ):
        return [], None
    if is_from_me and is_self_chat and _is_eve_echo(database, user_id, chat_id, content):
        return [], None
    if not any_provider_available():
        return [], None

    config = resolve_ai_config(database, user_id)
    client = PROVIDER_CLIENTS[config.provider](config.client_options)
    current_date = datetime.now(timezone.utc).date().isoformat()
    instructions = whatsapp_schedule_extraction_prompt(
        sender_name=sender_name,
        chat_name=chat_name,
        is_group=is_group,
        current_date_iso=current_date,
        max_items=MAX_SCHEDULED_ITEMS,
    )
    response = client.call(
        model=config.model,
        instructions=instructions,
        conversation=[{"role": "user", "content": content[:MAX_MESSAGE_CHARS]}],
        tools=[],
    )
    candidates = parse_scheduled_items(getattr(response, "text", None))
    if not candidates:
        return [], None

    created_items: list[dict[str, str]] = []
    for candidate in candidates:
        created = _create_scheduled_item(database, user_id, candidate, sender_name)
        if created:
            created_items.append(created)

    if not created_items:
        return [], None

    notification = _notify_scheduled_items(database, user_id, sender_name, created_items)
    logger.info(
        "[WhatsApp Auto-Schedule] Scheduled %d item(s) for user %s from %s",
        len(created_items),
        user_id,
        chat_id,
    )
    return created_items, notification


async def process_message_for_scheduling(
    database: SqlClient,
    user_id: str,
    chat_id: str,
    chat_name: str,
    sender_name: str,
    content: str,
    is_from_me: bool = False,
    is_group: bool = False,
    sender_id: str = "",
) -> list[dict[str, str]]:
    """Analyze an incoming WhatsApp message in the background, schedule extracted items, and notify."""
    try:
        created_items, notification = await asyncio.to_thread(
            _extract_and_schedule_sync,
            database,
            user_id,
            chat_id,
            chat_name,
            sender_name,
            content,
            is_from_me,
            is_group,
            sender_id,
        )
        if created_items:
            await whatsapp_ws_manager.broadcast_to_user(
                user_id,
                {
                    "type": "workspace_scheduled",
                    "chat_id": chat_id,
                    "items": created_items,
                    "notification": notification,
                },
            )
        return created_items
    except Exception as exc:
        logger.warning("[WhatsApp Auto-Schedule] Failed for user %s in chat %s: %s", user_id, chat_id, exc)
        return []
