"""Response-cache key helpers and @cached decorator for GET handlers."""

from __future__ import annotations

import asyncio
import hashlib
import json as _json
from functools import wraps
from typing import Any, Callable

from app.core.cache.store import (
    CACHE_TTL_SHORT,
    cache_get,
    cache_invalidate_prefix,
    cache_set,
)
from app.core.cache.swr import _cache_status

_EXCLUDED_KEY_PARAMS = {"database", "db", "request", "response"}


def _extract_user_id(kwargs: dict[str, Any]) -> str | None:
    user = kwargs.get("user")
    if isinstance(user, dict) and user.get("uid"):
        return str(user["uid"])
    for key in ("user_id", "current_user_id", "uid"):
        val = kwargs.get(key)
        if isinstance(val, str) and val:
            return val
    return None


def build_cache_key(prefix: str, user_id: str | None = None, **params: Any) -> str:
    """Deterministic cache key with mandatory user scoping when present."""
    filtered = {
        k: v
        for k, v in params.items()
        if k not in _EXCLUDED_KEY_PARAMS and v is not None
    }
    if not filtered:
        return f"{prefix}:{user_id}" if user_id else prefix
    payload = _json.dumps(filtered, sort_keys=True, default=str, separators=(",", ":"))
    digest = hashlib.sha256(payload.encode()).hexdigest()[:12]
    if user_id:
        return f"{prefix}:{user_id}:{digest}"
    return f"{prefix}:anon:{digest}"


def cache_invalidate_user_prefix(prefix: str, user_id: str | None) -> None:
    """Invalidate a user-scoped prefix, e.g. ``todos:user-1`` wipes list+detail."""
    if not prefix:
        return
    if user_id:
        cache_invalidate_prefix(f"{prefix}:{user_id}")
    else:
        cache_invalidate_prefix(prefix)


def _build_call_cache_key(cache_prefix: str, args: tuple[Any, ...], kwargs: dict[str, Any]) -> str:
    uid = _extract_user_id(kwargs)
    params = {k: v for k, v in kwargs.items() if k not in _EXCLUDED_KEY_PARAMS and k != "user"}
    for alias in ("user_id", "current_user_id", "uid"):
        params.pop(alias, None)
    for idx, val in enumerate(args):
        if isinstance(val, (str, int, float)):
            params[f"arg{idx}"] = val
    return build_cache_key(cache_prefix, uid, **params) if params else build_cache_key(cache_prefix, uid)


def cached(ttl: int = CACHE_TTL_SHORT, prefix: str | None = None):
    """Decorator for simple GET handlers — caches JSON-serializable returns."""

    def decorator(func: Callable):
        cache_prefix = prefix or func.__name__

        if asyncio.iscoroutinefunction(func):

            @wraps(func)
            async def async_wrapper(*args: Any, **kwargs: Any):
                key = _build_call_cache_key(cache_prefix, args, kwargs)
                hit = cache_get(key)
                if hit is not None:
                    _cache_status.set("HIT")
                    return hit
                _cache_status.set("MISS")
                result = await func(*args, **kwargs)
                if result is not None:
                    cache_set(key, result, ttl=ttl)
                return result

            return async_wrapper

        @wraps(func)
        def sync_wrapper(*args: Any, **kwargs: Any):
            key = _build_call_cache_key(cache_prefix, args, kwargs)
            hit = cache_get(key)
            if hit is not None:
                _cache_status.set("HIT")
                return hit
            _cache_status.set("MISS")
            result = func(*args, **kwargs)
            if result is not None:
                cache_set(key, result, ttl=ttl)
            return result

        return sync_wrapper

    return decorator
