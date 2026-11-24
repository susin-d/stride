# Stride — Deployment Guide

Covers the two supported shapes of the deployment:

1. **Full Docker Compose stack** on a VM (website + API + Postgres + Redis + worker + nginx).
2. **Split**: Vercel hosts `website/`, a GCP e2-micro VM hosts the backend stack.

Both use the same images and environment file. See `docs/BUILD.md` for Android,
desktop, and OTA artifacts.

---

## 1. Stack overview

| Service | Container | Internal port | Host port | Notes |
|---|---|---|---|---|
| `nginx` | `stride-nginx` | 80, 443 | 80, 443 | Edge proxy; `/api/` + `/ws/` on the VM, `/` for local dev; 10r/s burst 60 |
| `website` | `stride-website` | 80 | 3000 | Vite production build; on VM deployments the public site is usually Vercel |
| `server` | `stride-server` | 8000 | 127.0.0.1:8000 | FastAPI/Uvicorn, 512M limit, DB pool 5/5, Redis cache |
| `postgres` | `stride-postgres` | 5432 | 5432 | `pgvector/pgvector:0.8.0-pg16` |
| `redis` | `stride-redis` | 6379 | — | 96M, `allkeys-lru` |
| `whatsapp-worker` | `stride-whatsapp-worker` | 3001 | 3001 | Go WhatsMeow bridge |

`docker compose down -v` **deletes** `postgres-data`, `workspace-data`,
`whatsapp-data`, and `redis-data`. There is no backup job on the free tier — use
`docker compose down` without `-v`.

## 2. Environment

```bash
cp .env.docker.example server/.env
```

Set at minimum: `DATABASE_URL`, `AUTH_SECRET_KEY` (`openssl rand -base64 48`),
`CRON_SECRET` (`openssl rand -hex 32`), `CORS_ORIGINS`, `FRONTEND_URL`,
`REDIS_URL`, `WORKSPACE_STORAGE_PATH`, and the AI provider keys. Full list with
comments in `.env.docker.example`. Never commit `server/.env`.

## 3. GHCR prebuilt images (no local build)

Published on every push to `main` by `.github/workflows/docker-ghcr.yml` (full
stack) and `.github/workflows/docker-backend.yml` (backend-only):

- `ghcr.io/susin-d/dashboard-server:latest`, `-website`, `-whatsapp-worker`
- `ghcr.io/susin-d/dashboard-backend:latest` — backend-only image
- Tags: `latest`, `main`, `main-<sha>`, `v*.*.*`

```bash
# login once (PAT classic with read:packages)
echo $GITHUB_TOKEN | docker login ghcr.io -u susin-d --password-stdin

# full stack
docker compose -f docker-compose.yml -f docker-compose.ghcr.yml pull
docker compose -f docker-compose.yml -f docker-compose.ghcr.yml up -d

# backend only (VM serving a Vercel frontend)
docker compose -f docker-compose.yml -f docker-compose.backend.yml -f docker-compose.ghcr.backend.yml pull
docker compose -f docker-compose.yml -f docker-compose.backend.yml -f docker-compose.ghcr.backend.yml up -d
```

Pin a build with `TAG=main-abc1234 … up -d`. Images are `linux/amd64`, built with
`VITE_API_URL=/api/v1` for the website container.

## 4. Local / full-stack Docker

```bash
docker compose up --build -d
docker compose ps
```

- Web app: `http://localhost` (nginx) or `http://localhost:3000` (website container directly)
- API docs: `http://localhost/docs`
- Health through the proxy: `curl -i http://localhost/health` → `{"status":"ok"}`

## 5. GCP e2-micro VM (backend-only) — one-time setup

```bash
# create the VM (Debian 12, 30GB, http/https allowed)
gcloud compute instances create stride-api \
  --machine-type=e2-micro --zone=us-central1-a --image-family=debian-12 --image-project=debian-cloud \
  --tags=http-server,https-server --boot-disk-size=30GB
gcloud compute firewall-rules create allow-stride --allow tcp:80,tcp:443 --target-tags=http-server,https-server || true
gcloud compute ssh stride-api --zone=us-central1-a
```

On the VM:

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-plugin git

# 1G swap — the stack (postgres 128M + redis 96M + server 512M + nginx) needs it
sudo fallocate -l 1G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

