"""Health aggregator — composes per-service checks from other services."""

import asyncio
import logging
import time
from datetime import datetime, timezone

from app.services.health.checks import check_cache, check_database, check_whatsapp_worker, check_workspace_storage
from app.services.health.constants import (
    _START_TS,
    CHECK_NAME_CACHE,
    CHECK_NAME_DATABASE,
    CHECK_NAME_WHATSAPP,
    CHECK_NAME_WORKSPACE,
    PROBE_TIMEOUT_SECONDS,
    elapsed_ms,
)
from app.services.health.endpoints import collect_endpoints

logger = logging.getLogger(__name__)


async def _bounded_check(name: str, probe) -> dict:
    """Run one dependency probe, reporting a timeout as a failed check."""
    try:
        return await asyncio.wait_for(probe(), timeout=PROBE_TIMEOUT_SECONDS)
    except asyncio.TimeoutError:
        return {
            "status": "error",
            "latency_ms": int(PROBE_TIMEOUT_SECONDS * 1000),
            "detail": f"{name} probe timed out after {PROBE_TIMEOUT_SECONDS:g}s",
        }
    except Exception as exc:  # pragma: no cover - probes handle their own errors
        logger.warning("health probe %s raised: %s", name, exc, exc_info=True)
        return {"status": "error", "latency_ms": None, "detail": f"{name} probe failed: {exc}"}


async def collect_health(app=None, detailed: bool = True) -> dict:
    """Run all probes concurrently and build the health payload."""
    t0 = time.monotonic()
    results = await asyncio.gather(
        _bounded_check(CHECK_NAME_DATABASE, check_database),
        _bounded_check(CHECK_NAME_CACHE, check_cache),
        _bounded_check(CHECK_NAME_WHATSAPP, check_whatsapp_worker),
        _bounded_check(CHECK_NAME_WORKSPACE, check_workspace_storage),
        return_exceptions=False,
    )
    db, redis_stat, whatsapp, workspace = results

    if db["status"] == "error":
        overall = "error"
    elif db["status"] == "degraded" or whatsapp["status"] == "error":
        overall = "degraded"
    else:
        overall = "ok"

    checks = {
        CHECK_NAME_DATABASE: db,
        CHECK_NAME_CACHE: redis_stat,
        CHECK_NAME_WHATSAPP: whatsapp,
        CHECK_NAME_WORKSPACE: workspace,
    }

    endpoints = collect_endpoints(app) if (app is not None and detailed) else None

    uptime = time.monotonic() - _START_TS
    timestamp = datetime.now(timezone.utc).isoformat()

    logger.info(
        "health detailed: status=%s db=%s/%sms redis=%s whatsapp=%s workspace=%s endpoints=%s uptime=%.1fs",
        overall,
        db["status"],
        db.get("latency_ms"),
        redis_stat["status"],
        whatsapp["status"],
        workspace["status"],
        len(endpoints) if endpoints is not None else "?",
        uptime,
    )
    for name, stat in checks.items():
        logger.debug("health[%s]=%s %sms detail=%s", name, stat["status"], stat.get("latency_ms"), stat.get("detail"))

    from app.core.config import settings

    summary = f"{overall}: db={db['status']} cache={redis_stat['status']} whatsapp={whatsapp['status']} workspace={workspace['status']}"
    payload: dict = {
        "status": overall,
        "service": settings.app_name,
        "environment": settings.app_env,
        "version": "0.1.0",
        "uptime_seconds": round(uptime, 1),
        "timestamp": timestamp,
        "checks": checks,
        "summary": summary,
        "took_ms": elapsed_ms(t0),
    }
    if detailed:
        payload["endpoints"] = endpoints
        payload["endpoint_count"] = len(endpoints) if endpoints else 0
    else:
        # Non-detailed callers (readiness summaries) must not pay the route
        # inventory walk — liveness carries no endpoint data at all.
        payload["endpoint_count"] = None
    return payload


async def collect_checks() -> dict[str, dict]:
    """Return all per-service checks without endpoint inventory — for /health/checks."""
    results = await asyncio.gather(
        _bounded_check(CHECK_NAME_DATABASE, check_database),
        _bounded_check(CHECK_NAME_CACHE, check_cache),
        _bounded_check(CHECK_NAME_WHATSAPP, check_whatsapp_worker),
        _bounded_check(CHECK_NAME_WORKSPACE, check_workspace_storage),
        return_exceptions=False,
    )
    db, redis_stat, whatsapp, workspace = results
    return {
        CHECK_NAME_DATABASE: db,
        CHECK_NAME_CACHE: redis_stat,
        CHECK_NAME_WHATSAPP: whatsapp,
        CHECK_NAME_WORKSPACE: workspace,
    }


async def get_check(name: str) -> dict | None:
    mapping = {
        CHECK_NAME_DATABASE: check_database,
        CHECK_NAME_CACHE: check_cache,
        "whatsapp": check_whatsapp_worker,
        CHECK_NAME_WHATSAPP: check_whatsapp_worker,
        "workspace": check_workspace_storage,
        CHECK_NAME_WORKSPACE: check_workspace_storage,
    }
    fn = mapping.get(name)
    if not fn:
        return None
    return await _bounded_check(name, fn)
