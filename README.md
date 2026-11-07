# STRIDE — Plan Better. Move Forward.

A premium, full-stack productivity application built with React + FastAPI + PostgreSQL.

## ✨ Features

- **Task Management** — Create, organize, and complete daily tasks with priorities, subtasks, and due dates
- **Project Management** — Group tasks into projects with progress tracking
- **Goal Tracking** — Set and monitor personal goals with circular progress indicators
- **Habit Building** — Track daily habits with streaks and monthly completion views
- **Focus Timer** — Backend-anchored Pomodoro/Deep Work timer (tab-sleep safe)
- **Calendar** — Monthly calendar with task scheduling
- **Weekly Review** — Productivity charts and summaries
- **Dashboard Analytics** — Real-time stats calculated from PostgreSQL

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| State | Zustand, TanStack Query |
| Backend | FastAPI, Python 3.12+, Pydantic v2 |
| Database | Neon Serverless PostgreSQL, SQLAlchemy 2.0, Alembic |
| Auth | JWT (access + refresh tokens) |
| Infrastructure | Docker, Docker Compose |

## 🚀 Quick Start

### Prerequisites
- Docker Desktop
- Docker Compose v2+

### 1. Clone and configure

```bash
git clone <repo-url>
cd stride
cp .env.example .env
# Edit .env to set a strong SECRET_KEY in production
```

### 2. Start all services

```bash
docker compose up --build
```

This will:
- Start PostgreSQL and Redis
- Run Alembic database migrations automatically
- Seed demo data (demo@stride.app / password123)
- Start the FastAPI backend on port 8000
- Start the React frontend on port 5173

### 3. Open the app

| Service | URL |
|---|---|
| **App** | http://localhost:5173 |
| **API Docs** | http://localhost:8000/docs |
| **API ReDoc** | http://localhost:8000/redoc |

### 4. Demo credentials

```
Email:    demo@stride.app
Password: password123
```

## 🏗 Development (without Docker)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set up PostgreSQL and Redis locally, then:
cp ../.env.example ../.env  # configure POSTGRES_HOST=localhost etc.
alembic upgrade head
python -m app.utils.seed  # seed demo data
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 📁 Project Structure

```
stride/
├── frontend/           # React + Vite + TypeScript
├── backend/            # FastAPI + SQLAlchemy
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🔒 Security Notes

- Passwords hashed with Argon2
- JWT access tokens expire in 15 minutes
- Refresh tokens stored hashed in DB, sent as HttpOnly cookies
- All endpoints enforce user-level authorization
- SQL injection protected via SQLAlchemy ORM

## 📊 API Documentation

FastAPI generates interactive docs automatically:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json