git clone https://github.com/susin-d/dashboard.git stride && cd stride
cp .env.docker.example server/.env && nano server/.env
```

VM-specific values:

```dotenv
AUTH_SECRET_KEY=<openssl rand -base64 48>
CRON_SECRET=<openssl rand -hex 32>
CORS_ORIGINS=https://stride.susindran.in,https://stride.vercel.app,https://*.vercel.app,http://<VM_EXTERNAL_IP>
FRONTEND_URL=https://stride.susindran.in   # canonical; vercel.app 308s here
DATABASE_URL=postgresql+asyncpg://stride:stride_password@postgres:5432/stride
```

Then bring up the backend-only stack:

```bash
docker compose -f docker-compose.yml -f docker-compose.backend.yml -f docker-compose.ghcr.backend.yml up -d
curl -i http://localhost/health
curl -i http://localhost:8000/api/v1/health
```

`nginx/conf.d/default.backend.conf` serves `/health`, `/api/*`, `/ws/*`, `/docs`
from `server:8000` and answers `GET /` with a `302` to the canonical frontend.

### TLS

```bash
mkdir -p certbot/www certbot/certs
docker compose -f docker-compose.yml -f docker-compose.backend.yml -f docker-compose.ghcr.backend.yml up -d nginx
EMAIL=you@susindran.in ./scripts/init-letsencrypt.sh
./scripts/enable-https.sh
docker compose -f docker-compose.yml -f docker-compose.backend.yml -f docker-compose.ghcr.backend.yml up -d --force-recreate nginx
curl -i https://api.stride.susindran.in/health
```

DNS: add an **A** record `api.stride.susindran.in → <VM_EXTERNAL_IP>` (TTL 60) and
verify with `nslookup` before issuing certificates.

## 6. Vercel frontend

Vercel → Settings → Environment Variables: `VITE_API_URL=https://api.stride.susindran.in/api/v1`
(use `http://<VM_EXTERNAL_IP>/api/v1` while testing).

Vercel → Settings → Domains: add `stride.susindran.in` as **Primary**; TLS is
automatic. `stride.vercel.app` stays for preview deploys but is 308-redirected at
the edge (`vercel.json` `redirects`). `vercel.json` also rewrites SPA routes to
`/index.html`; there is no API proxy — the frontend calls the VM directly. Pushes
to `main` deploy `website/` automatically.

Local dev keeps `VITE_API_URL=http://127.0.0.1:8000/api/v1` in `website/.env`.

## 7. Updating a running VM

```bash
cd ~/stride && git pull
echo $GITHUB_TOKEN | docker login ghcr.io -u susin-d --password-stdin
docker compose -f docker-compose.yml -f docker-compose.backend.yml -f docker-compose.ghcr.backend.yml pull
docker compose -f docker-compose.yml -f docker-compose.backend.yml -f docker-compose.ghcr.backend.yml up -d
```

Or dispatch the **Backend — Build and Push to GHCR** workflow and let the VM pull.

## 8. Useful commands

| Action | Command |
|---|---|
| All logs / one service | `docker compose logs -f [server\|website\|nginx]` |
| Restart / stop | `docker compose restart` · `docker compose down` |
| Resource check | `docker stats --no-stream` + `free -h` + `df -h` |
| Backend tests in the image | `docker compose exec server python -m pytest tests -q` |
| Rebuild one image | `docker compose build --no-cache server` |

## 9. Security posture

- The FastAPI process runs as low-privilege `appuser` (UID 10001) in the container.
- nginx applies Gzip, security headers (`X-Frame-Options`,
  `X-Content-Type-Options`, `Referrer-Policy`), a 20MB body cap, and rate limiting.
- Production requires a strong `AUTH_SECRET_KEY`, `CRON_SECRET`, and (for the
  worker webhook) `WHATSAPP_WORKER_SECRET` — see `SECURITY.md`.

## 10. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `AUTH_SECRET_KEY must be strong` | Generate with `openssl rand -base64 48` into `server/.env` |
| CORS 403 from a Vercel preview | Add `https://<preview>--*.vercel.app` to `CORS_ORIGINS` |
| `502` on `/` | Expected on backend-only deployments (redirects to the frontend); check `/api/v1/health` |
| `502` on `/api` | `docker logs stride-server`; usually a `DATABASE_URL` typo |
| GHCR `denied` | Re-run `docker login ghcr.io`; make the package Public in package settings |
| OOM on e2-micro | `docker stats --no-stream`, `free -h`, then `docker system prune` |
