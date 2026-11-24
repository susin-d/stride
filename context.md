# Stride Context

Living snapshot for AI agents. `AGENTS.md` holds permanent rules; this file holds the **current state**. See `CHANGELOG.md` for history and `PROJECT_MAP.md` for the file index.
Last updated: 2026-11-24 — Docs consolidated: stale design-system/Docker/deploy/server-README files merged or removed, root README rewritten for the SQL + `itsdangerous` stack, duplicate ADR 0053 renumbered to 0058, PROJECT_MAP page map fixed to the `/app/*` router ids.

## Contents
1. [Overview](#1-overview) · 2. [Repository structure](#2-repository-structure) · 3. [Backend](#4-backend) · 4. [Frontend](#4-frontend) · 5. [Design system](#5-design-system) · 6. [Current snapshot](#6-current-snapshot) · 7. [Limitations](#7-limitations) · 8. [Verification](#8-verification)

## 1. Overview
Personal productivity workspace: projects, jobs, tasks, documents, code workspace, calendars, email, WhatsApp, hackathons, competitive programming, and EVE AI assistant.

- **Frontend** (`/website`): React 19 + Vite + Vanilla CSS (monochrome semantic tokens, two modes — White and Dark, ADR 0057) + Monaco Editor. Docker multi-stage + Nginx. `vite define __APP_VERSION__` + updaters (`updatesApi`, `desktopUpdater`, `androidUpdater`, `otaUpdater`, `useAutoUpdater`, `UpdateBanner`, `UpdateSection` in Settings).
- **Backend** (`/server`): FastAPI + Supabase PostgreSQL 16 + pgvector + Async SQLAlchemy 2.0. Mount `server/static/updates` at `/updates` (StaticFiles) + `/api/v1/updates` (check/latest/android/ota).
- **Desktop** (`/website/src-tauri`): Tauri v2 + bundle `msi/nsis` + `tauri-plugin-updater/process` (pubkey in tauri.conf, endpoints `api.stride.../updates/latest.json`).
- **Worker** (`/services/whatsapp-worker`): Go (WhatsMeow) bridge.
- **Build** (`/scripts`): `build-{android,desktop,ota,all}.{ps1,sh}` + `lib/common.ps1` (signing via `TAURI_SIGNING_PRIVATE_KEY`/`ANDROID_KEYSTORE_*`, version sync, `cap sync`, `gradlew`/`tauri build`, scp publish) — see `docs/BUILD.md`.
- **Auth:** Bearer `itsdangerous` tokens + Google OAuth (web popup + native deep-link `com.stride.app://` / `app.stride.workspace://` via `platform` state → 302, Capacitor Browser/App + Tauri deep-link, `isNativeApp` landing→login, 16px mobile inputs). Deploy targets Vercel (serverless) or Docker VM.

## 2. Repository structure
```text
stride/
├── website/            React 19 + Vite (monochrome tokens, White/Dark modes, Monaco, lucide-react, Framer Motion)
├── server/             FastAPI backend (app/api, app/core, app/db/sql, models, repos, schemas, services)
├── services/whatsapp-worker/  Go bridge
├── sql/                extensions, schema (18 tables), migrations, indexes (incl. HNSW)
├── nginx/              reverse proxy (10r/s burst 60, /api /ws /updates + Gzip)
├── scripts/            build-android/desktop/ota/all + deploy (vm-*, pc-*)
├── docs/adr/           ADRs 0001–0058 + _template + README
├── docs/               BUILD.md · DEPLOY.md · SPEECH_PROVIDERS.md
├── README.md           Onboarding (stack, setup, verification) · SECURITY.md (prod env, scans)
├── CODEBASE_AUDIT.md   Archived 2026-09-10 audit + refactor outcome (history only)
├── PROJECT_MAP.md      Agent index — read first (Tier 1) · AGENTS.md: permanent rules
├── context.md          This file — current snapshot (Tier 2, <15k)
└── CHANGELOG.md        History log · opencode.json preloads AGENTS + PROJECT_MAP
```
For full maps see `PROJECT_MAP.md`. Keep this section brief; expand there.

## 3. Backend
- **Factory:** `server/app/main.py` `create_app()` — lifespan (CORS, `/api/v1` router, `/ws/calls`, `/ws/whatsapp`, `ServerBackgroundWorker`).
- **Worker:** `core/worker.py` `ServerBackgroundWorker` (Docker) + Vercel Cron `vercel.json` → `/api/v1/cron/execute-schedules` `*/15 * * * *` (serverless, rewrites `((?!api/).*)`). Verify `CRON_SECRET`.
- **Prefix:** `/api/v1`. Auth via `core/auth.py`. Errors via `core/errors.py`. Pagination via `core/pagination.py` (cursor `created_at,id` + `limit+1`).
- **Layering:** Routes → Services/Repos → Core/Models. Never import FastAPI types in Services/Repos. Use `CurrentUser`/`CurrentUserId`/`DbClient` from `core/dependencies.py`.
 - **Route groups:** `auth/` (oauth/credentials/password/account/combine/sessions), `workspace/` (jobs/hackathons/projects/notifications/contests/calendar), `whatsapp/` (status/chats/messages/settings/webhook+`_shared`), `workspace_files`, `whatsapp_ws`+`calls_ws`+`twilio-relay`, `eve`+`eve_stream` (SSE), `calls`+`calls_twilio`, `ai_models`, `eve_speech`, `eve_avatar` (`/eve/avatar/preferences|models|upload`, upload 12MB + zip model3.json guard, per-user `avatars/{uid}/`), `ui_preferences` (`/ui/preferences` tokens/CSS/visibility/history + `GET /history`), `cron`, `health`.
  - **Repos:** one per entity (`helpers.py` soft-delete/snapshot, `pagination.py` facade). **Services:** `eve/` (chat/stream/tools/handlers/memories/RAG + `ui` tools), `ui_preferences` (sanitize CSS, allowlist tokens, history 20), `ai_models/` (contracts `AIServiceError` + `classify_provider_error`; `openai_compat` adapter, `max_tokens` capped by provider, quota retry, default `openrouter/free` with provider fallback — ADRs 0007/0014), `speech/` (Groq/Deepgram STT, Google/OpenRouter TTS), `twilio/`, `oauth/` (canonical `stride.susindran.in`, ADR 0006), `web_browsing/`, `embeddings` (1536-dim).
 - **DB:** `models/` (`UserSession` for devices) + mixins. SQL in `sql/` (idempotent, now `user_sessions` + indexes `ix_user_sessions_*`). `db/sql/` modular handlers + `registry.py` dispatch + `base.py` CRUD + RLS `SET LOCAL app.current_user_id`. Device sessions 30d expiry, 10 cap LRU. Schedule create persists all fields (`next_run_at`/`enabled` round-trip for due-scan); call `update()` round-trips `created_at`/`updated_at` (stale-ring expiry).
 - **Performance:** hot reads `async+to_thread`, composite indexes, pools `5/5 recycle 300`, Redis/LRU `cached` per-user + stale-while-revalidate snapshots in `core/cache.py`, workspace disk. Provider-backed GitHub, Calendar, Drive, Gmail, coding stats, contests, hackathons, and dashboard reads return snapshots/empty states while refreshes run in the background. `usage:summary/logs` `SHORT 30s` + invalidates. Rate-limit `10r/s burst 60` + CORS via `$cors_allow_*` + `RateLimitMiddleware`.
- **Logging:** `core/app_logging.py` `setup_logging()` + `core/request_log.py` access lines → `LOG_DIR` (`server/logs/` local, `/app/logs` + `server-logs` volume in Docker) `stride.log` INFO+ / `stride-error.log` WARNING+, midnight rotation × `LOG_RETENTION_DAYS=7` (ADR 0050); serverless stdout-only.
- **Health:** `/health` and `/api/v1/health` report database, cache, WhatsApp worker, and workspace statuses without endpoint inventory; `/health/detailed`, `/health/checks`, and `/health/checks/{name}` remain available for detailed/readiness probes.
- **Dashboard performance:** GitHub `/data` accepts `repository_limit`/`include_stats`; the dashboard caches 60s and requests the 3 newest repositories without contribution history, while Projects/Stats request full data.

## 4. Frontend
- **Entry:** `website/src/main.jsx` → `App.jsx` (routing + workspace state). **Layout:** `layouts/AppLayout.jsx`.
 - **UI primitives** `components/ui/` (`Modal`, `MailModal`, `ConfirmDialog`, `EmptyState`, `CustomDropdown`, `CalendarPicker`, `Markdown`, `TabNav`, `SectionHeading`, `SettingsCard`, `MetricCard`, `SearchBar`, `Pagination`, `FilterBar`, `Alert`, `LoadingState`, `Avatar`, `Badge`, `EveUiBanner`) — must reuse before creating ad-hoc. Page titles live in the topbar; actions sit in `.page-inline-actions`. **Eve Avatar** `components/eve/avatar/` (`EveAvatar`, `EveGlobalCompanion`, `EveInlineAvatar`, `VrmModel`/`Live2DModel` fallbacks, hooks `useEveAvatarState`/`useLipSync`/`useEyeTracking`/`useAvatarPref`/`useAvatarLifecycle`, `EveAvatarProvider` + `EveGlobalCompanionHost`) — glass `eve-avatar.css` (tokens, reduced-motion).
- **Hooks:** `hooks/` (`useAuth`, `useRouter`, `useThemeCustomizer`, `useWorkspaceData` staggered, `useCustomUI`, `useDevices`, `useSyncEvents`, `call/` `useWebRTC`/`useEveVoice`/`useCallCenter`) + `usePersistentState`.
  - **API clients** `lib/` — one per backend feature via `request.js` `apiRequest` (dedup + cache 30s/15s + concurrency 6 + retries + `X-Device-Id`, 401 logout). `authApi` device-aware, `uiPreferencesApi`, `eveAvatarApi`, `firebase.js`.
  - **Brand:** `components/StrideLogo.jsx` (styled by `.stride-logo-icon` in `styles/components/header-topbar.css`); icons/bundle art come from `public/logo.png`.
  - **Pages:** Dashboard, Projects, Jobs, Hackathons, Todo, Documents, Workspace (IDE + Eve + Browser), Studio (hero→builder/apps/templates), Eve (chat+memory+voice+schedules), Compete (contests + coding stats), **Avatar Studio** (`/app/avatar`, lazy), Calls, WhatsApp, Mails, Calendar, Contacts, `UsagePage`, Settings, `CustomPage`, Themes, Profile, Onboarding, Landing. Full route map: `PROJECT_MAP.md`. Global `EveGlobalCompanion` dock.
     - **Config:** `config/navigation.js` (`avatar` → Avatar Studio in the Evolve group), `config/search/` (7 modules), `dashboard/dashboardConfig.js`, `themes/` (`themeApplicator` engine + `THEME_MODES`, ADR 0057), `utils/` pure transformers, `styles/` import chain + `eve-avatar.css` + `pages/avatar.css` (Vite `avatar-3d`/`avatar-live2d` chunks), `public/avatars/` examples.

## 5. Design system
- **Palette:** Strictly monochrome with exactly two modes (ADR 0057) — **White** (`styles/themes/index.css`) and **Dark** (`styles/themes/dark.css`). Identity comes from a neutral ink ladder, fill weight, borders, and icons: primary `#171717` (white mode) / `#f5f5f5` (dark), statuses on one ramp (`success #525252`, `warning #5c5c5c`, `danger #0a0a0a`, `purple #404040`; inverted in dark), `--on-fill`/`--text-inverse` flip per mode. No presets, no color editor.
- **Tone-only module coding:** `--module-*` accents carry neutral tones (Work/Chats/Projects darkest, Studio/Eve/Calendar mid, Account lightest) so groups stay groups without hue.
- **Engine:** `themes/themeApplicator.js` owns `THEME_MODES`, `DEFAULT_APPEARANCE`, geometry/motion catalogs, `applyTheme()` (mode class + geometry + `theme-color` meta read from live `--bg-primary`) and `resetThemeVariables()`; `useThemeCustomizer` persists `{mode, fontFamily, radius, density, elevation, motion}` in `stride.custom_theme`; `useAppEffects.useAppTheme` paints the stored appearance at boot; the Header toggle flips mode. Themes page = White/Dark cards + geometry controls + live preview + JSON export/import.
- **Tokens first:** `styles/tokens.css` CSS vars (8pt `--space-*` scale, `--content-max-width` 1440, `--content-gutter`/`--section-gap`/`--card-padding` clamps, `--header-height` 68/62, `--sidebar-*`, neutral `--glow-*`/`--gradient-*`, `--chart-*`, `--heat-*`). Import order `tokens→base→utilities→responsive→components→pages→layout-symmetry` via `App.css`.
- **Pinned neutral scopes:** landing `.cinema` (dark ramp + light variant, fixed mode previews) and `.auth-cinematic.auth-cinematic` (auth) pin their own neutral values — the documented palette-rule exceptions.
- **One CSS per component/page**, `kebab-case` classes scoped, use vars (`var(--radius-lg)`), dark overrides in `styles/themes/dark.css`.
- **Full-page, no clip:** `min-height:100vh` accounting for chrome, natural scroll. Responsive mobile-first with `clamp()`. Geometry in `layout-symmetry.css`.
- Icons `lucide-react` only.

## 6. Current snapshot
- **Eve latency/streaming (ADRs 0041/0014):** memory extraction runs after the `done` yield on a daemon thread; 30s RAG cache, `MAX_INJECTED_MEMORIES=15`, 5-min session cache, `asyncio.Queue` SSE bridge. `EveChatSection`/`WorkspaceEvePanel` surface `thinking`/`delta`/`toolCalls` with `EveThoughtHistory`; `openai_compat` caps `max_tokens` by provider, retries quota halved, then `_FALLBACK_ORDER`.
- **Eve Avatar (ADR 0012):** dual VRM+Live2D via `EveAvatarProvider` (lip-sync + `BroadcastChannel`); global companion, inline micro, Avatar Studio `/app/avatar`, `EveAvatarSection`; `/eve/avatar/*` validates and stores `avatars/{uid}/`.
- **Avatar modeling (ADR 0034/0039/0040):** `pages/avatar-studio/` editor — schema-v2 GLB/GLTF/VRM/OBJ/FBX scenes, `/modeling/projects` API, outliner, inspector, timeline, UV painting, GLB export.
- **Studio:** unified prompt-first Builder, status-aware Apps gallery, filterable Templates catalog, preview readiness metadata, Builder IDE handoff via `StudioHero`.
- **EVE/voice:** multi-provider + live `/v1/models`; SSE `delta`/`thinking`/`tool`/`done` + RAG + auto-remember (capped 3); tools: workspace files, web, WhatsApp, browser, schedule, UI (`ui-preferences`); `ModelSelectorDropdown` + `openrouter/free` default; `voice_fast.py` Groq 8b-instant + `POST /eve/voice/stream` + Twilio `ConversationRelay`; STT browser/Groq/Deepgram, TTS Google/OpenRouter Fish.
- **Calls/search:** `in_app` WebRTC vs Twilio PSTN + `CallWSManager` multi + `BroadcastChannel`; `⌘K` palette + Landing cinema (`cinema-{base,hero,sections,motion}.css`) with the pinned monochrome ramp (ADR 0057) under the Hero.
- **Loading:** `WaveLoader` music-bar equalizer (reduced-motion safe) + `LoadingState`.
- **Branding:** Stride everywhere — storage/event keys, Docker/DB/image names, log files, native IDs, domains (ADR 0056).

## 7. Limitations
- Modeling projects require non-serverless filesystem storage; object storage is still needed for serverless deployments. VRM export currently validates and reports unsupported scenes while GLB/GLTF export is available. Sculpt/UV/texture-paint tooling remains the next modeling milestone beyond the current scene/transform/material foundation.
- Calendar create/edit not implemented. Mail attachments/forwarding/rich-text/drafts not implemented. Calls use STUN only — TURN needed for strict NAT. Frontend bundle emits size advisory.
- The rebrand (ADR 0056) is not deploy-ready on its own: DNS + TLS for `stride.susindran.in`/`api.stride.susindran.in`, Google/GitHub OAuth redirect re-registration, the Vercel Primary domain, and the `com.stride.app`/`app.stride.workspace` deep-link schemes must be provisioned before the next release.

## 8. Verification
```text
# Frontend (website/)
npm run lint && npm run build && npm test
# Backend (server/)
python -m pytest tests -q  # xdist parallel, 30s timeout, per-worker SQLite
# Smart cache — skips scopes whose content hash is unchanged (fail-closed)
./scripts/test-smart.ps1 -Scope all  # server|website|worker, -Force to override
# Docker
docker compose config && curl -i http://localhost/health
```
Tests: pytest `asyncio_mode=auto` + `xdist loadfile` + `timeout 30`, harness `tests/support/` (per-worker SQLite, truncate rows, real tokens, scripted AI providers), `tests/{unit,api,services,e2e}` — Eve auto-memory disabled globally, WS ping 0.1s in tests.
