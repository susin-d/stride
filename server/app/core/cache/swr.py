"""Stale-while-revalidate (SWR) snapshot cache with cold-miss blocking."""

from __future__ import annotations

import asyncio
import contextvars
import inspect
import json as _json
import logging
import time as _time
from typing import Any, Callable

from fastapi import HTTPException

from app.core.cache.store import (
    CACHE_TTL_LONG,
    CACHE_TTL_SHORT,
    _MAX_LOCAL,
    _get_redis,
    _local_cache,
    _to_jsonable,
)

logger = logging.getLogger(__name__)

_refresh_tasks: dict[str, asyncio.Task] = {}
_local_refresh_locks: dict[str, float] = {}
_cache_status = contextvars.ContextVar("cache_status", default="-")
_refresh_status = contextvars.ContextVar("refresh_status", default="-")


def get_cache_status() -> str:
    return _cache_status.get()


def get_refresh_status() -> str:
    return _refresh_status.get()


def stale_cache_get(key: str) -> tuple[str, Any | None]:
    """Return ``fresh``, ``stale``, or ``miss`` for a SWR cache entry."""
    now = _time.time()
    r = _get_redis()
    raw = None
    if r is not None:
        try:
            raw = r.get(f"swr:{key}")
            if isinstance(raw, bytes):
                raw = raw.decode()
            raw = _json.loads(raw) if raw else None
        except Exception:
            raw = None
    if raw is None:
        entry = _local_cache.get(f"swr:{key}")
        if entry:
            expires, raw = entry
            if expires < _time.monotonic():
                _local_cache.pop(f"swr:{key}", None)
                raw = None
    if not isinstance(raw, dict) or "value" not in raw:
        _cache_status.set("MISS")
        return "miss", None
    if raw.get("fresh_until", 0) > now:
        _cache_status.set("HIT")
        return "fresh", raw["value"]
    if raw.get("stale_until", 0) > now:
        _cache_status.set("STALE")
        return "stale", raw["value"]
    _cache_status.set("MISS")
    return "miss", None


def stale_cache_set(key: str, value: Any, fresh_ttl: int, stale_ttl: int) -> None:
    """Store a value for fresh reads and a longer stale fallback window."""
    now = _time.time()
    payload = {
        "value": _to_jsonable(value),
        "fresh_until": now + fresh_ttl,
        "stale_until": now + stale_ttl,
    }
    redis_key = f"swr:{key}"
    r = _get_redis()
    if r is not None:
        try:
            r.setex(redis_key, max(stale_ttl, fresh_ttl), _json.dumps(payload, default=str))
            return
        except Exception:
            pass
    if len(_local_cache) >= _MAX_LOCAL:
        _local_cache.pop(next(iter(_local_cache)), None)
    _local_cache[redis_key] = (_time.monotonic() + max(stale_ttl, fresh_ttl), payload)


def _try_refresh_lock(key: str, ttl: int = 60) -> bool:
    lock_key = f"swr-lock:{key}"
    r = _get_redis()
    if r is not None:
        try:
            return bool(r.set(lock_key, "1", nx=True, ex=ttl))
        except Exception:
            pass
    now = _time.monotonic()
    if _local_refresh_locks.get(lock_key, 0) > now:
        return False
    _local_refresh_locks[lock_key] = now + ttl
    return True


def _release_refresh_lock(key: str) -> None:
    lock_key = f"swr-lock:{key}"
    r = _get_redis()
    if r is not None:
        try:
            r.delete(lock_key)
        except Exception:
            pass
    _local_refresh_locks.pop(lock_key, None)


class SnapshotLoaderError(RuntimeError):
    """A snapshot loader raised while rebuilding a cold cache entry."""


async def _await_loader(loader: Callable[[], Any]) -> Any:
    result = loader()
    if inspect.isawaitable(result):
        result = await result
    return result


def _schedule_refresh(key: str, loader: Callable[[], Any], fresh_ttl: int, stale_ttl: int) -> None:
    if key in _refresh_tasks or not _try_refresh_lock(key):
        return
    _refresh_status.set("scheduled")
    task = asyncio.create_task(
        _refresh_snapshot(key, loader, fresh_ttl, stale_ttl, raise_on_error=False)
    )
    _refresh_tasks[key] = task


async def _refresh_snapshot(
    key: str,
    loader: Callable[[], Any],
    fresh_ttl: int,
    stale_ttl: int,
    *,
    raise_on_error: bool,
) -> Any:
    try:
        result = await _await_loader(loader)
        if result is not None:
            stale_cache_set(key, result, fresh_ttl, stale_ttl)
        return result
    except Exception as exc:
        if raise_on_error:
            raise SnapshotLoaderError(f"snapshot loader failed for {key!r}") from exc
        logger.warning("snapshot refresh failed for %r: %s", key, exc, exc_info=True)
        return None
    finally:
        _release_refresh_lock(key)
        _refresh_tasks.pop(key, None)


async def snapshot_read(
    key: str,
    loader: Callable[[], Any],
    empty: Any,
    *,
    fresh_ttl: int = CACHE_TTL_SHORT,
    stale_ttl: int = CACHE_TTL_LONG,
) -> Any:
    """Serve a cached snapshot, falling back to a blocking load on a cold miss."""
    status, value = stale_cache_get(key)
    if status == "fresh":
        return value
    if status == "stale":
        _schedule_refresh(key, loader, fresh_ttl, stale_ttl)
        return value

    owned = _try_refresh_lock(key)
    try:
        return await _refresh_snapshot(key, loader, fresh_ttl, stale_ttl, raise_on_error=True)
    finally:
        if owned:
            _release_refresh_lock(key)


async def snapshot_read_http(
    key: str,
    loader: Callable[[], Any],
    empty: Any,
    *,
    fresh_ttl: int = CACHE_TTL_SHORT,
    stale_ttl: int = CACHE_TTL_LONG,
) -> Any:
    """``snapshot_read`` for route handlers whose loader raises HTTP errors."""
    try:
        return await snapshot_read(
            key,
            loader,
            empty,
            fresh_ttl=fresh_ttl,
            stale_ttl=stale_ttl,
        )
    except SnapshotLoaderError as exc:
        if isinstance(exc.__cause__, HTTPException):
            raise exc.__cause__ from None
        raise
