"""SQL handlers for the 'users/{user_id}/schedulable_emails' collection."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from app.db.sql._shared import coerce_model_value
from app.db.sql.query import SqlSnapshot
from app.models import SchedulableEmail

if TYPE_CHECKING:
    from app.db.sql.query import SqlQuery


def schedulable_email_to_dict(item: SchedulableEmail) -> dict[str, Any]:
    """Serialize SchedulableEmail model to snapshot dictionary."""
    return {
        "id": item.id,
        "sender": item.sender,
        "subject": item.subject,
        "body": item.body,
        "received_at": item.received_at,
        "is_schedulable": item.is_schedulable,
        "status": item.status,
        "scheduled_target": item.scheduled_target,
        "scheduled_ref_id": item.scheduled_ref_id,
        "deleted": item.deleted,
        "deleted_at": item.deleted_at.isoformat() if item.deleted_at else None,
        "created_at": item.created_at.isoformat() if item.created_at else "",
        "updated_at": item.updated_at.isoformat() if item.updated_at else "",
    }


def get_schedulable_email_doc(session: Session, user_id: str, doc_id: str) -> SqlSnapshot:
    """Fetch schedulable email document by user ID and document ID."""
    item = session.get(SchedulableEmail, doc_id)
    if not item or item.user_id != user_id:
        return SqlSnapshot(doc_id, None, exists=False)
    return SqlSnapshot(doc_id, schedulable_email_to_dict(item))


def set_schedulable_email_doc(
    session: Session,
    user_id: str,
    doc_id: str,
    data: dict[str, Any],
    merge: bool = False,
) -> None:
    """Create or update a schedulable email document."""
    item = session.get(SchedulableEmail, doc_id)
    if not item:
        item = SchedulableEmail(
            id=doc_id,
            user_id=user_id,
            sender=data.get("sender", ""),
            subject=data.get("subject", ""),
            body=data.get("body", ""),
            received_at=data.get("received_at"),
            is_schedulable=bool(data.get("is_schedulable", True)),
            status=data.get("status", "pending"),
            scheduled_target=data.get("scheduled_target"),
            scheduled_ref_id=data.get("scheduled_ref_id"),
        )
        session.add(item)
    else:
        if item.user_id != user_id:
            raise PermissionError("Not owner")
        _ALLOWED = {
            "sender",
            "subject",
            "body",
            "received_at",
            "is_schedulable",
            "status",
            "scheduled_target",
            "scheduled_ref_id",
        }
        _TIMESTAMP_FIELDS = {"created_at", "updated_at"}
        _IMMUTABLE = {"id", "user_id"}
        for key, val in data.items():
            if key in {"deleted", "deleted_at"}:
                if hasattr(item, key):
                    setattr(item, key, coerce_model_value(key, val))
                continue
            if key in _IMMUTABLE:
                continue
            if key in _TIMESTAMP_FIELDS or key in _ALLOWED:
                if hasattr(item, key):
                    setattr(item, key, coerce_model_value(key, val))
    session.commit()


def delete_schedulable_email_doc(session: Session, doc_id: str, user_id: str | None = None) -> None:
    """Delete a schedulable email document by ID."""
    item = session.get(SchedulableEmail, doc_id)
    if not item:
        return
    if user_id is not None and item.user_id != user_id:
        return
    session.delete(item)
    session.commit()


def query_schedulable_emails(session: Session, user_id: str, query: SqlQuery) -> list[SqlSnapshot]:
    """Execute query on the user's schedulable_emails collection."""
    stmt = select(SchedulableEmail).where(SchedulableEmail.user_id == user_id)
    has_deleted_filter = any(f[0] == "deleted" for f in query.filters)
    if not has_deleted_filter:
        stmt = stmt.where(SchedulableEmail.deleted == False)  # noqa: E712
    for field, op, val in query.filters:
        if field == "deleted" and op in ("==", "="):
            stmt = (
                stmt.where(SchedulableEmail.deleted == val)
                if val
                else stmt.where(SchedulableEmail.deleted == False)  # noqa: E712
            )
        elif field == "status" and op in ("==", "="):
            stmt = stmt.where(SchedulableEmail.status == val)
    if query._start_after_doc_id:
        cursor = session.get(SchedulableEmail, query._start_after_doc_id)
        if cursor and cursor.created_at:
            if query._order_by == "created_at" and query._direction == "DESC":
                stmt = stmt.where(
                    or_(
                        SchedulableEmail.created_at < cursor.created_at,
                        and_(SchedulableEmail.created_at == cursor.created_at, SchedulableEmail.id < cursor.id),
                    )
                )
            elif query._order_by == "created_at":
                stmt = stmt.where(
                    or_(
                        SchedulableEmail.created_at > cursor.created_at,
                        and_(SchedulableEmail.created_at == cursor.created_at, SchedulableEmail.id > cursor.id),
                    )
                )
    if query._order_by == "created_at":
        if query._direction == "DESC":
            stmt = stmt.order_by(SchedulableEmail.created_at.desc(), SchedulableEmail.id.desc())
        else:
            stmt = stmt.order_by(SchedulableEmail.created_at.asc(), SchedulableEmail.id.asc())
    if query._limit:
        stmt = stmt.limit(query._limit)
    items = session.scalars(stmt).all()
    return [SqlSnapshot(item.id, schedulable_email_to_dict(item)) for item in items]
