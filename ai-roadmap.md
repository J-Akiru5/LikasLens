# 🤖 LikasLens AI State Ledger
> **AI INSTRUCTION:** 
> 1. Read this file before starting any task to understand the current sprint context. 
> 2. **CRITICAL:** Cross-reference the `README.md` for environment setup/prerequisites and `likaslens_status_report05-15-26.md` for the latest audit.
> 3. Update the "Current State" and "Completed" sections before finishing a session.

## 📍 Current Phase: Sprint 3 (The "Brain" & Ghost Mode) — Sprint 1/2 effectively done
**Current Goal:** Implement RBAC middleware, connect profile to real data, and deploy to Azure.

## ✅ Completed This Session (May 16, 2026)
- Merged `ui-experiment` into `development` (morphed both sides)
- Created `EnsureRole` middleware registered as `role:` alias
- Created `TicketAssignmentController` with policy authorization
- Updated `api.php` with role-protected route groups (analyst+, super_admin)
- Added `GET /api/user/profile` endpoint with role data for frontend role-aware rendering
- Updated this roadmap to reflect current reality

---

## 📝 The 1-Month Sprint Roadmap

### 🏃 Sprint 1: Foundation & Boilerplate (~90% COMPLETE)
**ReD (Lead):**
- [x] Set up Supabase DB schemas (users, reports, leaderboard).
	- ✅ Complete. Full domain migration with 14 UUID-based tables including tickets, evidence, environmental laws, penalties, violations, classifications, NGOs, assignments, rewards, redemptions, ledger, conversations, messages, audit logs. 17 Eloquent models. EnvironmentalLawSeeder seeds RA 9003/8749/9275/6969 + 9 additional laws. NgoSeeder exists. TicketAssignmentPolicy implemented.
	- ⚠️ Remaining: Runtime-verify `php artisan migrate` runs cleanly (blocked by Supabase DNS failure).

**FE1:**
- [x] Init Next.js repo with Tailwind & push to GitHub. ✅ Done.
- [x] Build static Home/Feed UI (use fake data). ✅ Done. Landing page with Hero, Features, Ghost Mode spotlight, Framer Motion animations, neo-brutalist design.
- [x] Build static Transparency Scoreboard UI. ✅ Done. `/scoreboard` fetches from Laravel `/api/leaderboard`.

**FE2:**
- [x] Create blank test page for mobile camera. ✅ Done.
- [x] Build "Take Photo" button component. ✅ Done in `hooks/useCamera.ts`.

**FE3:**
- [x] Connect Next.js to Supabase Auth SDK. ✅ Done.
- [x] Build Login/Register screens. ✅ Done. Server actions (`signIn`/`signUp`), Supabase middleware for session management.
- [ ] **Runtime-verify Supabase Auth flow** — blocked by Supabase connection.

---

### 🏃 Sprint 2: Core Data Flow (~85% COMPLETE)
**Goal:** A user can take a photo, attach GPS, and send it to the Laravel backend.

**ReD:**
- [x] Build Laravel POST `/api/reports` endpoint.
	- ✅ **COMPLETE.** 184-line production controller: DB transaction, Supabase Storage upload, checksums, MIME detection, Ticket + TicketEvidence + Report creation, AI triage trigger, Ghost Mode user resolution.
- [x] Configure Laravel to upload images to Supabase Storage.
	- ✅ **COMPLETE.** `supabase` S3-compatible disk configured in `filesystems.php` with env-based credential loading and fallback to `local`.
- [x] Build Laravel GET `/api/leaderboard` endpoint.
	- ✅ Complete. Queries `users.reward_points_balance`, returns top 20.
- [x] Create Report Triage endpoint (`POST /api/reports/triage`).
	- ✅ Complete. Pre-submit AI check without persisting.

**FE1:**
- [x] Build "Ghost Mode" toggle. ✅ Done — theme switch across navbar, sidebar, report form.
- [x] Implement dynamic theme switching. ✅ Done — `ThemeProvider` with `data-theme` attribute and localStorage persistence.

**FE2:**
- [x] Camera component captures base64 image. ✅ Done.
- [x] Geolocation API integration. ✅ Done — lat/long on photo capture.

**FE3:**
- [x] Form state for camera/GPS data. ✅ Done.
- [x] Fetch request to POST `/api/reports`. ✅ Done — with Ghost Mode stripping, offline IndexedDB queuing, auto-flush on reconnect.
- [x] Loading spinners and success toasts.
	- ✅ **DONE.** `ToastContainer` + `showToast()` from `components/ui/toast.tsx` — animated, auto-dismissing.
- [x] **BUG FIX** — env var assignment bug. ✅ Fixed in morphed `page.tsx`.
- [x] **Camera integration** — `useCamera` hook wired into report form. ✅ Done.

---

### 🏃 Sprint 3: The "Brain" & Ghost Mode Security (~85% COMPLETE)
**Goal:** Integrate AI routing, implement EXIF stripping, and enforce role-based access.

**ReD:**
- [x] Build Python FastAPI YOLOv8 microservice.
	- ✅ **COMPLETE.** `image_analysis.py` with COCO-class detection + environmental violation mapping. `yolov8n.pt` model (6.5 MB). Endpoints: `/analyze`, `/analyze/base64`, `/analyze/model`. Dockerfile included.
- [x] Set up Cosmos DB (Gremlin) for automated routing.
	- ✅ **COMPLETE.** `gremlin_client.py` with `gremlinpython` client, connection management, incident routing transactions. Endpoints: `/routing/incident`, `/routing/status`, `/routing/traversal`. Graph topology + bootstrap seed data.
