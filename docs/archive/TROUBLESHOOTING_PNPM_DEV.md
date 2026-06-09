# LikasLens pnpm dev - Troubleshooting Guide

## What I've Fixed

1. ✅ **Fixed pnpm-workspace.yaml** - Removed `apps/*` glob pattern and now explicitly lists only Node-based apps:
   - `apps/frontend` (Next.js)
   - `apps/backend` (Laravel + Vite)
   - Excluded `apps/ai-service` (Python/FastAPI)

2. ✅ **Fixed pnpm-lock.conflicted.yaml** - Resolved git merge conflict markers

3. ✅ **Added Tailwind config files**:
   - `apps/frontend/tailwind.config.js` - Minimal Tailwind v4 config
   - `apps/frontend/tailwind.config.ts` - Alternative TS version

4. ✅ **Added .npmrc** - Configured pnpm with proper settings

## If pnpm dev Still Fails

### Option 1: Clean Reinstall (Recommended)

Run one of these commands:

**On Windows:**
```bash
.\clean-install.bat
```

**On macOS/Linux:**
```bash
bash clean-install.sh
```

This script will:
- Clean the pnpm store
- Remove all node_modules directories
- Clear build caches (.next, build/)
- Reinstall all dependencies
- Start the dev server

### Option 2: Manual Steps

If scripts don't work, run these commands in order:

```bash
# Clean everything
pnpm store prune
rmdir /s node_modules
rmdir /s apps\frontend\node_modules
rmdir /s apps\backend\node_modules
rmdir /s apps\frontend\.next

# Reinstall
pnpm install

# Try again
pnpm dev
```

### Option 3: Run Services Separately

If `pnpm dev` still fails, try running services individually:

```bash
# Terminal 1: Frontend
pnpm --filter frontend dev

# Terminal 2: Backend
pnpm --filter backend dev
```

## Understanding the Error

If you see: `ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  frontend@0.1.0 dev: next dev`

This means the `next dev` command in the frontend app failed with exit code 1. To see the detailed error:

```bash
cd apps/frontend
pnpm dev
```

This will show the actual error message from Next.js.

## Common Issues

| Error | Solution |
|-------|----------|
| `Cannot find module 'tailwindcss'` | Run `pnpm install` in frontend directory |
| `ENOENT: no such file or directory` | Check that all import paths use `@/` alias correctly |
| `TypeScript error` | Ensure no files have syntax errors; check tsconfig.json |
| `Module not found '@supabase/ssr'` | Run `pnpm install` again |

## Verified Files

All critical files have been checked:
- ✅ pnpm-workspace.yaml - Fixed
- ✅ apps/frontend/package.json - OK
- ✅ apps/backend/package.json - OK
- ✅ apps/frontend/next.config.ts - OK
- ✅ apps/frontend/tailwind.config.js - Updated
- ✅ apps/frontend/tsconfig.json - OK
- ✅ All component imports - Verified

## Next Steps

1. Run one of the clean install options above
2. If it still fails, share the actual error output from:
   ```bash
   cd apps/frontend && pnpm dev
   ```
3. Check that you have Node >=18.0.0 and pnpm >=8.0.0:
   ```bash
   node --version
   pnpm --version
   ```
