#!/bin/bash
set -e

echo "Connecting to Neon PostgreSQL database..."

echo "Running Alembic database migrations..."
alembic upgrade head

echo "Seeding demo data..."
python -m app.utils.seed

echo "Starting STRIDE FastAPI server on port 8000..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
