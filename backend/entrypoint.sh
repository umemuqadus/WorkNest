#!/bin/sh
set -e

echo "==> Waiting for the database..."
python - <<'PY'
import time
import sys

from sqlalchemy import create_engine, text

from app.core.config import settings

for attempt in range(60):
    try:
        engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("    database is reachable")
        sys.exit(0)
    except Exception as exc:  # noqa: BLE001
        print(f"    not ready ({attempt + 1}/60): {exc.__class__.__name__}")
        time.sleep(1)

print("    gave up waiting for the database")
sys.exit(1)
PY

echo "==> Applying migrations..."
alembic upgrade head

if [ "$SEED_DB" = "true" ]; then
  echo "==> Seeding demo data..."
  python -m app.db.seed || echo "    seeding skipped/failed (continuing)"
fi

echo "==> Starting the API..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
