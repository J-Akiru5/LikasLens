# 🔍 LikasLens — Project Status Report & Work Breakdown

**Generated:** May 15, 2026  
**Last Updated:** May 16, 2026 — 10:30 PHT  
**Branch:** `jeff-ProjectLead` → merged into `development` → merged into `main` ✅  
**Architecture:** Next.js (Frontend) → Laravel (Backend) → FastAPI (AI Service) → Supabase (DB) + Cosmos Gremlin (Graph)

---

## 🔀 Branch Synchronization Status

| Branch | Latest Commit | Synced With |
|--------|--------------|-------------|
| `main` | `1995fdc` | ✅ Up to date — fast-forwarded from `development` (contains all merged branches) |
| `development` | `1995fdc` | ✅ Up to date — merged `jeff-ProjectLead` (GeoTagMap, Dashboard API, Auth, etc.) |
| `jeff-ProjectLead` | `4e14371` | ✅ Synced — content merged into `development` → `main` |
| `ui-experiment` | `813223b` | ✅ **MERGED** — Integrated AI Triage, Modal, PDF Export & enhanced animations |
| `charlyn-FE3` | `b8c1f33` | ✅ Merged via PR #49 + PR #55 into `development` |
| `katherine-FE1` | `c66b021` | ⚠️ Behind — needs rebase onto `development` |
| `roseby-FE2` | `da65ab0` | ⚠️ Behind — needs rebase onto `development` |

> [!IMPORTANT]
> `katherine-FE1` and `roseby-FE2` are significantly behind. Before either dev pushes new work, they must rebase onto `development` to avoid large merge conflicts.

---

## 🔴 ACTIVE BUG — Laravel Database Connection Failure

