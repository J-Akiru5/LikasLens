# 🤖 LikasLens AI State Ledger
> **AI INSTRUCTION:** > 1. Read this file before starting any task to understand the current sprint context. 
> 2. **CRITICAL:** Cross-reference the `README.md` for environment setup/prerequisites and `instructions.md` (or `SKILLS.md`) for specialized agentic workflows and prompt snippets.
> 3. Update the "Current State" and "Completed" sections before finishing a session.

## 📍 Current Phase: Sprint 2 (Core Data Flow) — Sprint 1 nearly complete
**Current Goal:** Complete the report persistence pipeline (ReportController → Supabase Storage → DB) and runtime-verify auth flow.

## ✅ Completed This Session
- Full workspace audit against the 4-sprint roadmap.
- Merged `main` into `jeff-ProjectLead` (resolved .env.example conflict).
- Generated detailed status report with prioritized TODO list.
- Updated this roadmap with accurate progress markers per codebase evidence.

---

## 📝 The 1-Month Sprint Roadmap

### 🏃 Sprint 1: Foundation & Boilerplate (~80% COMPLETE)
**ReD (Lead):**
- [x] Set up Supabase DB schemas (users, reports, leaderboard). *(Architecture Rules: Use UUIDs for users, set point expiration to 12 months, make reward stock global, seed RA 9003/8749/9275/6969, and allow Analysts to directly assign NGOs).*
	- Status: ✅ Complete. Full domain migration with 14 UUID-based tables: `tickets`, `ticket_evidence`, `environmental_laws_ph`, `law_penalties`, `violation_types`, `ticket_classifications`, `ngo_groups`, `ticket_assignments`, `partner_stores`, `rewards_catalog`, `reward_redemptions`, `reward_point_ledger`, `gemini_conversations`, `gemini_messages`, `audit_logs`. 16 Eloquent models created. EnvironmentalLawSeeder seeds RA 9003/8749/9275/6969 + 9 additional laws with penalties and violation types. NgoSeeder exists. TicketAssignmentPolicy implemented.
	- Remaining: Runtime-verify `php artisan migrate` runs cleanly.

**FE1 (UI & Styling):**
- [x] Init Next.js repo with Tailwind & push to GitHub.
	- Status: ✅ Complete. Next.js + Tailwind scaffold in `apps/frontend`, pushed to GitHub.
- [x] Build static Home/Feed UI (use fake data).
	- Status: ✅ Complete. Landing page with Hero section, Feature cards, Ghost Mode spotlight, Public Records preview table, all with Framer Motion animations and neo-brutalist design system.
- [x] Build static Transparency Scoreboard UI.
	- Status: ✅ Complete. Scoreboard page at `/scoreboard` fetches from Laravel `/api/leaderboard`. Public Scoreboard component at `components/scoreboard/public-scoreboard.tsx`. Homepage also has inline scoreboard preview.

**FE2 (Hardware & PWA):**
- [x] Create a blank test page to open mobile camera via HTML5 `<video>`.
- [x] Build standalone UI component: "Take Photo" button.
	- Status: ✅ Completed in `apps/frontend/src/app/camera-test/page.tsx` and `hooks/useCamera.ts`.

**FE3 (State & API Connector):**
- [x] Connect Next.js app to Supabase Auth SDK.
- [x] Build Login/Register screens and verify user creation.
	- Status: ✅ Code complete. Login page, Register page, and server actions (`signIn`/`signUp`) all implemented with Supabase Auth. Supabase middleware for session management is active.
	- ⚠️ Remaining: End-to-end runtime verification pending (needs active Supabase project).

**Sprint 1 Dependency Notes (for Sprint 2 readiness):**
- ✅ Frontend auth setup code is complete — runtime verification is the only remaining gate.
- ✅ FE2 camera test route and Take Photo component are created.
- ✅ ReD backend schema finalization is complete — OpenAPI contract alignment for `/api/reports` and `/api/leaderboard` is ready.

---

### 🏃 Sprint 2: Core Data Flow (ACTIVE — ~50% COMPLETE)
**Goal:** A user can take a photo, attach GPS, and send it to the Laravel backend.

**ReD:**
- [/] Build Laravel POST `/api/reports` endpoint (accepts image/GPS).
	- Status: ⚠️ Stub only. Route registered, validation exists, but `// TODO: Process the report` — no Supabase Storage upload, no DB persistence.
- [ ] Configure Laravel to upload images to Supabase Storage.
	- Status: ❌ Not started. No Supabase Storage filesystem disk configured.
- [x] Build Laravel GET `/api/leaderboard` endpoint.
	- Status: ✅ Complete. Queries `users.reward_points_balance`, returns top 20.

**FE1:**
- [x] Build the "Ghost Mode" toggle switch component.
	- Status: ✅ Complete. Implemented on homepage nav bar + Ghost Mode spotlight section + report form. Theme switches between civic/ghost modes.
- [x] Implement dynamic Tailwind dark/light theme switching based on toggle state.
	- Status: ✅ Complete. `ThemeProvider` context at `components/theme-provider.tsx` with `data-theme` attribute switching and localStorage persistence.

**FE2:**
- [x] Update Camera component to capture and save base64 image / File.
- [x] Integrate Geolocation API to get Lat/Long when photo snaps.
	- Status: ✅ Completed in `apps/frontend/src/app/camera-test/page.tsx` and `hooks/useCamera.ts`.

**FE3:**
- [x] Create Form State to hold FE2's camera/GPS data.
	- Status: ✅ Complete in `apps/frontend/src/app/report/page.tsx` (base64Image, latitude, longitude state).
