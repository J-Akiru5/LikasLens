# 🌍 LIKASLENS MONOREPO - GLOBAL CONSTITUTION

## 1. THE ARCHITECTURAL BOUNDARIES
You are operating within a `pnpm` monorepo with three strictly isolated environments. **NEVER** suggest mixing dependencies or syntax across these boundaries:
* `apps/frontend`: Next.js 14+ (App Router), TypeScript, Tailwind. (Client & PWA Logic ONLY)
* `apps/backend`: Laravel 12, PHP. (Core API, Session Management, Relational DB ONLY)
* `apps/ai-service`: Python 3.12, FastAPI. (Neuro-Symbolic Logic, YOLOv8, Gremlin DB ONLY)

## 2. THE CONTRACT LAW (OPENAPI)
* The **ONLY** acceptable method of communication between `frontend`, `backend`, and `ai-service` is via standard REST JSON payloads defined by the project's OpenAPI specifications.
* Do not create custom ad-hoc endpoints without first proposing the OpenAPI schema update.

## 3. ZERO-KNOWLEDGE & GHOST MODE PROTOCOLS
* **Security First:** Any task involving `apps/frontend` image uploads MUST explicitly mention EXIF stripping logic before transmission.
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
* Backend tests: `cd apps/backend && php artisan test`
* Backend formatting/linting: `cd apps/backend && ./vendor/bin/pint`
* AI service run: `cd apps/ai-service && python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001`

## 6. PROJECT NAVIGATION
* Primary onboarding and env setup: `README.md`
* Frontend guidance can be overridden by nearest `AGENTS.md` in `apps/frontend`.
* Keep instructions minimal in this file; link to docs instead of duplicating large guidance blocks.

## 7. TASK EXECUTION CONVENTIONS
* Respect service boundaries first, then implement changes in the owning app.
* For any cross-service payload change, propose and align OpenAPI contract updates before implementation.
* For frontend image upload flows, explicitly include EXIF stripping before transmission.