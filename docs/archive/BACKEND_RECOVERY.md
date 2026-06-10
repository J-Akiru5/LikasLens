# Backend Laravel Recovery Guide

## Current Status
❌ **Backend is not running** - Missing vendor dependencies and APP_KEY

## Root Causes Identified
1. **No vendor directory** - Composer install never completed, or was deleted
2. **Missing APP_KEY** - .env file has empty APP_KEY value
3. **Composer issues** - System Composer command may be non-functional (per SYSTEM_STATUS.md)

## Quick Fix (Try This First)

Run these commands in your terminal:

### Step 1: Navigate to Backend
```bash
cd apps/backend
```

### Step 2: Install Dependencies
```bash
composer install --no-interaction --prefer-dist
```

If that fails, try:
```bash
composer install --no-dev
```

Or use Composer from Docker if available locally:
```bash
docker run --rm -v %cd%:/app composer install --no-interaction --prefer-dist
```

### Step 3: Generate APP_KEY
```bash
php artisan key:generate
```

### Step 4: Start the Server
```bash
php artisan serve --host=127.0.0.1 --port=8000
```

---

## If Composer is Broken (Workaround)

If `composer install` keeps failing, try these alternatives:

### Option A: Reinstall Composer Globally
```bash
# Windows (from PowerShell as Admin):
curl -sS https://getcomposer.org/installer | php -- --install-dir=C:\PHP --filename=composer.exe

# Then verify:
composer --version
```

### Option B: Use PHP Directly to Bootstrap
```bash
# If vendor is still missing, manually create a basic autoloader:
php artisan package:discover --ansi
```

### Option C: Docker Approach (If you have Docker)
```bash
docker-compose up -d  # If you have a docker-compose.yml
```

---

## Manual APP_KEY Fix (If Key Generation Fails)

Edit `apps/backend/.env` and replace the APP_KEY line with:

```
APP_KEY=base64:YOUR_RANDOM_32_CHAR_STRING_HERE
```

Or generate one manually:
```bash
php -r "echo 'base64:' . base64_encode(random_bytes(32));"
```

---

## Verification Checklist

✅ Verify each step:

```bash
# Check if vendor/autoload.php exists
ls apps/backend/vendor/autoload.php

# Check if APP_KEY is set
grep APP_KEY apps/backend/.env

# Try to start backend
cd apps/backend
php artisan serve --host=127.0.0.1 --port=8000
```

If all succeeds, the backend should be running at **http://localhost:8000**

---

## Full Monorepo Startup

Once backend is fixed:

```bash
# From project root
pnpm dev
```

This will start:
- Frontend: http://localhost:3001
- Backend: http://localhost:8000  
- AI Service: http://127.0.0.1:8001

---

## If Still Broken

Check the following:
1. PHP version: `php --version` (should be 8.2+)
2. Extensions: `php -m` (should include json, pdo_pgsql, phar)
3. Composer: `composer --version` (should output version, not help text)
4. Database: Can you connect to Supabase at db.sfklmmtimelotqvrldni.supabase.co:5432?

If any of these are missing or broken, that's the blocker.