- [x] Write Axios/Fetch request to hit Laravel POST `/api/reports`.
	- Status: ✅ Complete. Uses fetch with JSON payload. Ghost Mode strips user_id. Offline queuing via IndexedDB.
- [/] Add loading spinners and success toasts to the form.
	- Status: ⚠️ Partial. Basic `toastMessage` string state exists — not a proper toast component with animations/auto-dismiss.
- 🐛 **BUG FIX NEEDED:** `report/page.tsx` line 111 — `process.env.NEXT_PUBLIC_LARAVEL_API_URL="http://127.0.0.1:8000"` is an assignment, not a read. Should be `process.env.NEXT_PUBLIC_LARAVEL_API_URL || "http://127.0.0.1:8000"`.

---

### 🏃 Sprint 3: The "Brain" & Ghost Mode Security (~40% COMPLETE)
**Goal:** Integrate AI routing, implement EXIF stripping, and test two-tiered pipelines.

**ReD:**
- [ ] Deploy Python FastAPI YOLOv8 microservice to Azure Container Apps.
	- Status: ❌ Not started. No YOLOv8 model code, no `/classify` endpoint, no Dockerfile.
- [/] Set up Cosmos DB (Gremlin) logic rules for automated routing.
	- Status: ⚠️ Partial. Graph topology, seed data, bootstrap queries, and baseline rules are defined. Missing: actual `gremlinpython` client connection to Cosmos DB.
- [ ] Connect Laravel triage logic to Azure Function / Python API.
	- Status: ❌ Not started. No HTTP client call from Laravel to AI service.

**FE1:**
- [x] Build "Edge Interceptor" Warning Modal UI (High risk detected).
	- Status: ✅ Complete. `EdgeInterceptorModal` component with Framer Motion animations, keyboard nav, and Ghost Mode recommendation.
- [x] Build User Profile UI to display Eco-Credits.
	- Status: ✅ Complete. Profile page with Eco-Credit balance, impact stats, credit breakdown, and achievement badges. Currently uses hardcoded data.

**FE2:**
- [x] Write JS utility function to strip EXIF data from images.
- [x] Apply EXIF stripper ONLY when Ghost Mode toggle is ON.
	- Status: ✅ Completed in `apps/frontend/src/utils/exifStripper.ts` and `apps/frontend/src/app/camera-test/page.tsx`. Also integrated in `report/page.tsx` `stripExif()`.

**FE3:**
- [x] Hook up Scoreboard UI to fetch real data from Laravel GET endpoint.
	- Status: ✅ Complete. `/scoreboard` page fetches from `${NEXT_PUBLIC_LARAVEL_API_URL}/api/leaderboard`.
- [x] Modify Form POST logic: Strip user_id if Ghost Mode is ON.
	- Status: ✅ Complete. When `isGhostMode === true`, sets `user_id` to `"ANONYMOUS_GHOST"`.

---

### 🏃 Sprint 4: PWA, Polishing & Demo Prep (~30% COMPLETE)
**Goal:** Installable on phones, squashed bugs, simulation ready.

**ReD:**
- [ ] Deploy Laravel backend to Azure Container Apps.
	- Status: ❌ Not started. No Dockerfile or deployment configuration.
- [ ] End-to-end testing of Triage routing logic. *(Ensure Gemini conversation soft-deletes are active for legal compliance).*
	- Status: ⚠️ Soft-deletes are already defined in the migration for `gemini_conversations` and `gemini_messages`. E2E test blocked by Sprint 3 dependencies.

**FE1:**
- [ ] Polish mobile responsiveness (fix paddings, tap targets).
	- Status: ❌ Not started. Landing page has responsive classes but dashboard/report pages need mobile audit.
- [ ] Ensure theme colors meet contrast accessibility standards.
	- Status: ❌ Not started. Theme variables exist but no WCAG compliance testing performed.

**FE2:**
- [x] Install and configure `next-pwa` plugin.
- [x] Generate `manifest.json` and app icons for home screen installation.
	- Status: ✅ Completed in `apps/frontend/next.config.ts`, `apps/frontend/public/manifest.json`, and `apps/frontend/public/icons/`.

**FE3:**
- [/] Add offline error catching (prompt user if connection drops).
	- Status: ⚠️ Partial. Report page has offline queuing (IndexedDB + localStorage fallback) and auto-flush on `online` event. Missing: global offline UI indicator across all pages.
- [ ] Clean up unused console.logs and dead code.
	- Status: ❌ Not started. Report page has debug panel, test data buttons, and console.error calls that should be removed.

---

## 🧠 Memory Bank (Context for the AI)
* **Documentation:** Always refer to `README.md` for the tech stack overview and `instructions.md` for team-specific coding standards and Copilot skills.
* **Mission:** Build a neuro-symbolic, PWA-based civic reporting platform featuring a gamified "Civic Mode" and a secure "Ghost Mode."
* **Architecture:** Next.js (Frontend) → Laravel (Backend) → Supabase (Database) → FastAPI (AI Service) → Cosmos DB Gremlin (Graph Routing).
* **Workflow Rules:** Devs use a Kanban board. No more than 2 tickets "In Progress" at once per dev.
* **Known Bug:** `report/page.tsx` line 111 has an env var assignment instead of read.

## 🤝 Handoff Notes
*May 15, 2026: Full codebase audit completed. Sprint 1 is ~80% done (auth runtime verification remaining). Sprint 2 is ~50% (form + API exist, but ReportController is a stub). FE2 work across all sprints is fully complete. FE1 work is ahead of schedule. The critical path is ReD's backend persistence pipeline (ReportController → Supabase Storage) and the AI service YOLOv8 endpoint. See `likaslens_status_report.md` artifact for the detailed breakdown.*