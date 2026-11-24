"""Repository for multi-device user session persistence."""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.db.session import sync_engine
from app.db.sql.user_sessions import (
    get_user_session,
    list_user_sessions,
    revoke_other_sessions as sql_revoke_other_sessions,
    revoke_session as sql_revoke_session,
    update_session_name,
)


def list_sessions(user_id: str) -> list[dict[str, Any]]:
    """Return all device sessions for a user."""
    with Session(sync_engine) as session:
        return list_user_sessions(session, user_id)


def rename_session(user_id: str, session_id: str, device_name: str) -> bool:
    """Rename a device session; returns False if not found or invalid."""
    with Session(sync_engine) as session:
        return update_session_name(session, user_id, session_id, device_name)


def revoke_session(
    user_id: str,
    session_id: str,
    current_jti: str | None = None,
) -> tuple[str, str | None]:
    """Revoke a session by ID.

    Returns ``("ok", token_jti)``, ``("self", None)``, or ``("not_found", None)``.
    """
    with Session(sync_engine) as session:
        row = get_user_session(session, user_id, session_id)
        if not row:
            return ("not_found", None)
        if current_jti and row.token_jti == current_jti:
            return ("self", None)
        ok = sql_revoke_session(session, user_id, session_id)
        return ("ok", row.token_jti) if ok else ("not_found", None)


def revoke_other_sessions(user_id: str, keep_jti: str) -> int:
    """Revoke all sessions for a user except ``keep_jti``."""
    with Session(sync_engine) as session:
        return sql_revoke_other_sessions(session, user_id, keep_jti)
