#!/bin/sh
set -e
export PYTHONPATH=/app
cd /app
alembic upgrade head
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
