"""Facade — preserves `from app.api.routes.health import router` after split.

The monolithic 27-line health.py has been split per SRP:
- main.py      : GET /health (readiness: dependency checks, no endpoint inventory)
- detailed.py  : GET /health/detailed (full checks + endpoint inventory)
- checks.py    : GET /health/checks and GET /health/checks/{name} (per-service probes from other services)

Every probe is bounded by `PROBE_TIMEOUT_SECONDS` so a blocked dependency
reports a failure instead of stalling the response. The zero-I/O liveness
payload (`build_liveness`) is served from the root alias `/health/ready`, not
from these versioned routes.

Each check's logic lives in `app/services/health/checks/{name}.py` — i.e. in
another service, so the health endpoint itself stays small.
"""

from fastapi import APIRouter

from .checks import router as checks_router
from .detailed import router as detailed_router
from .main import router as main_router

router = APIRouter()
router.include_router(main_router)
router.include_router(detailed_router)
router.include_router(checks_router)

__all__ = ["router"]
