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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
