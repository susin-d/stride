"""Schedulable email webhook processing and user scoping helpers."""

import logging

from app.core.config import settings
from app.db import SqlClient
from app.repositories.schedulable_emails import create_schedulable_email
from app.repositories.users import get_user_by_email, get_users_collection
from app.schemas.webhook import SchedulableEmailPayload, SchedulableEmailResponse

logger = logging.getLogger(__name__)


def processSchedulableEmail(payload: SchedulableEmailPayload) -> None:
    """Placeholder hook where custom calendar/todo/scheduler logic can be added."""
    logger.info(
        "processSchedulableEmail called: sender=%s subject=%r receivedAt=%s isSchedulable=%s",
        payload.sender,
        payload.subject,
        payload.receivedAt,
        payload.isSchedulable,
    )
    # TODO: Add custom calendar, todo, or Eve scheduler automation logic here.


def resolve_webhook_user_id(database: SqlClient, recipient_email: str | None = None) -> str | None:
    """Resolve the owning user ID for an incoming webhook payload."""
    if settings.default_webhook_user_id:
        return settings.default_webhook_user_id

    if recipient_email and recipient_email.strip():
        matched = get_user_by_email(database, recipient_email.strip())
        if matched and matched.get("uid"):
            return matched["uid"]

    for doc in get_users_collection(database).limit(1).stream():
        return doc.id
    return None


def ingest_schedulable_email(
    database: SqlClient,
    payload: SchedulableEmailPayload,
) -> SchedulableEmailResponse | None:
    """Run the processing hook and persist the incoming email when a target user exists."""
    processSchedulableEmail(payload)
    user_id = resolve_webhook_user_id(database, payload.recipient)
    if not user_id:
        logger.warning("No user found in database to attach schedulable email from %s", payload.sender)
        return None
    return create_schedulable_email(database, user_id, payload)
