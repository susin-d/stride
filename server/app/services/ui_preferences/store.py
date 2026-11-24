"""Persistence and version-history operations for per-user UI preferences."""

from datetime import datetime, timezone
from typing import Any

from app.db import SERVER_TIMESTAMP, SqlClient
from app.services.ui_preferences.validation import sanitize_css, validate_page, validate_tokens

UI_PREFS_DOC = "ui-preferences"
MAX_HISTORY = 20


def _reference(database: SqlClient, user_id: str):
    return (
        database.collection("users")
        .document(user_id)
        .collection("settings")
        .document(UI_PREFS_DOC)
    )


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _empty_raw() -> dict[str, Any]:
    return {"version": 1, "global_tokens": {}, "global_css": "", "pages": {}, "history": []}


def _push_history(raw: dict[str, Any], cause: str) -> None:
    history = list(raw.get("history", []))
    snap = {
        "version": int(raw.get("version", 1)),
        "at": raw.get("updated_at") or _utc_now(),
        "cause": cause,
        "snapshot": {
            "global_tokens": dict(raw.get("global_tokens", {})),
            "global_css": raw.get("global_css", ""),
            "pages": dict(raw.get("pages", {})),
        },
    }
    history.append(snap)
    if len(history) > MAX_HISTORY:
        history = history[-MAX_HISTORY:]
    raw["history"] = history


def _persist_raw(
    database: SqlClient,
    user_id: str,
    raw: dict[str, Any],
    *,
    include_reason: bool = False,
) -> dict[str, Any]:
    raw["version"] = int(raw.get("version", 1)) + 1
    raw["updated_at"] = _utc_now()
    payload: dict[str, Any] = {
        "version": raw["version"],
        "global_tokens": raw.get("global_tokens", {}),
        "global_css": raw.get("global_css", ""),
        "pages": raw.get("pages", {}),
        "history": raw.get("history", []),
        "updated_at": SERVER_TIMESTAMP,
    }
    if include_reason:
        payload["last_reason"] = raw.get("last_reason", "")
    _reference(database, user_id).set(payload, merge=True)
    return get_ui_preferences(database, user_id)


def load_raw(database: SqlClient, user_id: str) -> dict[str, Any]:
    snapshot = _reference(database, user_id).get()
    if not snapshot.exists:
        return {}
    return snapshot.to_dict() or {}


def get_ui_preferences(database: SqlClient, user_id: str) -> dict[str, Any]:
    raw = load_raw(database, user_id)
    if not raw:
        return {
            "version": 1,
            "global_tokens": {},
            "global_css": "",
            "pages": {},
            "history": [],
            "updated_at": None,
        }
    return {
        "version": int(raw.get("version", 1)),
        "global_tokens": raw.get("global_tokens", {}),
        "global_css": raw.get("global_css", ""),
        "pages": raw.get("pages", {}),
        "history": raw.get("history", []),
        "updated_at": raw.get("updated_at"),
    }


def save_tokens(
    database: SqlClient,
    user_id: str,
    tokens: dict[str, str],
    page: str | None = None,
    reason: str | None = None,
) -> dict[str, Any]:
    cleaned = validate_tokens(tokens)
    validated_page = validate_page(page)
    raw = load_raw(database, user_id) or _empty_raw()
    _push_history(raw, f"tokens:{validated_page or 'global'}")
    if validated_page is None:
        merged = dict(raw.get("global_tokens", {}))
        merged.update(cleaned)
        raw["global_tokens"] = merged
    else:
        pages = dict(raw.get("pages", {}))
        entry = dict(pages.get(validated_page, {}))
        pt = dict(entry.get("tokens", {}))
        pt.update(cleaned)
        entry["tokens"] = pt
        pages[validated_page] = entry
        raw["pages"] = pages
    if reason:
        raw["last_reason"] = reason[:500]
    return _persist_raw(database, user_id, raw, include_reason=True)


def save_css(
    database: SqlClient,
    user_id: str,
    css: str,
    page: str | None = None,
) -> dict[str, Any]:
    cleaned_css = sanitize_css(css)
    validated_page = validate_page(page)
    raw = load_raw(database, user_id) or _empty_raw()
    _push_history(raw, f"css:{validated_page or 'global'}")
    if validated_page is None:
        raw["global_css"] = cleaned_css
    else:
        pages = dict(raw.get("pages", {}))
        entry = dict(pages.get(validated_page, {}))
        entry["css"] = cleaned_css
        pages[validated_page] = entry
        raw["pages"] = pages
    return _persist_raw(database, user_id, raw)


def save_visibility(
    database: SqlClient,
    user_id: str,
    target: str,
    visible: bool,
    page: str | None = None,
) -> dict[str, Any]:
    if not target or len(target) > 100:
        raise ValueError("Invalid visibility target.")
    if "<" in target or ">" in target:
        raise ValueError("Target must not contain < or >.")
    validated_page = validate_page(page)
    raw = load_raw(database, user_id) or _empty_raw()
    _push_history(raw, f"visibility:{validated_page or 'global'}:{target}")
    pages = dict(raw.get("pages", {}))
    scope = validated_page or "__global_visibility__"
    entry = dict(pages.get(scope, {}))
    vis = dict(entry.get("visibility", {}))
    vis[target] = bool(visible)
    entry["visibility"] = vis
    pages[scope] = entry
    raw["pages"] = pages
    return _persist_raw(database, user_id, raw)


def reset_preferences(
    database: SqlClient,
    user_id: str,
    page: str | None = None,
    version: int | None = None,
) -> dict[str, Any]:
    raw = load_raw(database, user_id)
    if not raw:
        return get_ui_preferences(database, user_id)
    validated_page = validate_page(page) if page else None
    if version is not None:
        history = raw.get("history", [])
        found = next((h for h in history if int(h.get("version", 0)) == int(version)), None)
        if not found:
            raise ValueError(f"Version {version} not found in history.")
        snap = found.get("snapshot", {})
        _push_history(raw, f"restore:v{version}")
        raw["global_tokens"] = dict(snap.get("global_tokens", {}))
        raw["global_css"] = snap.get("global_css", "")
        raw["pages"] = dict(snap.get("pages", {}))
        return _persist_raw(database, user_id, raw)
    if validated_page is None:
        _push_history(raw, "reset:global")
        raw["global_tokens"] = {}
        raw["global_css"] = ""
        return _persist_raw(database, user_id, raw)
    _push_history(raw, f"reset:{validated_page}")
    pages = dict(raw.get("pages", {}))
    pages.pop(validated_page, None)
    raw["pages"] = pages
    return _persist_raw(database, user_id, raw)


def clear_all(database: SqlClient, user_id: str) -> dict[str, Any]:
    _reference(database, user_id).set(
        {
            "version": 1,
            "global_tokens": {},
            "global_css": "",
            "pages": {},
            "history": [],
            "updated_at": SERVER_TIMESTAMP,
        },
        merge=True,
    )
    return get_ui_preferences(database, user_id)
