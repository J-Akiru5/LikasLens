#!/usr/bin/env bash
set -e

cd /app

echo "==> Clearing cached config (forcing reload from env)..."
php artisan config:clear
php artisan route:clear
php artisan view:clear

echo "==> Caching fresh config for performance..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "==> Running migrations..."
php artisan migrate --force --isolated

echo "==> Starting Laravel server..."
exec php artisan serve --host=0.0.0.0 --port=8000
