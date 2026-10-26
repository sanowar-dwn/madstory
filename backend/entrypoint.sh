#!/bin/sh
set -e

# ==========================================
# The Mad Story - Backend Entrypoint Script
# ==========================================

echo "==> Starting The Mad Story Backend Container..."

# If DATABASE_URL is set and points to Postgres, wait for database
if [ -n "$DATABASE_URL" ]; then
  echo "==> Checking database connection..."
  python -c "
import sys, time, dj_database_url
import psycopg2
db_config = dj_database_url.parse('$DATABASE_URL')
if db_config.get('ENGINE') == 'django.db.backends.postgresql':
    max_tries = 30
    for i in range(max_tries):
        try:
            conn = psycopg2.connect(
                dbname=db_config['NAME'],
                user=db_config['USER'],
                password=db_config['PASSWORD'],
                host=db_config['HOST'],
                port=db_config.get('PORT', 5432)
            )
            conn.close()
            print('==> PostgreSQL is ready!')
            break
        except Exception as e:
            print(f'==> Waiting for PostgreSQL ({i+1}/{max_tries})...')
            time.sleep(1)
    else:
        print('==> Could not connect to PostgreSQL database!')
        sys.exit(1)
"
fi

# Run database migrations
echo "==> Applying database migrations..."
python manage.py migrate --noinput

# Collect static files for WhiteNoise/Nginx
echo "==> Collecting static assets..."
python manage.py collectstatic --noinput

echo "==> Backend ready. Launching application server..."
exec "$@"
