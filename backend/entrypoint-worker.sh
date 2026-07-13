#!/bin/sh
set -e
export PYTHONPATH=/app
cd /app
exec celery -A app.celery_app worker --loglevel=info
