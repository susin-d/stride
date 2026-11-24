# ADR 0062 — Snapshot cache blocks on cold miss

## Status

Accepted

- Date: 2026-11-24
- Tags: `cache`, `api`, `correctness`

## Context

`core/cache.py` `snapshot_read()` served stale-while-revalidate reads. On a
**cold key** it returned the caller's `empty` placeholder immediately and
scheduled a background rebuild. Every snapshot consumer therefore answered
`200 {"items": []}` on the first read and only showed data on a later request.

Five API tests failed on exactly this: a record created via `POST` was invisible
to the next `GET /dashboard-overview`, `/notifications`, `/hackathons` or
`/contests`. The same applied to a real user after login on a fresh process or
after `cache_invalidate_prefix` on any mutation: an empty list that looks like
"you have no records" while the refresh was still in flight. A concurrently
failing loader was also swallowed silently (`except Exception: pass`), so a
permanently broken loader degraded to a permanently empty list with no log line.

## Decision

- `snapshot_read()` keeps SWR only for **stale** entries: fresh returns the
  value, stale returns the value and triggers one background refresh.
- On a **cold miss** it now awaits the loader and caches the result, so the
  response reflects real data and the next reader is warm. It takes the refresh
  lock only to record ownership (`owned`), not to gate the write.
- A cold-miss loader failure raises `SnapshotLoaderError` (chained, surfaced as
  500) instead of returning a misleading empty list. Background refresh failures
  are logged at WARNING with `exc_info` and leave the previous snapshot intact.
- `snapshot_read_http()` re-raises an `HTTPException` raised inside a loader, so
  typed integration errors ("Connect Google Drive first.") keep their status
  code instead of becoming a 500. Applied to `google_drive.py`.
- Google Drive's loader now short-circuits "not connected" to `{"files": []}`,
  which is an ordinary state rather than an error.
- Scope: `server/app/core/cache.py`, `app/api/routes/google_drive.py`,
  `tests/unit/core/test_cache.py`.

## Consequences

- **Positive:** cold reads are correct; six previously failing tests pass; a
  broken loader is observable in logs instead of silently empty.
- **Positive:** stale responses stay fast; the SWR benefit is preserved exactly
  where it is safe (data already exists, just old).
- **Negative / Cost:** the first request per key now pays the loader latency
  instead of returning instantly. Cold-key reads are the minority and the
  payloads are small; correctness was traded for a small cold-start cost.
- **Follow-up:** consider prewarming hot keys (`dashboard-overview`) on startup
  to hide the cold latency.

## Alternatives Considered

| Alternative | Why rejected |
|-------------|--------------|
| Keep empty-on-miss and teach the UI a `refreshing` flag | Every consumer would need new handling; the API would still lie about emptiness to any client that ignores the flag |
| Block every read (no SWR at all) | Discards the stale-while-revalidate latency win for existing data |
| Return `202` on cold miss | Breaks the `PageResponse` contract for all snapshot routes |

## References

- `server/app/core/cache.py` (`snapshot_read`, `snapshot_read_http`)
- `server/tests/unit/core/test_cache.py`
