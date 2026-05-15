# 🔍 LikasLens — Project Status Report & Work Breakdown

**Generated:** May 15, 2026  
**Branch:** `jeff-ProjectLead` (merged with `main`)  
**Architecture:** Next.js (Frontend) → Laravel (Backend) → FastAPI (AI Service) → Supabase (DB) + Cosmos Gremlin (Graph)

---

## 📊 Sprint Progress Overview

| Sprint | Phase | Target Completion | Status |
|--------|-------|-------------------|--------|
| Sprint 1 | Foundation & Boilerplate | ████████░░ | **~80% Done** |
| Sprint 2 | Core Data Flow | █████░░░░░ | **~50% Done** |
| Sprint 3 | The "Brain" & Ghost Mode | ████░░░░░░ | **~40% Done** |
| Sprint 4 | PWA, Polishing & Demo Prep | ███░░░░░░░ | **~30% Done** |

---

## ✅ What's Built & Working

### Backend (`apps/backend`) — Laravel 12

| Feature | Files | Status |
|---------|-------|--------|
| Full domain schema (14 tables, UUIDs) | [migration](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/backend/database/migrations/2026_04_11_000100_create_likaslens_domain_tables.php) | ✅ Complete |
| 16 Eloquent Models | [Models/](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/backend/app/Models) | ✅ Complete |
| `POST /api/reports` endpoint (stub) | [ReportController](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/backend/app/Http/Controllers/ReportController.php) | ⚠️ Stub only — validates input but does NOT store to DB or Supabase Storage |
| `GET /api/leaderboard` endpoint | [LeaderboardController](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/backend/app/Http/Controllers/LeaderboardController.php) | ✅ Functional (reads from `users.reward_points_balance`) |
| `GET /api/health` endpoint | [api.php](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/backend/routes/api.php) | ✅ Complete |
| Environmental Law seeder (RA 9003/8749/9275/6969 + 9 more laws) | [EnvironmentalLawSeeder](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/backend/database/seeders/EnvironmentalLawSeeder.php) | ✅ Complete |
| NGO seed data | [NgoSeeder](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/backend/database/seeders/NgoSeeder.php) | ✅ Complete |
| TicketAssignment authorization policy | [TicketAssignmentPolicy](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/backend/app/Policies/TicketAssignmentPolicy.php) | ✅ Complete |
| CORS configuration | [config/cors.php](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/backend/config/cors.php) | ✅ Complete |
| LeaderboardTest feature test | [LeaderboardTest](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/backend/tests/Feature/LeaderboardTest.php) | ✅ Complete |

### Frontend (`apps/frontend`) — Next.js 14 + Tailwind

| Feature | Files | Status |
|---------|-------|--------|
| Landing page (Hero, Features, Ghost Mode spotlight, Scoreboard preview) | [page.tsx](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/app/page.tsx) | ✅ Polished with Framer Motion |
| Login page (Supabase Auth) | [login/page.tsx](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/app/login/page.tsx) | ✅ Complete |
| Register page (Supabase Auth) | [register/page.tsx](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/app/register/page.tsx) | ✅ Complete |
| Auth server actions (signIn / signUp) | [actions/auth.ts](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/app/actions/auth.ts) | ✅ Complete |
| Dashboard (sidebar, header, stats, activity feed, quick actions) | [dashboard/page.tsx](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/app/dashboard/page.tsx) | ✅ Complete (static/fake data) |
| Report submission form (image + GPS + Ghost Mode + offline queue) | [report/page.tsx](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/app/report/page.tsx) | ✅ Functional — hits Laravel `/api/reports` |
| Profile page (Eco-Credits, badges, stats) | [profile/page.tsx](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/app/profile/page.tsx) | ✅ Complete (static/hardcoded data) |
| Scoreboard page (fetches from Laravel) | [scoreboard/page.tsx](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/app/scoreboard/page.tsx) | ✅ Functional (bare-bones UI) |
| Camera test page | [camera-test/page.tsx](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/app/camera-test/page.tsx) | ✅ Complete |
| useCamera hook (capture + GPS) | [useCamera.ts](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/hooks/useCamera.ts) | ✅ Complete |
| EXIF stripper utility | [exifStripper.ts](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/utils/exifStripper.ts) | ✅ Complete |
| Edge Interceptor Modal (High-risk warning) | [edge-interceptor-modal.tsx](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/components/modals/edge-interceptor-modal.tsx) | ✅ Complete (UI only, not wired to AI) |
| Theme Provider (Civic/Ghost dual-theme) | [theme-provider.tsx](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/components/theme-provider.tsx) | ✅ Complete |
| Ghost Mode toggle on homepage | [page.tsx](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/app/page.tsx) | ✅ Complete with theme switching |
| PWA setup (next-pwa + manifest + icons) | [next.config.ts](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/next.config.ts), [manifest.json](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/public/manifest.json) | ✅ Complete |
| Supabase middleware (auth session management) | [middleware.ts](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/middleware.ts) | ✅ Complete |
| Layout components (Sidebar, Header, UserNav) | [components/layout/](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/components/layout) | ✅ Complete |
| Dashboard sub-pages (incidents, reports) | [dashboard/incidents/](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/app/dashboard/incidents), [dashboard/reports/](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/app/dashboard/reports) | ✅ Pages exist |
| Public Scoreboard component | [public-scoreboard.tsx](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/components/scoreboard/public-scoreboard.tsx) | ✅ Component exists |

