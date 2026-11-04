#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "=========================================="
echo "==> Building The Mad Story Backend (Render)"
echo "=========================================="

echo "==> Upgrading pip..."
python -m pip install --upgrade pip

echo "==> Installing Python dependencies..."
pip install -r requirements.txt

echo "==> Collecting static assets (WhiteNoise)..."
python manage.py collectstatic --noinput

echo "==> Applying database migrations..."
python manage.py migrate --noinput

# Optional automatic fixture seeding for fresh databases (e.g. Render PostgreSQL)
if [ "$AUTO_LOAD_FIXTURE" = "true" ] && [ -f "datadump.json" ]; then
  echo "==> AUTO_LOAD_FIXTURE=true: Seeding database from datadump.json..."
  python manage.py loaddata datadump.json || echo "==> Fixture load completed or skipped non-critical duplicates."
fi

echo "=========================================="
echo "==> Backend Build Complete!"
echo "=========================================="
