"""Redis-backed cache with local in-memory LRU fallback."""

from __future__ import annotations

import json as _json
import time as _time
from typing import Any

try:
    import redis as _redis  # type: ignore
except Exception:  # pragma: no cover
    _redis = None

from app.core.config import settings

_local_cache: dict[str, tuple[float, Any]] = {}
_MAX_LOCAL = 1000
_redis_client = None

CACHE_TTL_SHORT = 30
CACHE_TTL_MEDIUM = 60
CACHE_TTL_LONG = 300


def _get_redis():
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    if not getattr(settings, "redis_url", None) or _redis is None:
        return None
    try:
        _redis_client = _redis.from_url(
            settings.redis_url,
            socket_connect_timeout=2,
            socket_timeout=2,
            decode_responses=False,
        )
        _redis_client.ping()
        return _redis_client
    except Exception:
        return None


def _to_jsonable(value: Any) -> Any:
    """Recursively convert Pydantic models and other non-JSON types to plain dicts."""
    if isinstance(value, list):
        return [_to_jsonable(v) for v in value]
    if isinstance(value, dict):
        return {k: _to_jsonable(v) for k, v in value.items()}
    if hasattr(value, "model_dump"):
        try:
            return _to_jsonable(value.model_dump(mode="json"))  # type: ignore[attr-defined]
        except Exception:
            pass
    if hasattr(value, "dict"):
        try:
            return _to_jsonable(value.dict())  # type: ignore[attr-defined]
        except Exception:
            pass
    return value


def cache_get(key: str) -> Any | None:
    r = _get_redis()
    if r is not None:
        try:
            raw = r.get(key)
            if raw is None:
                return None
            if isinstance(raw, bytes):
                raw = raw.decode()
            return _json.loads(raw)
        except Exception:
            pass
    entry = _local_cache.get(key)
    if not entry:
        return None
    expires, val = entry
    if expires < _time.monotonic():
        _local_cache.pop(key, None)
        return None
    return val


def cache_set(key: str, value: Any, ttl: int = 60) -> None:
    storable = _to_jsonable(value)
    r = _get_redis()
    if r is not None:
        try:
            r.setex(key, ttl, _json.dumps(storable, default=str))
            return
        except Exception:
            pass
    if len(_local_cache) >= _MAX_LOCAL:
        _local_cache.pop(next(iter(_local_cache)), None)
    _local_cache[key] = (_time.monotonic() + ttl, storable)


def cache_delete(key: str) -> None:
    r = _get_redis()
    if r is not None:
        try:
            r.delete(key)
        except Exception:
            pass
    _local_cache.pop(key, None)


def cache_invalidate_prefix(prefix: str) -> None:
    if not prefix:
        return
    r = _get_redis()
    if r is not None:
        try:
            for k in r.scan_iter(match=f"{prefix}*"):
                r.delete(k)
            for k in r.scan_iter(match=f"swr:{prefix}*"):
                r.delete(k)
        except Exception:
            pass
    for k in list(_local_cache.keys()):
        if k.startswith(prefix) or k.startswith(f"swr:{prefix}"):
            _local_cache.pop(k, None)


def cache_clear() -> None:
    """Clear all local entries; Redis keys are left untouched (tests use local only)."""
    _local_cache.clear()
