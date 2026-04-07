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