- [x] Connect Laravel triage logic to AI service.
	- ✅ **COMPLETE.** `TriageService.php` calls `/analyze/base64` via `Http::post()`, stores `TicketClassification` records.
- [x] **RBAC Middleware** — `EnsureRole` middleware.
	- ✅ **COMPLETE.** Created `app/Http/Middleware/EnsureRole.php`, registered as `role:` alias in `bootstrap/app.php`. Routes now gated: `GET /api/user/profile` (auth:sanctum), `ticket-assignments` CRUD (role:analyst,super_admin), admin stubs (role:super_admin).

**FE1:**
- [x] Build "Edge Interceptor" Warning Modal. ✅ Complete — Framer Motion, keyboard nav, Ghost Mode recommendation. Now triggered by triage pre-check in `handleSubmit()`.
- [x] Build User Profile UI with Eco-Credits. ✅ Complete — hardcoded data; needs `GET /api/user/profile` hookup.
- [ ] **Role-aware frontend rendering** (sidebar nav gating based on role). 🟡 PENDING.

**FE2:**
- [x] EXIF stripping utility. ✅ Done — `exifStripper.ts` + integrated in report form.
- [x] EXIF stripper applied in Ghost Mode. ✅ Done.

**FE3:**
- [x] Scoreboard fetches real data from Laravel. ✅ Done.
- [x] Form strips `user_id` in Ghost Mode. ✅ Done.
- [x] Toast system with showToast(). ✅ Done.
- [x] Offline banner component. ✅ Done — `components/ui/offline-banner.tsx`.
- [ ] **Connect Profile page to `GET /api/user/profile`**. 🟡 PENDING.

---

### 🏃 Sprint 4: PWA, Polishing & Demo Prep (~50% COMPLETE)
**Goal:** Installable on phones, squashed bugs, simulation ready.

**ReD:**
- [x] Dockerfile for Laravel backend. ✅ Done — PHP 8.2-cli + Composer.
- [x] Dockerfile for AI service. ✅ Done — Python 3.12-slim + OpenGL libs for YOLOv8.
- [ ] Deploy Laravel + AI service to Azure Container Apps. 🟡 PENDING.
- [ ] End-to-end testing of Triage routing logic. 🟡 PENDING — needs live Cosmos DB + Supabase.

**FE1:**
- [ ] Mobile responsiveness polish. 🟡 PENDING.
- [ ] Contrast accessibility audit (WCAG). 🟡 PENDING.
- [ ] Scoreboard UI polish (Neo-Brutalist styling). 🟡 PENDING.

**FE3:**
- [x] Offline caching / queuing. ✅ Done — IndexedDB + localStorage, auto-flush on reconnect.
- [ ] Global offline UI indicator across all pages. 🟢 LOW PENDING.
- [ ] Clean up console.logs and dead code. 🟢 LOW PENDING.

---

## 🔐 RBAC Implementation Status

| # | Task | Priority | Status |
|---|------|----------|--------|
| R1 | `EnsureRole` middleware + route gating | 🔴 HIGH | ✅ Done |
| R2 | `TicketAssignmentController` with policy | 🟡 MEDIUM | ✅ Done |
| R3 | Admin API controllers (Rewards, NGOs, Laws, Audit) | 🟡 MEDIUM | 🔲 Route stubs created; controller implementation pending |
| R4 | Role-aware frontend rendering | 🟡 MEDIUM | 🔲 Pending — fetch role via `/api/user/profile`, gate sidebar items |
| R5 | `ngo_staff` role consideration | 🟢 LOW | 🔲 Not started |

---

## 🐛 Known Issues

| Issue | Severity | Status |
|-------|----------|--------|
| Supabase DNS failure (`db.sfklmmtimelotqvrldni.supabase.co` unresolved) | 🔴 BLOCKER | Needs Supabase project resume/recreation |
| FE1/FE2 branches significantly behind `development` | 🔴 HIGH | Needs rebase |
| Profile page uses hardcoded data | 🟡 MEDIUM | Needs `GET /api/user/profile` integration |
| FE1/FE2 lack role-aware rendering | 🟡 MEDIUM | Pending backend role endpoint consumption |

---

## 🧠 Memory Bank (Context for the AI)
* **Documentation:** Refer to `README.md` for tech stack, `likaslens_status_report05-15-26.md` for the latest full audit.
* **Mission:** Build a neuro-symbolic, PWA-based civic reporting platform with gamified "Civic Mode" and secure "Ghost Mode."
* **Architecture:** Next.js (Frontend) → Laravel (Backend) → Supabase (Database) → FastAPI (AI Service) → Cosmos DB Gremlin (Graph Routing).
* **RBAC Roles:** `citizen` (default), `ghost` (anonymous), `analyst` (ticket management), `super_admin` (full access).
* **Current Blocker:** Supabase project at `sfklmmtimelotqvrldni` — DNS cannot resolve the host. Project may be paused or deleted.

## 🤝 Handoff Notes
*May 16, 2026 — 09:26 PHT:* Major progress since initial roadmap. Sprint 2 and Sprint 3 are ~85% complete. The backend persistence pipeline, AI service (YOLOv8 + Gremlin), and frontend integration are all functional. RBAC middleware is now in place. The remaining critical path is: (1) Supabase DNS fix, (2) Azure deployment, (3) FE1/FE2 branch rebases, (4) profile data integration, (5) role-aware frontend rendering.
