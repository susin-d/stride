"""Shared constants for health sub-services — single source for table inventory and timing."""

import time

_START_TS = time.monotonic()

# Probe budget. A health response must always finish well inside the docker
# healthcheck window (`timeout: 10s`); without this bound a blocked database
# probe delays the probe for 2-10s instead of reporting a failure.
PROBE_TIMEOUT_SECONDS = 5.0

CHECK_NAME_DATABASE = "database"
CHECK_NAME_CACHE = "cache"
CHECK_NAME_WHATSAPP = "whatsapp_worker"
CHECK_NAME_WORKSPACE = "workspace_storage"

EXPECTED_TABLES = [
    "users",
    "jobs",
    "projects",
    "hackathons",
    "todos",
    "documents",
    "contacts",
    "notifications",
    "calls",
    "eve_sessions",
    "eve_memories",
    "eve_schedules",
    "user_settings",
    "workspace_files",
    "whatsapp_chats",
    "whatsapp_messages",
    "user_sessions",
    "ai_usage",
]


def elapsed_ms(t0: float) -> int:
    return int((time.monotonic() - t0) * 1000)