> [!CAUTION]
> **`php artisan migrate:status` fails** with:
> ```
> SQLSTATE[08006] [7] could not translate host name
> "db.sfklmmtimelotqvrldni.supabase.co" to address: Unknown host
> ```
> **Root Cause:** The Supabase project (`sfklmmtimelotqvrldni`) is either **paused**, **deleted**, or the hostname has changed. DNS cannot resolve the host.
>
> **Fix Options:**
> 1. Log into [Supabase Dashboard](https://supabase.com/dashboard) → verify project status → if paused, **resume** it.
> 2. If the project was recreated, copy the new `DB_HOST` from **Settings → Database** and update `apps/backend/.env`.
> 3. For local-only development, switch to SQLite: set `DB_CONNECTION=sqlite` and `DB_DATABASE=database/database.sqlite`.

**Impact:** All database-dependent operations fail (migrations, seeders, report submission, leaderboard). The `php artisan serve` command succeeds but any request touching the database will 500.

---

## 📊 Sprint Progress Overview

| Sprint | Phase | Progress | Status |
|--------|-------|----------|--------|
| Sprint 1 | Foundation & Boilerplate | █████████░ | **~90% Done** — blocked by Supabase runtime verification |
| Sprint 2 | Core Data Flow | █████████░ | **~85% Done** — camera integration + toast polish remaining |
| Sprint 3 | The "Brain" & Ghost Mode | █████████░ | **~85% Done** — Edge Interceptor wiring + profile data |
| Sprint 4 | PWA, Polishing & Demo Prep | █████░░░░░ | **~50% Done** — deployment + branch rebases + polish |

---

## 🔐 RBAC (Role-Based Access Control) — Audit Results

### Current State: **PARTIAL — Schema exists, enforcement is minimal**

The `users` table has a `role` column (default: `'citizen'`). One policy exists (`TicketAssignmentPolicy`). But **no middleware enforces role checks on API routes**, and the frontend has **no role-aware UI gating**.

### Role Definitions (from Migration + Policy + ReportController)

| Role | Source | Description |
|------|--------|-------------|
| `citizen` | Migration default | Standard user — files reports, earns eco-credits |
| `ghost` | `ReportController::ensureGhostUser()` | System-generated for anonymous submissions |
| `analyst` | `TicketAssignmentPolicy` | Can view, create, and update ticket assignments |
| `super_admin` | `TicketAssignmentPolicy` | Full access including deletion of ticket assignments |

### RBAC Access Matrix (Based on Roadmap + Codebase Evidence)

| Feature / Action | `citizen` | `ghost` | `analyst` | `super_admin` | Enforcement Status |
|-----------------|-----------|---------|-----------|---------------|-------------------|
| **Submit Report** (`POST /api/reports`) | ✅ | ✅ (auto) | ✅ | ✅ | 🟢 Open route — no auth required (by design for civic access) |
| **Triage Report** (`POST /api/reports/triage`) | ✅ | ✅ | ✅ | ✅ | 🟢 Open route |
| **View Leaderboard** (`GET /api/leaderboard`) | ✅ | ✅ | ✅ | ✅ | 🟢 Open route |
| **View Own Profile** (`GET /api/user`) | ✅ | ❌ | ✅ | ✅ | 🟡 `auth:sanctum` middleware — but no role check |
| **View Ticket Assignments** | ❌ | ❌ | ✅ | ✅ | 🟡 Policy exists but **not applied to any route/controller** |
| **Create Ticket Assignment** | ❌ | ❌ | ✅ | ✅ | 🟡 Policy exists but **no controller method** |
| **Update Ticket Assignment** | ❌ | ❌ | ✅ | ✅ | 🟡 Policy exists but **no controller method** |
| **Delete Ticket Assignment** | ❌ | ❌ | ❌ | ✅ | 🟡 Policy exists but **no controller method** |
| **Manage Rewards Catalog** | ❌ | ❌ | ❌ | ✅ | 🔴 **No policy, no controller, no route** |
| **Redeem Rewards** | ✅ | ❌ | ✅ | ✅ | 🔴 **No controller, no route** |
| **View Audit Logs** | ❌ | ❌ | ❌ | ✅ | 🔴 **No controller, no route** |
| **Manage NGO Groups** | ❌ | ❌ | ✅ | ✅ | 🔴 **No controller, no route** |
| **Manage Environmental Laws** | ❌ | ❌ | ❌ | ✅ | 🔴 **No controller, no route** |
| **Access Dashboard** (Frontend) | ✅ | ❌ | ✅ | ✅ | 🟡 Supabase auth check only — **no role check** |
| **Access Report Page** (Frontend) | ✅ | ✅ | ✅ | ✅ | 🟡 Auth-gated but Ghost Mode bypasses |

### RBAC Gaps Identified

| # | Gap | Severity | Action Required |
|---|-----|----------|----------------|
| R1 | **No role-checking middleware** — all API routes are either fully open or only check `auth:sanctum` (no role differentiation) | 🔴 HIGH | Create `EnsureRole` middleware and apply to protected routes |
| R2 | **`TicketAssignmentPolicy` is orphaned** — defined but never referenced by any controller or route | 🟡 MEDIUM | Create `TicketAssignmentController` with policy authorization |
| R3 | **No admin controllers** — Rewards, NGOs, Laws, Audit Logs have models but zero CRUD endpoints | 🟡 MEDIUM | Create admin API resource controllers gated by `super_admin` role |
| R4 | **Frontend has no role-aware rendering** — sidebar shows the same items for all users | 🟡 MEDIUM | Fetch user role from API, conditionally render admin nav items |
| R5 | **No `ngo_staff` role defined** — the roadmap mentions "allow Analysts to directly assign NGOs" but there's no NGO operator role | 🟢 LOW | Add `ngo_staff` role to the schema if needed for NGO-side workflows |
| R6 | **Ghost user has a password** — `ensureGhostUser()` creates a user with a random bcrypt password, which is unnecessary | 🟢 LOW | Consider using a nullable password or a separate ghost flag |

---

## 📌 Features Not in the Original Plan (Unplanned Additions)

These features were built outside the scope of the original `ai-roadmap.md` sprint plan — originating from `jeff-ProjectLead`, `ui-experiment`, or pre-existing development work.

### Frontend — Unplanned

| Feature | Files | Origin | Notes |
|---------|-------|--------|-------|
| **Full Analytics Dashboard** (5 pages) | `dashboard/` pages + `stats-cards`, `activity-feed`, `quick-actions` components | `jeff-ProjectLead` | Roadmap only described a static landing page; this is a full command center with KPI cards, live feed, and incident management |
| **GeoTagMap (Leaflet)** | `components/maps/geo-tag-map.tsx` | `jeff-ProjectLead` | Interactive map with draggable marker, Philippines-centered — beyond the "lat/long capture" in the roadmap |
| **PDF Export System** | `hooks/usePdfExport.ts`, `utils/pdf-export.ts`, `lib/pdf-export-*`, 2 dashboard export components | `ui-experiment` | 7 source files + 4 documentation files — entirely unplanned |
| **Profile Avatar Upload** | `components/profile/avatar-upload.tsx`, `utils/supabase/storage.ts` | `jeff-ProjectLead` | File validation, Supabase Storage upload — not in roadmap |
| **Laravel API Client** | `utils/laravel-api.ts` | `jeff-ProjectLead` | Typed fetch wrapper with auto-token injection — roadmap assumed ad-hoc fetch calls |
| **Layout Components** (Sidebar, Header, UserNav) | `components/layout/` | `ui-experiment` | Roadmap only mentioned sidebar as a future RBAC task; full responsive layout built |
| **Supabase Utility Layer** | `utils/supabase/client.ts`, `server.ts`, `config.ts`, `middleware.ts` | pre-existing | Structured multi-file client/server/middleware layer — roadmap only said "connect SDK" |

### Backend — Unplanned

| Feature | Files | Origin | Notes |
|---------|-------|--------|-------|
| **AuthController** (Sanctum) | `Http/Controllers/AuthController.php` | `jeff-ProjectLead` | Full register/login/logout/sync bridging Supabase Auth with Laravel Sanctum tokens — roadmap described Supabase-only auth |
| **DashboardController** | `Http/Controllers/DashboardController.php` | `jeff-ProjectLead` | Stats aggregation + activity feed endpoints — no dashboard API was planned |
| **TicketController** | `Http/Controllers/TicketController.php` | `jeff-ProjectLead` | Paginated listing with search/filter — roadmap only planned `TicketAssignmentController` for analysts |
| **LikasLensSeeder** | `database/seeders/LikasLensSeeder.php` | `jeff-ProjectLead` | Multi-role test data seeder (4 roles, sample tickets/evidence) — not in original plan |

### Infrastructure / Docs — Unplanned

| Feature | Details | Origin |
|---------|---------|--------|
| **PWA Config** | `next-pwa` runtime caching, `manifest.json` with maskable icons, 6 icon variants | pre-existing |
| **Recovery & Fix Documentation** | 12+ markdown files: `BACKEND_RECOVERY.md`, `GIT_MERGE_FIX.md`, `ISSUES_AND_RESOLUTION.md`, etc. | development |
| **GitHub Agents & Skills** | `.github/agents/` (3 agent specs), `.github/skills/` (40+ skill definitions) | development |
| **Utility Scripts** | `fix-backend.bat`, `clean-install.bat`, `clean-install.sh` | development |

---

## ✅ What's Built & Working

### Backend (`apps/backend`) — Laravel 12

| Feature | Files | Status |
|---------|-------|--------|
| Full domain schema (14 tables, UUIDs) | [migration](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/backend/database/migrations/2026_04_11_000100_create_likaslens_domain_tables.php) | ✅ Complete |
| 17 Eloquent Models (incl. Report) | [Models/](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/backend/app/Models) | ✅ Complete |
| `POST /api/reports` — full persistence pipeline | [ReportController](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/backend/app/Http/Controllers/ReportController.php) | ✅ Stores to Supabase Storage, creates Ticket + TicketEvidence + Report, triggers AI triage |
| `POST /api/reports/triage` — pre-submit AI check | [ReportController](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/backend/app/Http/Controllers/ReportController.php) | ✅ Calls TriageService without persisting |
| `GET /api/leaderboard` endpoint | [LeaderboardController](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/backend/app/Http/Controllers/LeaderboardController.php) | ✅ Functional |
| `GET /api/health` endpoint | [api.php](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/backend/routes/api.php) | ✅ Complete |
| Supabase Storage (S3-compatible disk) | [filesystems.php](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/backend/config/filesystems.php) | ✅ `supabase` disk configured with fallback to `local` |
| TriageService — Laravel → AI HTTP client | [TriageService.php](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/backend/app/Services/TriageService.php) | ✅ Calls `/analyze/base64`, stores classifications |
| Ghost Mode user resolution | [ReportController](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/backend/app/Http/Controllers/ReportController.php) | ✅ Auto-creates ghost user for anonymous reports |
| TicketAssignment authorization policy | [TicketAssignmentPolicy](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/backend/app/Policies/TicketAssignmentPolicy.php) | ✅ Defined (not yet enforced) |
| Environmental Law seeder | [EnvironmentalLawSeeder](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/backend/database/seeders/EnvironmentalLawSeeder.php) | ✅ Complete |
| NGO seed data | [NgoSeeder](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/backend/database/seeders/NgoSeeder.php) | ✅ Complete |
| CORS middleware configuration | [bootstrap/app.php](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/backend/bootstrap/app.php) | ✅ Complete |
| ReportSubmissionTest (3 tests) | [ReportSubmissionTest](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/backend/tests/Feature/ReportSubmissionTest.php) | ✅ Complete |
| LeaderboardTest | [LeaderboardTest](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/backend/tests/Feature/LeaderboardTest.php) | ✅ Complete |
| Dockerfile for Azure Container Apps | [Dockerfile](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/backend/Dockerfile) | ✅ PHP 8.2-cli + Composer |
| AWS S3 SDK (for Supabase S3 compat) | [composer.json](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/backend/composer.json) | ✅ Complete |
| AuthController (Sanctum register/login/logout/sync) | [AuthController.php](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/backend/app/Http/Controllers/AuthController.php) | ✅ **NEW** — bridges Supabase Auth with Laravel users |
| DashboardController (stats + activity feed endpoints) | [DashboardController.php](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/backend/app/Http/Controllers/DashboardController.php) | ✅ **NEW** — from `jeff-ProjectLead` |
| TicketController (paginated listing with search/filter) | [TicketController.php](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/backend/app/Http/Controllers/TicketController.php) | ✅ **NEW** — from `jeff-ProjectLead` |
| LikasLensSeeder (multi-role test data) | [LikasLensSeeder.php](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/backend/database/seeders/LikasLensSeeder.php) | ✅ **NEW** — seeds 4 roles + sample tickets/evidence |

### Frontend (`apps/frontend`) — Next.js 14 + Tailwind

| Feature | Files | Status |
|---------|-------|--------|
| Landing page (Hero, Features, Ghost Mode, Scoreboard) | [page.tsx](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/app/page.tsx) | ✅ Polished with Framer Motion |
| Login page (Supabase Auth) | [login/](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/app/login) | ✅ Complete |
| Register page (Supabase Auth) | [register/](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/app/register) | ✅ Complete |
| Auth server actions (signIn / signUp) | [actions/auth.ts](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/app/actions/auth.ts) | ✅ Complete — `FormData` types |
| Dashboard (sidebar, header, stats, activity feed) | [dashboard/](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/app/dashboard) | ✅ Complete (static data) |
| Report form (camera + offline queue + triage) | [report/page.tsx](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/app/report/page.tsx) | ✅ **MORPHED** — `useCamera` hook + AI triage pre-check + `showToast` |
| Profile page (Eco-Credits, badges, stats) | [profile/](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/app/profile) | ✅ Complete (hardcoded data) |
| Scoreboard page | [scoreboard/](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/app/scoreboard) | ✅ Functional — fetches from Laravel |
| Camera test page + useCamera hook | [camera-test/](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/app/camera-test) | ✅ Complete |
| EXIF stripper utility | [exifStripper.ts](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/utils/exifStripper.ts) | ✅ Complete |
| Edge Interceptor Modal | [edge-interceptor-modal.tsx](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/components/modals/edge-interceptor-modal.tsx) | ✅ Complete — now triggered by triage |
| Toast component (animated) | [toast.tsx](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/components/ui/toast.tsx) | ✅ **NEW** — `showToast()` + `<ToastContainer />` |
| Offline banner component | [offline-banner.tsx](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/components/ui/offline-banner.tsx) | ✅ **NEW** |
| Spinner component | [spinner.tsx](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/components/ui/spinner.tsx) | ✅ **NEW** |
| Theme Provider (Civic/Ghost) | [theme-provider.tsx](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/components/theme-provider.tsx) | ✅ Complete |
| PWA setup (next-pwa + manifest) | [next.config.ts](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/next.config.ts) | ✅ Complete |
| Middleware — route protection | [middleware.ts](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/middleware.ts) | ✅ Protects `/dashboard` and `/report` — Supabase session check |
| PDF Export utility | [pdf-export.ts](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/utils/pdf-export.ts) | ✅ **NEW** |
| PDF Export hook | [usePdfExport.ts](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/hooks/usePdfExport.ts) | ✅ **NEW** |
| GeoTagMap (Leaflet interactive map with draggable marker) | [geo-tag-map.tsx](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/components/maps/geo-tag-map.tsx) | ✅ **NEW** — from `jeff-ProjectLead` |
| Profile avatar upload (file validation + Supabase Storage) | [avatar-upload.tsx](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/components/profile/avatar-upload.tsx) | ✅ **NEW** — from `jeff-ProjectLead` |
| Supabase Storage utility (profile images) | [storage.ts](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/utils/supabase/storage.ts) | ✅ **NEW** |
| Laravel API client (typed fetch wrapper) | [laravel-api.ts](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/utils/laravel-api.ts) | ✅ **NEW** |

### AI Service (`apps/ai-service`) — FastAPI + Python

| Feature | Files | Status |
|---------|-------|--------|
| FastAPI app with CORS + lifespan | [main.py](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/ai-service/main.py) | ✅ Complete |
| YOLOv8 image classification | [image_analysis.py](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/ai-service/image_analysis.py) | ✅ COCO-class detection + env violation mapping |
| YOLOv8 model weights | [yolov8n.pt](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/ai-service/yolov8n.pt) | ✅ 6.5 MB pre-trained model |
| `POST /analyze` (file upload) | [main.py](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/ai-service/main.py) | ✅ Complete |
| `POST /analyze/base64` (base64 image) | [main.py](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/ai-service/main.py) | ✅ Called by Laravel TriageService |
| `GET /analyze/model` (model status) | [main.py](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/ai-service/main.py) | ✅ Complete |
| Gremlin client (Cosmos DB) | [gremlin_client.py](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/ai-service/gremlin_client.py) | ✅ `gremlinpython` client with incident routing |
| `POST /routing/incident` (graph routing) | [main.py](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/ai-service/main.py) | ✅ Complete |
| `GET /routing/status` (Gremlin config) | [main.py](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/ai-service/main.py) | ✅ Complete |
| `GET /routing/traversal` (preview) | [main.py](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/ai-service/main.py) | ✅ Complete |
| Graph topology + bootstrap seed | [graph_topology.py](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/ai-service/graph_topology.py), [gremlin_bootstrap.py](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/ai-service/gremlin_bootstrap.py) | ✅ Complete |
| Dockerfile for Azure | [Dockerfile](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/ai-service/Dockerfile) | ✅ Python 3.12-slim + OpenGL libs |

---

## 🔴 What Still Needs To Be Done

### 🚨 Priority 0 — Blocking Everything

| # | Task | Owner | Priority | Notes |
|---|------|-------|----------|-------|
| **B1** | **Fix Supabase DB connection** | ReD | 🔴 CRITICAL | DNS cannot resolve `db.sfklmmtimelotqvrldni.supabase.co`. Resume or recreate Supabase project, update `.env` |
| **B2** | **Run `php artisan migrate` and `db:seed`** | ReD | 🔴 CRITICAL | Blocked by B1 — tables, seeders, and laws must be verified in production DB |

### Sprint 1 — Remaining Items

| # | Task | Owner | Priority | Notes |
|---|------|-------|----------|-------|
| 1 | **Runtime-verify Supabase Auth flow** | FE3 | 🔴 HIGH | Code exists — needs live Supabase project test. Blocked by B1 |

### Sprint 2 — Core Data Flow

| # | Task | Owner | Priority | Notes |
|---|------|-------|----------|-------|
| ~~3~~ | ~~Complete `ReportController::store()`~~ | | | ✅ **DONE** |
| ~~4~~ | ~~Configure Laravel → Supabase Storage~~ | | | ✅ **DONE** |
| ~~5~~ | ~~Wire report form to real camera~~ | | | ✅ **DONE** — `useCamera` hook now integrated in morphed `report/page.tsx` |
| ~~6~~ | ~~Improve toast system~~ | | | ✅ **DONE** — `toast.tsx` component with `showToast()` function + `<ToastContainer />` |
| ~~7~~ | ~~Fix `flushOfflineQueue` env bug~~ | | | ✅ **DONE** |

### Sprint 3 — The "Brain" & Ghost Mode Security

| # | Task | Owner | Priority | Notes |
|---|------|-------|----------|-------|
| ~~8~~ | ~~Build YOLOv8 endpoint~~ | | | ✅ **DONE** |
| ~~9~~ | ~~Connect Cosmos DB Gremlin~~ | | | ✅ **DONE** |
| ~~10~~ | ~~Wire Laravel triage to AI~~ | | | ✅ **DONE** |
| ~~11~~ | ~~Wire Edge Interceptor Modal~~ | | | ✅ **DONE** — Triage pre-check in `handleSubmit()` triggers `EdgeInterceptorModal` when `has_concern: true` |
| 12 | **Connect Profile page to real user data** | FE3 | 🟡 MEDIUM | Currently hardcoded values — needs `GET /api/user/profile` endpoint |

### Sprint 4 — PWA, Polishing & Demo Prep

| # | Task | Owner | Priority | Notes |
|---|------|-------|----------|-------|
| ~~15~~ | ~~Dockerfile for Laravel~~ | | | ✅ **DONE** |
| ~~16~~ | ~~Dockerfile for AI service~~ | | | ✅ **DONE** |
| 17 | **Deploy to Azure Container Apps** | ReD | 🟡 MEDIUM | Dockerfiles ready; needs Azure resource provisioning |
| 18 | **End-to-end triage routing test** | ReD | 🟡 MEDIUM | All components exist; need live Cosmos DB + Supabase |
| 19 | **Mobile responsiveness polish** | FE1 | 🟡 MEDIUM | Dashboard/report pages need mobile audit |
| 20 | **Contrast accessibility audit** | FE1 | 🟡 MEDIUM | Theme variables exist; no WCAG testing done |
| 21 | **Global offline UI indicator** | FE3 | 🟢 LOW | `offline-banner.tsx` exists — needs integration across all page layouts |
| 22 | **Clean up debug panel / test buttons** | FE3 | 🟢 LOW | Debug panel gated behind `NODE_ENV === "development"` |
| 23 | **Scoreboard UI polish** | FE1 | 🟡 MEDIUM | Needs Neo-Brutalist styling treatment |
| 24 | **Rebase `katherine-FE1` onto `development`** | FE1 | 🔴 HIGH | Risk of large conflicts |
| 25 | **Rebase `roseby-FE2` onto `development`** | FE2 | 🔴 HIGH | Risk of large conflicts |

### RBAC Implementation Tasks (NEW)

| # | Task | Owner | Priority | Notes |
|---|------|-------|----------|-------|
| R1 | **Create `EnsureRole` middleware** | ReD | 🔴 HIGH | No role enforcement exists on any route |
| R2 | **Create `TicketAssignmentController`** with policy | ReD | 🟡 MEDIUM | Policy is orphaned — needs CRUD endpoints |
| R3 | **Create admin API controllers** (Rewards, NGOs, Laws, Audit) | ReD | 🟡 MEDIUM | Models exist but no API surface |
| R4 | **Add role-aware frontend rendering** | FE3 | 🟡 MEDIUM | Sidebar should conditionally show admin items |
| R5 | **Consider `ngo_staff` role** | ReD | 🟢 LOW | Needed if NGOs get their own portal view |

---

## 🔥 Critical Path — Remaining Blockers

> [!CAUTION]
> These items are the final gates before a demo-ready state.

1. **Supabase connection** (B1) — DNS failure blocks ALL database operations. Must fix before anything else.
2. **RBAC middleware** (R1) — Currently any authenticated user can hit any endpoint. Critical for demo credibility.
3. **Branch synchronization** (#24, #25) — FE1 and FE2 branches are dangerously behind and must rebase.
4. **Azure deployment** (#17) — Dockerfiles are ready; need cloud provisioning.
5. **Profile data** (#12) — Profile page is the last hardcoded-data page.

---

## 📁 Roadmap vs. Codebase Delta (ai-roadmap.md Corrections)

The `ai-roadmap.md` file is **outdated** in several areas. Here are corrections needed:

| Roadmap Item | Roadmap Says | Reality |
|-------------|-------------|---------|
| Sprint 2, FE3: Toast system | "⚠️ Partial. Basic toastMessage string state" | ✅ **DONE** — `toast.tsx` with `showToast()` + `<ToastContainer />` merged from `ui-experiment` |
| Sprint 2, FE3: Env bug | "🐛 BUG FIX NEEDED: line 111" | ✅ **FIXED** — resolved in morphed `page.tsx` |
| Sprint 3, ReD: YOLOv8 | "❌ Not started. No YOLOv8 model code" | ✅ **DONE** — `image_analysis.py` + `yolov8n.pt` + `/analyze` endpoints |
| Sprint 3, ReD: Cosmos DB | "⚠️ Partial. Missing gremlinpython client" | ✅ **DONE** — `gremlin_client.py` with full routing |
| Sprint 3, ReD: Laravel → AI | "❌ Not started. No HTTP client call" | ✅ **DONE** — `TriageService.php` calls `/analyze/base64` |
| Sprint 3, FE3: Edge Interceptor wiring | "needs trigger from triage response" | ✅ **DONE** — `handleSubmit()` calls triage, intercepts on `has_concern: true` |
| Sprint 2 Progress | "~50% COMPLETE" | Should be **~85% COMPLETE** |
| Sprint 3 Progress | "~40% COMPLETE" | Should be **~85% COMPLETE** |
| Sprint 4 Feature: PWA | "Installable on phones" (generically) | **MORE THAN PLANNED** — `next-pwa`, `manifest.json`, maskable icons, runtime caching all implemented |
| Backend: Auth | Not mentioned in Sprint 4 | **UNPLANNED** — `AuthController.php` with Sanctum register/login/logout/sync endpoints |
| Backend: Dashboard API | Not planned | **UNPLANNED** — `DashboardController.php` with `/api/dashboard/stats` and `/api/dashboard/feed` |
| Backend: Ticket listing | Not planned | **UNPLANNED** — `TicketController.php` with paginated search/filter listing |
| Frontend: Analytics Dashboard | "Static Home/Feed UI" only | **UNPLANNED** — 5 page dashboard suite with KPI cards, incidents manager, analytics/reports page |
| Frontend: GeoTagMap | "Geolocation API integration" (lat/long capture) | **UNPLANNED** — Full Leaflet interactive map with draggable marker |
| Frontend: Avatar Upload | Not planned | **UNPLANNED** — Profile avatar upload with Supabase Storage |
| Frontend: Laravel API client | Not planned | **UNPLANNED** — Typed `laravelFetch<T>()` wrapper |

---

## 📈 Velocity Assessment

The team has made **excellent progress** since the initial roadmap. Sprint 2 and Sprint 3 are nearly complete — the backend pipeline, AI service, and frontend integration are all functional. The main blockers are **infrastructure** (Supabase DNS, Azure deployment) and **governance** (RBAC middleware).

**Estimated remaining effort:**
- Supabase fix: ~30 minutes (if project just needs resuming)
- Sprint 1 completion: ~1 hour (runtime verification)
- Sprint 2 completion: ✅ Effectively done (minor polish only)
- Sprint 3 completion: ~2-3 hours (profile data endpoint — partially done via `jeff-ProjectLead` profile page but still needs live data hookup)
- Sprint 4 completion: ~8-12 hours (Azure deployment + branch rebases + polish)
- RBAC implementation: ~3-5 hours (middleware done; frontend gating + admin controller stubs remain)
- **Unplanned feature integration:** ~2-4 hours (GeoTagMap wiring into report flow, PDF export documentation cleanup, dashboard analytics integration)

**Total estimated time to demo-ready:** ~16-24 hours
