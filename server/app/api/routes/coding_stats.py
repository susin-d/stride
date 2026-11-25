import asyncio
import hashlib

from fastapi import APIRouter, Depends
from app.db import SqlClient, get_firestore

from app.core.auth import get_current_user
from app.core.cache import CACHE_TTL_LONG, snapshot_read
from app.core.errors import not_found
from app.services.coding_stats import (
    load_coding_stats,
    load_platform_coding_stats,
)

router = APIRouter(prefix="/stats/competitive-coding")

SUPPORTED_PLATFORMS = ("codeforces", "codechef", "leetcode")


def coding_settings(database: SqlClient, user_id: str) -> dict:
    settings_collection = (
        database.collection("users")
        .document(user_id)
        .collection("settings")
    )
    snapshot = settings_collection.document("competitive-coding").get()
    if not snapshot.exists:
        snapshot = settings_collection.document("competitive-programming").get()
    return snapshot.to_dict() if snapshot.exists else {}


@router.get("/{platform}")
async def get_platform_coding_stats(
    platform: str,
    database: SqlClient = Depends(get_firestore),
    user: dict = Depends(get_current_user),
):
    if platform not in SUPPORTED_PLATFORMS:
        raise not_found(f"Unknown platform '{platform}'. Supported: {', '.join(SUPPORTED_PLATFORMS)}.")
    settings = await asyncio.to_thread(coding_settings, database, user["uid"])
    value = settings.get(platform, "")
    return await snapshot_read(
        f"coding-stats:{user['uid']}:{platform}:{hashlib.sha256(value.encode()).hexdigest()[:16]}",
        lambda: load_platform_coding_stats(platform, value),
        {"configured": bool(value.strip()), "status": "missing" if not value.strip() else "refreshing"},
        fresh_ttl=300,
        stale_ttl=CACHE_TTL_LONG,
    )
