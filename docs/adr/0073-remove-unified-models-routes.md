# ADR 0073 — Remove Unused Unified Model Discovery Routes

**Status:** Accepted  
**Date:** 2026-11-25

## Context

`routes/unified_models.py` registered two routes under `/api/v1/models`:

- `GET /models` — aggregated live models from all providers via `discover_all_models()`
- `GET /models/{provider}` — per-provider filtered view

These overlapped conceptually with `GET /settings/ai-models/models/{provider}` in `ai_models.py`, which uses `fetch_provider_models()` and is actively called by `AiModelsSection.jsx` for live API-key validation.

Audit confirmed:
- No frontend code called `/models` or `/models/{provider}`.
- `discover_all_models()` was only imported by `unified_models.py` itself.
- The `_user_keys_from_db()` helper in `unified_models.py` was a local re-implementation of `extract_user_keys(load_ai_preference(...))` already available in `ai_models.py` and exported from `services/ai_models/config`.

## Decision

1. Remove `routes/unified_models.py` entirely.
2. Remove its import and `include_router` call from `router.py`.
3. `discover_all_models()` in `services/ai_models/unified.py` is kept — it is a valid service-layer function that could be reused internally (e.g., future TTS model picker, internal tooling). Only the HTTP route exposure is removed.

The active per-provider model endpoint remains: `GET /settings/ai-models/models/{provider}` in `ai_models.py`.

## Consequences

- **Positive:** Removes two unused routes and ~76 lines of route code; eliminates duplicate key-extraction helper.
- **Negative:** If a future feature needs a richer model catalog endpoint (e.g., with `tts`/`stt`/`modalities` filters), it must be re-added. The service function `discover_all_models` already supports these filters and is ready to back a new route.

## Alternatives Considered

- **Merge into `/settings/ai-models`:** The `/settings/ai-models/models/{provider}` endpoint already serves the UI's needs. Adding `tts`/`stt` filter params there would be a future extension, not required now.
- **Keep routes, add frontend client:** Rejected — YAGNI; no current consumer exists.
