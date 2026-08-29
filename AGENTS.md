# 🌍 LIKASLENS MONOREPO - GLOBAL CONSTITUTION

## 1. THE ARCHITECTURAL BOUNDARIES
You are operating within a `pnpm` monorepo with four strictly isolated environments. **NEVER** suggest mixing dependencies or syntax across these boundaries:
* `apps/frontend`: Next.js 16 (App Router), TypeScript, Tailwind. (Public marketing website + full web app)
* `apps/mobile-pwa`: Next.js 16 (App Router), TypeScript, Tailwind. (Installable mobile PWA with native feel)
* `apps/admin-portal`: Next.js 16 (App Router), TypeScript, Tailwind. (Desktop admin dashboard)
* `apps/shared`: React components, API client, TypeScript types, CSS design tokens. (Shared across all Next.js apps)
* `apps/ai-service`: Python 3.12, FastAPI. (Unified API + AI service: auth, reports, tickets, AI inference, Neo4j routing)

## 2. THE CONTRACT LAW (OPENAPI)
* The **ONLY** acceptable method of communication between `frontend`, `mobile-pwa`, `admin-portal`, and `ai-service` is via standard REST JSON payloads defined by the project's OpenAPI specifications.
* Do not create custom ad-hoc endpoints without first proposing the OpenAPI schema update.

## 3. ZERO-KNOWLEDGE & GHOST MODE PROTOCOLS
* **Security First:** Any task involving `apps/frontend` or `apps/mobile-pwa` image uploads MUST explicitly mention EXIF stripping logic before transmission.
* Raw evidentiary photos are sacred. Never propose image compression algorithms that destroy forensic metadata unless specifically explicitly requested for non-evidentiary display thumbnails.

## 4. PACKAGE MANAGEMENT
* This is a `pnpm` workspace. NEVER suggest `npm install` or `yarn add`.
* Use `pnpm --filter <app-name> add <package>` for localized dependencies.

## 5. BUILD, RUN, AND TEST BASELINE
Use these defaults unless a task requires app-specific alternatives:
* Install workspace dependencies: `pnpm install`
* Start all services: `pnpm dev`
* Frontend only: `pnpm --filter frontend dev`
* Frontend build: `pnpm --filter frontend build`
* Frontend lint: `pnpm --filter frontend lint`
* Mobile PWA only: `pnpm --filter mobile-pwa dev`
* Mobile PWA build: `pnpm --filter mobile-pwa build`
* Admin Portal only: `pnpm --filter admin-portal dev`
* Admin Portal build: `pnpm --filter admin-portal build`
* AI service run: `cd apps/ai-service && python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001`
* AI service tests: `cd apps/ai-service && python -m pytest tests/`

## 6. PROJECT NAVIGATION
* Primary onboarding and env setup: `README.md`
* Frontend guidance can be overridden by nearest `AGENTS.md` in `apps/frontend`.
* Keep instructions minimal in this file; link to docs instead of duplicating large guidance blocks.

## 7. TASK EXECUTION CONVENTIONS
* Respect service boundaries first, then implement changes in the owning app.
* For any cross-service payload change, propose and align OpenAPI contract updates before implementation.
* For frontend or mobile-pwa image upload flows, explicitly include EXIF stripping before transmission.