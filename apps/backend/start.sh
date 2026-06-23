#!/usr/bin/env bash

cd /app

echo "==> [start.sh] Container started at $(date)"
echo "==> [start.sh] APP_ENV=${APP_ENV:-unset}"
echo "==> [start.sh] APP_DEBUG=${APP_DEBUG:-unset}"
echo "==> [start.sh] DB_CONNECTION=${DB_CONNECTION:-unset}"
echo "==> [start.sh] DB_HOST=${DB_HOST:-unset}"

# Clear any stale build-time cached config
echo "==> [start.sh] Clearing cached config..."
php artisan config:clear 2>&1 || true
php artisan route:clear 2>&1 || true
php artisan view:clear 2>&1 || true

# Cache fresh config from environment variables
echo "==> [start.sh] Caching fresh config..."
if ! php artisan config:cache 2>&1; then
    echo "==> [start.sh] ERROR: config:cache failed. Dumping .env status..."
    php artisan env 2>&1 || true
    exit 1
fi

# Cache routes and views
php artisan route:cache 2>&1 || echo "==> [start.sh] WARNING: route:cache failed (non-fatal)"
php artisan view:cache 2>&1 || echo "==> [start.sh] WARNING: view:cache failed (non-fatal)"

# Run migrations
echo "==> [start.sh] Running migrations..."
php artisan migrate --force 2>&1 || echo "==> [start.sh] WARNING: migrate failed (non-fatal)"

# Start queue worker in background
echo "==> [start.sh] Starting queue worker..."
php artisan queue:work --sleep=3 --tries=3 --max-time=3600 &

# Start the server
echo "==> [start.sh] Starting Laravel server on port 8000..."
exec php artisan serve --host=0.0.0.0 --port=8000
