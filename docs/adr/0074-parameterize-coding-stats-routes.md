# ADR 0074 — Parameterize Coding Stats Platform Routes

**Status:** Accepted  
**Date:** 2026-11-25

## Context

`routes/coding_stats.py` had four endpoints:

- `GET /stats/competitive-coding` — aggregate (all three platforms at once)
- `GET /stats/competitive-coding/codeforces`
- `GET /stats/competitive-coding/codechef`
- `GET /stats/competitive-coding/leetcode`

The three per-platform handlers were structurally identical — same `coding_settings()` lookup, same `snapshot_read()` call, same TTLs — differing only in the platform string passed to `load_platform_coding_stats()`. This was a clear DRY violation (copy-paste with one string changed).

The aggregate endpoint `GET /stats/competitive-coding` was never called from frontend code. The frontend (`useWorkspaceData.js`) uses `loadPlatformCodingStats(platform)` which hits per-platform routes.

## Decision

1. Replace the three identical per-platform handlers with a single parameterized `GET /stats/competitive-coding/{platform}` route that validates the platform against `SUPPORTED_PLATFORMS = ("codeforces", "codechef", "leetcode")` and returns 404 for unknown values.
2. Remove the unused aggregate `GET /stats/competitive-coding` route.

Frontend `codingStatsApi.js` already calls `/${platform}` — no frontend change required.

## Consequences

- **Positive:** Reduces 3 near-identical handlers to 1; adding a new platform (e.g., HackerRank) requires one entry in `SUPPORTED_PLATFORMS` instead of a copy-pasted handler.
- **Breaking change for callers of `GET /stats/competitive-coding` (aggregate):** No known callers. The aggregate endpoint is removed.
- **Cache keys unchanged:** `coding-stats:{uid}:{platform}:{hash}` — existing cached snapshots are unaffected.

## Alternatives Considered

- **Keep aggregate + consolidate per-platform:** The aggregate was unreachable from the UI; keeping it adds dead surface without benefit.
