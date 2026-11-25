"""Repository for persisted schedulable email webhook records."""

from datetime import datetime, timezone

from app.db import Query, SERVER_TIMESTAMP, SqlClient
from app.repositories.helpers import dict_to_snapshot, soft_delete_payload
from app.schemas.webhook import (
    SchedulableEmailPayload,
    SchedulableEmailResponse,
    SchedulableEmailUpdate,
)


def collection(database: SqlClient, user_id: str):
    return database.collection("users").document(user_id).collection("schedulable_emails")


def from_snapshot(snapshot) -> SchedulableEmailResponse:
    data = dict(snapshot.to_dict() or {})
    data.pop("id", None)
    return SchedulableEmailResponse(id=snapshot.id, **data)


def list_schedulable_emails(database: SqlClient, user_id: str, limit: int = 100) -> list[SchedulableEmailResponse]:
    query = collection(database, user_id).order_by("created_at", direction=Query.DESCENDING)
    results: list[SchedulableEmailResponse] = []
    for snapshot in query.stream():
        if len(results) >= limit:
            break
        data = snapshot.to_dict() or {}
        if not data.get("deleted"):
            results.append(from_snapshot(snapshot))
    return results


def get_schedulable_email(database: SqlClient, user_id: str, email_id: str) -> SchedulableEmailResponse | None:
    snapshot = collection(database, user_id).document(email_id).get()
    if not snapshot.exists:
        return None
    data = snapshot.to_dict() or {}
    if data.get("deleted"):
        return None
    return from_snapshot(snapshot)


def create_schedulable_email(
    database: SqlClient,
    user_id: str,
    payload: SchedulableEmailPayload,
) -> SchedulableEmailResponse:
    reference = collection(database, user_id).document()
    now = datetime.now(timezone.utc).isoformat()
    record = {
        "sender": payload.sender.strip(),
        "subject": payload.subject.strip(),
        "body": payload.body,
        "received_at": payload.receivedAt,
        "is_schedulable": bool(payload.isSchedulable),
        "status": "pending",
        "scheduled_target": None,
        "scheduled_ref_id": None,
    }
    reference.set(
        {
            **record,
            "created_at": SERVER_TIMESTAMP,
            "updated_at": SERVER_TIMESTAMP,
        },
    )
    return SchedulableEmailResponse(id=reference.id, **record, created_at=now, updated_at=now)


def update_schedulable_email(
    database: SqlClient,
    user_id: str,
    email_id: str,
    changes: SchedulableEmailUpdate,
) -> SchedulableEmailResponse | None:
    reference = collection(database, user_id).document(email_id)
    if not reference.get().exists:
        return None
    updates = changes.model_dump(exclude_unset=True, mode="python")
    if updates:
        reference.update({**updates, "updated_at": SERVER_TIMESTAMP})
    return from_snapshot(reference.get())


def delete_schedulable_email(database: SqlClient, user_id: str, email_id: str) -> bool:
    reference = collection(database, user_id).document(email_id)
    if not reference.get().exists:
        return False
    reference.update(soft_delete_payload())
    return True
