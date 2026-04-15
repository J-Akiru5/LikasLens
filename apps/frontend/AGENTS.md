# Frontend Agent Instructions

Scope: `apps/frontend` only.

## Stack
- Next.js App Router with TypeScript
- Tailwind CSS
- Supabase client/server helpers in `src/utils/supabase`

## Commands
- Install workspace deps from repo root: `pnpm install`
- Run frontend dev server from repo root: `pnpm --filter frontend dev`
- Build frontend: `pnpm --filter frontend build`
- Lint frontend: `pnpm --filter frontend lint`

## Conventions
- Keep pages under `src/app` and split reusable UI into components.
- Preserve the LikasLens design constitution in `.github/instructions/design para pretty.instructions.md`.
- Keep monorepo boundaries from root `AGENTS.md`: no cross-app dependency mixing.
- For image upload flows, include EXIF stripping before transmission.

## Link First
- Global rules: `../../AGENTS.md`
- Workspace Copilot rules: `../../.github/copilot-instructions.md`
- Frontend design constitution: `../../.github/instructions/design para pretty.instructions.md`
