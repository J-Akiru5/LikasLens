# Phase 2: Core Data Flow - Setup & Troubleshooting

## Overview
Phase 2 connects the Next.js frontend report form to the Laravel backend API at `POST /api/reports`.

## Environment Setup

### Frontend (`apps/frontend`)
Create or update `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_LARAVEL_API_URL=http://localhost:8000
```

### Backend (`apps/backend`)
Ensure `.env` has:

```bash
APP_URL=http://localhost:8000
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

The CORS configuration in `config/cors.php` already allows `localhost:3000` and port patterns.

## Testing the Flow

### Start Services
**Terminal 1 - Frontend:**
```bash
cd apps/frontend
pnpm dev
```

**Terminal 2 - Backend:**
```bash
cd apps/backend
php artisan serve
```

### Manual Test (Via UI)
1. Open http://localhost:3000/report
2. Click "✓ Test Data" to populate form with mock image + GPS coords
3. Click "🚀 Submit Report"
4. Check browser console and toast for success/error

### Debug Checklist

**If you see CORS error:**
- Verify backend is running on `http://localhost:8000`
- Check `apps/backend/config/cors.php` includes `localhost:3000`
- Inspect browser console for exact CORS rejection message
- Ensure `Content-Type: application/json` is set (code already does this)

**If endpoint not found (404):**
- Verify Laravel routes: `php artisan route:list | grep reports`
- Should show: `POST api/reports` → `ReportController@store`

**If 422 Validation Error:**
- Backend expects exactly: `base64Image`, `latitude`, `longitude`
- Check the payload being sent in browser DevTools Network tab

**If timeout/hanging:**
- Check if backend is actually running
- Look for PHP errors in `storage/logs/laravel.log`

## Code References

- **Frontend Form:** `apps/frontend/src/app/report/page.tsx`
- **Backend Route:** `apps/backend/routes/api.php` (line 27)
- **Backend Handler:** `apps/backend/app/Http/Controllers/ReportController.php`

## What's Next (Phase 3)
- Fetch real scoreboard data from Laravel GET endpoint
- Implement Ghost Mode toggle for privacy
- Strip EXIF before sending image to backend
