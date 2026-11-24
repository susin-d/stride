# ADR 0063 — Bounded health probes with honest status

## Status

Accepted

- Date: 2026-11-24
- Tags: `health`, `ops`, `docker`

## Context

Three documents disagreed about `GET /api/v1/health`:

- `routes/health/__init__.py` described it as "liveness, zero I/O — no checks".
- `routes/health/main.py` called `collect_health(detailed=False)`, which probes
  database, cache, WhatsApp worker and workspace storage.
- `services/health/liveness.py` (`build_liveness`) implements the zero-I/O
  payload but had **no route**; only unit tests called it.

Measured against the real development configuration, `/api/v1/health` took
**2.5–10.4 s** per call and still returned `200 {"status": "ok"}` while the
database probe reported `error`. Two defects followed:

1. `docker-compose.yml` uses this endpoint as the server healthcheck with
   `--max-time 8`. A blocked database probe could exceed the client timeout and
   mark a running container unhealthy.
2. `aggregator.collect_health` only mapped `db == "degraded"` to overall
   `degraded`; a **degraded database** still reported overall `ok`, because the
   `ellif` branch was unreachable in practice — an unhealthy database could
   report `200 ok`.

## Decision

- Keep `/api/v1/health` (and the root `/health` alias) as a **readiness**
  response carrying dependency checks and no endpoint inventory.
- Bound every probe with `PROBE_TIMEOUT_SECONDS = 5.0` through `_bounded_check`.
  A probe that exceeds the budget reports `status: "error"` with a
  `timed out after Ns` detail instead of stalling the response.
- Correct overall status: database `error` → `error`; database `degraded` or a
  WhatsApp worker `error` → `degraded`; otherwise `ok`.
- Serve the zero-I/O payload that already existed at a new root alias
  `GET /health/ready`, for load balancers that must never block on I/O.
- Check names come from `constants.py` (`CHECK_NAME_*`) rather than repeated
  string literals in the aggregator.
- Tests updated to the real contract, plus new coverage for probe timeouts and
  the degraded-database status.

## Consequences

- **Positive:** health responses are bounded well inside the 8 s docker budget.
- **Positive:** a degraded/erroring dependency now changes the reported status.
- **Positive:** the previously dead `build_liveness` has a real route.
- **Negative / Cost:** `/health` does I/O every call; docker probes every 15 s
  pay up to 4 concurrent probes. Probes are cheap when healthy.
- **Follow-up:** consider pointing the docker healthcheck at `/health/ready`
  once container start-up ordering no longer needs readiness checks.

## Alternatives Considered

| Alternative | Why rejected |
|-------------|--------------|
| Make `/health` pure liveness (match the docstring) | Loses readiness for reverse proxies/load balancers; docker's `service_healthy` gate needs dependency readiness |
| Remove the probes from `/health` | Same as above |
| Raise `--max-time` in docker | Hides the stall instead of bounding it |

## References

- `server/app/services/health/aggregator.py` (`_bounded_check`, `collect_health`)
- `server/app/api/routes/health/__init__.py`
- `server/app/main.py` (`/health/ready`)
- `docker-compose.yml` (server healthcheck)
