# Stride

Stride is a personal productivity workspace: projects, job applications, tasks,
documents, a code workspace, calendars, mail, WhatsApp, hackathons, competitive
programming, and the EVE AI assistant in one place.

> **Reading order for contributors and agents:** `AGENTS.md` (permanent rules) →
> `PROJECT_MAP.md` (file index) → `context.md` (current state) →
> `ARCHITECTURE.md` (durable architecture). History lives in `CHANGELOG.md`;
> decisions live in `docs/adr/`.

## Stack

| Area | Technology |
|---|---|
| Frontend (`website/`) | React 19 + Vite, vanilla CSS design tokens (monochrome, White + Dark modes), Monaco Editor, `lucide-react`, Framer Motion |
| Native shells | Tauri v2 desktop (`website/src-tauri`), Capacitor Android (`website/android`) |
| Backend (`server/`) | FastAPI (Python 3.12), Async SQLAlchemy 2.0, PostgreSQL 16 + pgvector, Redis/LRU cache |
| Auth | Bearer `itsdangerous` tokens (`server/app/core/auth.py`) + Google/GitHub OAuth with native deep-link |
| Worker (`services/whatsapp-worker/`) | Go (WhatsMeow) WhatsApp bridge |
| Deploy | Docker Compose on a VM, or Vercel (frontend) + GCP VM (backend) — see `docs/DEPLOY.md` |

Firebase is **not** used for sessions or storage. The backend owns all data in
PostgreSQL; `FIREBASE_*` credentials are only needed for FCM push notifications.

## Repository layout

```text
stride/
├── website/                  React 19 + Vite frontend (src/, src-tauri/, android/)
├── server/                   FastAPI backend (app/, tests/, sql/ scripts are at root sql/)
├── services/whatsapp-worker/ Go WhatsApp bridge
├── nginx/                    Reverse proxy config
├── sql/                      Canonical schema, migrations, indexes
├── scripts/                  Build and deploy scripts (build-*, deploy-*)
├── docs/                     Guides (BUILD, DEPLOY, SPEECH_PROVIDERS) + docs/adr/
├── AGENTS.md                 Permanent agent rules
├── PROJECT_MAP.md            File index for agents (Tier 1)
├── context.md                Living snapshot of the current state (Tier 2)
├── ARCHITECTURE.md           Layering, ownership, canonical modules
└── docker-compose.yml        Full local/VM stack
```

## Local setup

Prerequisites: Node.js 20.19+ or 22.12+, Python 3.12+, and — for the full stack —
Docker with Compose v2.20+.

### 1. Backend

```powershell
cd server
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Fill in `server/.env`. The principal variables (full list in `server/.env.example`):

```dotenv
APP_ENV=development
DATABASE_URL=postgresql+asyncpg://stride:stride_password@localhost:5432/stride
AUTH_SECRET_KEY=<openssl rand -base64 48>
CRON_SECRET=<openssl rand -hex 32>
OPENROUTER_API_KEY=            # default EVE provider is openrouter/free
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GITHUB_OAUTH_CLIENT_ID=
GITHUB_OAUTH_CLIENT_SECRET=
```

Keep `.env` files and service-account JSON outside version control. Never commit them.

### 2. Database

Either run PostgreSQL locally, or start only the database and cache containers:

```powershell
docker compose up -d postgres redis
```

### 3. Frontend

```powershell
cd website
Copy-Item .env.example .env   # set VITE_API_URL=http://127.0.0.1:8000/api/v1
npm install
npm run dev
```

### 4. Run the API

```powershell
cd server
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- App (dev): `http://127.0.0.1:5173`
- Swagger UI: `http://127.0.0.1:8000/docs`
- Health: `http://127.0.0.1:8000/api/v1/health`

### 5. Full stack in Docker

```powershell
Copy-Item .env.docker.example server/.env
docker compose up --build -d
curl -i http://localhost/health
```

Services and ports are documented in `docs/DEPLOY.md`.

## Verification

```text
# Frontend (from website/)
npm run lint     # oxlint
npm run build    # vite build
npm test         # vitest run

# Backend (from server/)
python -m pytest tests -q

# Smart test cache — skips unchanged scopes (fail-closed)
./scripts/test-smart.ps1 -Scope all   # server|website|worker, -Force to override
```

## Documentation map

| File | Purpose |
|---|---|
| `AGENTS.md` | Permanent rules: architecture boundaries, layering, naming, ADR mandate |
| `PROJECT_MAP.md` | File index — locate a route, page, client, or service without scanning |
| `context.md` | Living snapshot: current routes, pages, features, limitations (<15k) |
| `ARCHITECTURE.md` | Durable architecture: layering, ownership, canonical modules |
| `CODEBASE_AUDIT.md` | Archived Phase-1 audit + the refactor it produced (2026-09-10) |
| `SECURITY.md` | Hardening history, required production env, scan commands |
| `docs/BUILD.md` | Android APK/AAB, desktop MSI/NSIS, and OTA bundle builds |
| `docs/DEPLOY.md` | Docker, GCP VM, Vercel, TLS, and deployment troubleshooting |
| `docs/SPEECH_PROVIDERS.md` | STT/TTS provider comparison behind EVE voice |
| `docs/adr/` | Architecture Decision Records + `README.md` index |

## Known limitations

- Calendar event creation and editing are not implemented.
- Mail attachments, forwarding, rich-text composition, and drafts are not implemented.
- Calls use STUN only; a TURN relay is required behind strict NAT.
- The production frontend build emits a bundle-size advisory.
- Serverless deployments need object storage for modeling projects (they require a filesystem).