### AI Service (`apps/ai-service`) — FastAPI + Python

| Feature | Files | Status |
|---------|-------|--------|
| FastAPI app with CORS | [main.py](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/ai-service/main.py) | ✅ Complete |
| Graph topology definition (9 vertex labels, 7 edge labels) | [graph_topology.py](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/ai-service/graph_topology.py) | ✅ Complete |
| Gremlin bootstrap seed data | [gremlin_bootstrap.py](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/ai-service/gremlin_bootstrap.py) | ✅ Complete |
| Baseline rules upserts | [gremlin_upserts/baseline_rules.py](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/ai-service/gremlin_upserts/baseline_rules.py) | ✅ Complete |
| Cosmos Gremlin setup guide | [COSMOS_GREMLIN_SETUP_GUIDE.md](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/ai-service/COSMOS_GREMLIN_SETUP_GUIDE.md) | ✅ Complete |
| `/graph/topology`, `/graph/bootstrap-payload`, `/graph/bootstrap-queries` endpoints | [main.py](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/ai-service/main.py) | ✅ Complete |

---

## 🔴 What Still Needs To Be Done

### Sprint 1 — Remaining Items

| # | Task | Owner | Priority | Notes |
|---|------|-------|----------|-------|
| 1 | **Runtime-verify Supabase Auth flow** (login → register → session persistence → redirect) | FE3 | 🔴 HIGH | Code exists but needs end-to-end runtime test to confirm user creation works |
| 2 | **Verify database migration runs cleanly** with `php artisan migrate` | ReD | 🔴 HIGH | Tables are defined but no evidence of a successful migration run |

### Sprint 2 — Core Data Flow

| # | Task | Owner | Priority | Notes |
|---|------|-------|----------|-------|
| 3 | **Complete `ReportController::store()` — actual persistence** | ReD | 🔴 HIGH | Currently a stub (line 22: `// TODO: Process the report`). Must store image to Supabase Storage + save ticket/evidence metadata to DB |
| 4 | **Configure Laravel → Supabase Storage integration** | ReD | 🔴 HIGH | No Supabase storage driver or filesystem disk configured |
| 5 | **Wire report form to use real camera** (replace test data flow) | FE2/FE3 | 🟡 MEDIUM | Report page has `populateWithTestData()` — needs integration with `useCamera` hook |
| 6 | **Add loading spinners and proper toast system** to report form | FE3 | 🟡 MEDIUM | Basic toast exists but uses a simple string state, not a proper toast component |
| 7 | **Fix `flushOfflineQueue` env assignment bug** | FE3 | 🔴 HIGH | Line 111: `process.env.NEXT_PUBLIC_LARAVEL_API_URL="http://127.0.0.1:8000"` — this is an **assignment**, not a read. Should use `||` |

### Sprint 3 — The "Brain" & Ghost Mode Security

