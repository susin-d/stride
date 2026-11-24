# 0067: Codebase Deslop & Modularization

- **Status:** Accepted
- **Date:** 2026-11-24

## Context

Following earlier feature additions and removals (e.g., Avatar Studio removal in ADR 0059), several unreferenced frontend modules remained on disk, several backend and frontend modules exceeded the 400–500 line maintainability threshold (`AGENTS.md` §3.3), and two backend modules retained layering violations (`auth/sessions.py` querying `app.db.sql` directly; `services/eve/chat.py` raising `fastapi.HTTPException`).

## Decision

1. **Dead-code removal (`website/`)**: Deleted verified unreferenced files (`lib/modelingApi.js`, `pages/jobs/JobTimeline.jsx`, `components/eve/EveSchedulesCard.jsx`, `components/eve/avatar/avatarTokens.js`, `hooks/useLocalNotifications.js`, `pages/whatsapp/WhatsAppSyncState.jsx`).
2. **Backend layering & facade splits (`server/`)**:
   - Added `repositories/user_sessions.py` so `api/routes/auth/sessions.py` no longer imports `sync_engine` or `app.db.sql`.
   - Replaced `HTTPException` in `services/eve/chat.py` with `EveChatError`, translated at the route boundary in `api/routes/eve.py`.
   - Extracted DDL backfills from `db/session.py` into `db/schema_backfills.py` with shared column/index helpers.
   - Split `services/whatsapp.py`, `core/cache.py`, and `services/ui_preferences.py` into focused packages (`services/whatsapp/`, `core/cache/`, `services/ui_preferences/`) behind thin `__init__.py` facades preserving all public imports.
3. **Frontend modularization & deslop (`website/`)**:
   - Extracted `useCalendarData.js` from `useWorkspaceData.js`, `beginOAuthPopupFlow` into `utils/popupOAuth.js` (routing `googleContacts.js` non-popup calls through `apiRequest`), `pages/usage/` (removing inline styles into `usage.css`), `pages/hackathons/` (shared `HackathonFormModal`), `pages/dashboard/`, `components/search/useSearchPalette.js`, and `components/header/`.
   - Standardized manual `localStorage` state in `HackathonsPage` and `useSearchPalette` onto `usePersistentState`.
4. **Go worker split (`services/whatsapp-worker/`)**:
   - Split `internal/api/api.go` into `handler.go`, `pair.go`, `chats.go`, `messages.go`, and `internal/events/events.go` into `events.go`, `history_sync.go`, `connection.go`, `message.go`.

## Consequences

- **Positive:** Smaller, single-responsibility modules under 400 lines; strict repository/service layering; zero behavior or API contract changes.
- **Negative:** Slightly more files per feature package, mitigated by preserving package facades.

## Alternatives Considered

- **In-place cleanup without splitting:** Rejected because 450–600 line files still violated `AGENTS.md` §3.3 and mixed unrelated concerns.
