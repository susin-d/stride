"""Authenticated routes for managing incoming schedulable emails."""

import asyncio
from datetime import date

from fastapi import APIRouter, Depends, Response, status

from app.core.auth import get_current_user
from app.core.cache import cache_invalidate_prefix
from app.core.config import settings
from app.core.errors import bad_request, not_found
from app.core.sync import broadcast_data_change
from app.db import SqlClient, get_firestore
from app.repositories import schedulable_emails as repo
from app.repositories import todos as todos_repo
from app.repositories.eve_schedules import EveScheduleRepository
from app.schemas.eve_schedule import EveScheduleCreate
from app.schemas.todo import TodoCreate
from app.schemas.webhook import (
    SchedulableEmailResponse,
    SchedulableEmailUpdate,
    ScheduleEveFromEmailRequest,
    ScheduleTodoFromEmailRequest,
)

router = APIRouter(prefix="/schedulable-mail")


@router.get("/webhook-info")
def get_webhook_info(user: dict = Depends(get_current_user)):
    """Return webhook endpoint metadata for Settings & Mail Scheduler UI."""
    return {
        "endpoint": "/api/webhooks/schedulable-email",
        "secret_configured": bool(settings.webhook_secret),
    }


@router.get("", response_model=list[SchedulableEmailResponse])
async def list_schedulable_emails(
    database: SqlClient = Depends(get_firestore),
    user: dict = Depends(get_current_user),
):
    return await asyncio.to_thread(repo.list_schedulable_emails, database, user["uid"])


@router.post("/{email_id}/schedule-todo", response_model=dict)
async def schedule_todo_from_email(
    email_id: str,
    payload: ScheduleTodoFromEmailRequest,
    database: SqlClient = Depends(get_firestore),
    user: dict = Depends(get_current_user),
):
    item = await asyncio.to_thread(repo.get_schedulable_email, database, user["uid"], email_id)
    if item is None:
        raise not_found("Schedulable email not found.")

    parsed_due: date | None = None
    if payload.due_date:
        try:
            parsed_due = date.fromisoformat(payload.due_date[:10])
        except ValueError as exc:
            raise bad_request("Invalid due_date format. Expected YYYY-MM-DD.") from exc
    elif payload.target == "calendar":
        parsed_due = date.today()

    title = (payload.title or item.subject or "Scheduled Email Task").strip()[:300]
    created_todo = await asyncio.to_thread(
        todos_repo.create_todo,
        database,
        user["uid"],
        TodoCreate(title=title, completed=False, due_date=parsed_due),
    )
    cache_invalidate_prefix(f"todos:{user['uid']}")
    cache_invalidate_prefix(f"workspace:overview:{user['uid']}")
    await broadcast_data_change(user["uid"], "todos", "create", created_todo.id)

    updated_email = await asyncio.to_thread(
        repo.update_schedulable_email,
        database,
        user["uid"],
        email_id,
        SchedulableEmailUpdate(
            status="scheduled",
            scheduled_target=payload.target,
            scheduled_ref_id=created_todo.id,
        ),
    )
    return {"email": updated_email, "todo": created_todo}


@router.post("/{email_id}/schedule-eve", response_model=dict)
async def schedule_eve_from_email(
    email_id: str,
    payload: ScheduleEveFromEmailRequest,
    database: SqlClient = Depends(get_firestore),
    user: dict = Depends(get_current_user),
):
    item = await asyncio.to_thread(repo.get_schedulable_email, database, user["uid"], email_id)
    if item is None:
        raise not_found("Schedulable email not found.")

    title = (payload.title or item.subject or "Email Follow-up").strip()[:120]
    prompt = (payload.prompt or f"Follow up on email from {item.sender}: {item.subject}\n\n{item.body[:1000]}").strip()[:2000]

    schedule_repo = EveScheduleRepository(database, user["uid"])
    created_schedule = await asyncio.to_thread(
        schedule_repo.create,
        EveScheduleCreate(
            title=title,
            prompt=prompt,
            schedule_type=payload.schedule_type,
            action_type=payload.action_type,
            execute_at=payload.execute_at,
            cron_expression=payload.cron_expression,
            enabled=True,
        ),
    )
    cache_invalidate_prefix(f"eve:schedules:{user['uid']}")

    updated_email = await asyncio.to_thread(
        repo.update_schedulable_email,
        database,
        user["uid"],
        email_id,
        SchedulableEmailUpdate(
            status="scheduled",
            scheduled_target="eve_schedule",
            scheduled_ref_id=created_schedule.get("id") if isinstance(created_schedule, dict) else None,
        ),
    )
    return {"email": updated_email, "schedule": created_schedule}


@router.patch("/{email_id}", response_model=SchedulableEmailResponse)
async def update_schedulable_email(
    email_id: str,
    changes: SchedulableEmailUpdate,
    database: SqlClient = Depends(get_firestore),
    user: dict = Depends(get_current_user),
):
    updated = await asyncio.to_thread(repo.update_schedulable_email, database, user["uid"], email_id, changes)
    if updated is None:
        raise not_found("Schedulable email not found.")
    return updated


@router.delete("/{email_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schedulable_email(
    email_id: str,
    database: SqlClient = Depends(get_firestore),
    user: dict = Depends(get_current_user),
):
    ok = await asyncio.to_thread(repo.delete_schedulable_email, database, user["uid"], email_id)
    if not ok:
        raise not_found("Schedulable email not found.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
