"""Device session management — list, rename, revoke for multi-device."""

import asyncio

from fastapi import APIRouter, Header

from app.core.auth import _validate_token_payload
from app.core.cache import cache_invalidate_prefix
from app.core.dependencies import CurrentUser
from app.core.errors import bad_request, not_found
from app.repositories import user_sessions

router = APIRouter(prefix="/auth/sessions", tags=["auth"])


def _current_jti(authorization: str | None = Header(default=None)) -> str | None:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.removeprefix("Bearer ").strip()
    data = _validate_token_payload(token)
    if data and isinstance(data.get("jti"), str):
        return data["jti"]
    return None


@router.get("", response_model=dict)
async def list_sessions(
    user: CurrentUser,
    authorization: str | None = Header(default=None),
):
    jti = _current_jti(authorization)
    rows = await asyncio.to_thread(user_sessions.list_sessions, user["uid"])
    for row in rows:
        row["is_current"] = bool(jti and row.get("token_jti") == jti)
    return {"sessions": rows, "current_jti": jti}


@router.patch("/{session_id}", response_model=dict)
async def rename_session(
    session_id: str,
    payload: dict,
    user: CurrentUser,
):
    name = str(payload.get("device_name") or "").strip()
    if not name or len(name) > 255:
        raise bad_request("Device name must be 1-255 characters.")
    if "<" in name or ">" in name or "javascript:" in name.lower():
        raise bad_request("Invalid device name.")

    ok = await asyncio.to_thread(user_sessions.rename_session, user["uid"], session_id, name)
    if not ok:
        raise not_found("Session not found.")
    cache_invalidate_prefix("session_revoked:")
    return {"ok": True}


@router.delete("/{session_id}", response_model=dict)
async def revoke_session(
    session_id: str,
    user: CurrentUser,
    authorization: str | None = Header(default=None),
):
    jti = _current_jti(authorization)
    outcome, revoked_jti = await asyncio.to_thread(
        user_sessions.revoke_session, user["uid"], session_id, jti
    )
    if outcome == "not_found":
        raise not_found("Session not found.")
    if outcome == "self":
        raise bad_request("Cannot revoke current session via this endpoint. Use logout.")
    cache_invalidate_prefix("session_revoked:")
    # Notify other devices via WS — best effort
    try:
        from app.core.whatsapp_ws_manager import whatsapp_ws_manager

        await whatsapp_ws_manager.broadcast_to_user(
            user["uid"], {"type": "session_revoked", "jti": revoked_jti}
        )
    except Exception:
        pass
    return {"ok": True, "revoked_jti": revoked_jti}


@router.post("/revoke-others", response_model=dict)
async def revoke_others(
    user: CurrentUser,
    authorization: str | None = Header(default=None),
):
    jti = _current_jti(authorization)
    if not jti:
        raise bad_request("Current session has no jti — please re-login.")

    count = await asyncio.to_thread(user_sessions.revoke_other_sessions, user["uid"], jti)
    cache_invalidate_prefix("session_revoked:")
    if count:
        try:
            from app.core.whatsapp_ws_manager import whatsapp_ws_manager

            await whatsapp_ws_manager.broadcast_to_user(
                user["uid"], {"type": "sessions_revoked_others", "keep_jti": jti}
            )
        except Exception:
            pass
    return {"revoked_count": count}
