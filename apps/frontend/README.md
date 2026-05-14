# Frontend (LikasLens)

Next.js App Router frontend for the LikasLens civic reporting platform.

## Run

From repository root:

```bash
pnpm install
pnpm --filter frontend dev
```

Frontend local URL: `http://localhost:3000`

## Build and Lint

From repository root:

```bash
pnpm --filter frontend build
pnpm --filter frontend lint
```

## Environment

Required values in `apps/frontend/.env`:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_AI_SERVICE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Structure

- `src/app`: App Router pages and layouts
- `src/components`: reusable UI sections and widgets
- `src/utils/supabase`: client/server Supabase utilities

## Rules

- Follow monorepo boundaries from root `AGENTS.md`.
- Follow visual and Ghost Mode rules from `.github/instructions/design para pretty.instructions.md`.
- For image upload flows, strip EXIF metadata before transmission.