| # | Task | Owner | Priority | Notes |
|---|------|-------|----------|-------|
| 8 | **Build YOLOv8 image classification endpoint** in AI service | ReD | 🔴 HIGH | No YOLOv8 model code exists yet — `main.py` has no `/classify` or `/analyze` endpoint |
| 9 | **Connect Cosmos DB Gremlin for live routing** | ReD | 🟡 MEDIUM | Topology + seed data defined, but actual Gremlin client connection is not implemented (bootstrap is query-only, no `gremlinpython` client) |
| 10 | **Wire Laravel triage to AI service** | ReD | 🟡 MEDIUM | No HTTP client call from Laravel to AI service exists |
| 11 | **Wire Edge Interceptor Modal to AI response** | FE3 | 🟡 MEDIUM | Modal component is built but not connected to any trigger logic |
| 12 | **Connect Profile page to real user data** | FE3 | 🟡 MEDIUM | Currently all hardcoded values (9,250 credits, 48 reports, etc.) |
| 13 | **Connect Scoreboard to live leaderboard** data | FE3 | ✅ Done | Already fetches from `/api/leaderboard` |
| 14 | **Strip `user_id` in Ghost Mode** | FE3 | ✅ Done | Already implemented (sets `ANONYMOUS_GHOST`) |

### Sprint 4 — PWA, Polishing & Demo Prep

| # | Task | Owner | Priority | Notes |
|---|------|-------|----------|-------|
| 15 | **Deploy Laravel to Azure Container Apps** | ReD | 🟡 MEDIUM | No Dockerfile or deployment config exists for backend |
| 16 | **Deploy AI service to Azure Container Apps** | ReD | 🟡 MEDIUM | No Dockerfile exists for AI service |
| 17 | **End-to-end triage routing test** | ReD | 🟡 MEDIUM | Requires #8, #9, #10 to be complete first |
| 18 | **Ensure Gemini conversation soft-deletes** | ReD | 🟢 LOW | `softDeletes()` already defined in migration for `gemini_conversations` and `gemini_messages` ✅ |
| 19 | **Mobile responsiveness polish** | FE1 | 🟡 MEDIUM | Landing page is responsive, but dashboard/report pages need mobile audit |
| 20 | **Contrast accessibility audit** | FE1 | 🟡 MEDIUM | Theme variables exist but no WCAG compliance testing done |
| 21 | **Offline error catching (connection drop prompt)** | FE3 | 🟢 LOW | Offline queueing exists in report page, but no global offline UI indicator |
| 22 | **Clean up debug info, console.logs, test data buttons** | FE3 | 🟢 LOW | Report page has debug panel + test data buttons that should be removed for production |
| 23 | **Scoreboard UI polish** | FE1 | 🟡 MEDIUM | Current scoreboard page is bare `<ol>` — needs styling to match landing page design system |

---

## 🔥 Critical Path — Top 5 Blockers

> [!CAUTION]
> These items are on the critical path. They block multiple downstream tasks and should be prioritized immediately.

1. **`ReportController::store()` persistence** (#3) — Without this, no data flows through the system. Blocks all Sprint 3 and 4 work.
2. **Supabase Storage integration** (#4) — Required for image evidence chain-of-custody.
3. **YOLOv8 classify endpoint** (#8) — Core differentiator of the platform. Blocks triage routing.
4. **Runtime auth verification** (#1) — Must confirm end-to-end before demo.
5. **`flushOfflineQueue` env bug** (#7) — This is a runtime error waiting to happen; it *assigns* to `process.env` instead of reading from it.

---

## 📁 Files Requiring Attention

### Bug Fixes
- [report/page.tsx:111](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/frontend/src/app/report/page.tsx#L111) — `process.env.NEXT_PUBLIC_LARAVEL_API_URL="http://127.0.0.1:8000"` is an assignment, not a fallback read

### Stubs Needing Implementation
- [ReportController.php:22-25](file:///s:/Dev/Laravel/LikasLens/likaslens/apps/backend/app/Http/Controllers/ReportController.php#L22-L25) — `// TODO: Process the report`

### Missing Integrations
- No `gremlinpython` or Cosmos Gremlin client in AI service
- No YOLOv8 model loading or inference code
- No Laravel HTTP client calling AI service
- No Supabase Storage filesystem disk in Laravel config

---

## 📈 Velocity Assessment

The team has made strong progress on the **frontend scaffolding** and **database design**. The critical gap is the **backend processing pipeline** — data comes in from the frontend but isn't persisted or routed. The AI service has excellent graph topology groundwork but lacks the actual ML inference layer.

**Estimated remaining effort:**
- Sprint 1 completion: ~2 hours (runtime verification only)
- Sprint 2 completion: ~8-12 hours (ReportController persistence + Supabase Storage + form integration)
- Sprint 3 completion: ~20-30 hours (YOLOv8 + Gremlin client + triage wiring)
- Sprint 4 completion: ~10-15 hours (deployment + polish)
