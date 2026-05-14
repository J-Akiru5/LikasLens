# 🤖 LikasLens AI State Ledger
> **AI INSTRUCTION:** > 1. Read this file before starting any task to understand the current sprint context. 
> 2. **CRITICAL:** Cross-reference the `README.md` for environment setup/prerequisites and `instructions.md` (or `SKILLS.md`) for specialized agentic workflows and prompt snippets.
> 3. Update the "Current State" and "Completed" sections before finishing a session.

## 📍 Current Phase: Sprint 1 (Foundation & Boilerplate)
**Current Goal:** Environments running, database ready, basic screens visible. No complex logic yet.

---

## 📝 The 1-Month Sprint Roadmap

### 🏃 Sprint 1: Foundation & Boilerplate (ACTIVE)
**ReD (Lead):**
- [x] Set up Supabase DB schemas (users, reports, leaderboard). *(Architecture Rules: Use UUIDs for users, set point expiration to 12 months, make reward stock global, seed RA 9003/8749/9275/6969, and allow Analysts to directly assign NGOs).*
	- Status: Completed. Migrations, Eloquent Models (with UUIDs/relationships), and Laravel Policies are set up in `apps/backend`.
	- Next: Unblocked. Ready for API endpoint implementations in Sprint 2.

**FE1 (UI & Styling):**
- [ ] Init Next.js repo with Tailwind & push to GitHub.
	- Status: Partial. Next.js + Tailwind scaffold exists; GitHub push confirmation is pending.
- [ ] Build static Home/Feed UI (use fake data).
	- Status: Not started. Home page is still starter template.
- [ ] Build static Transparency Scoreboard UI.
	- Status: Not started. Scoreboard UI files are not present yet.

**FE2 (Hardware & PWA):**
- [x] Create a blank test page to open mobile camera via HTML5 `<video>`.
- [x] Build standalone UI component: "Take Photo" button.
	- Status: Completed in `apps/frontend/src/app/camera-test/page.tsx`.

**FE3 (State & API Connector):**
- [ ] Connect Next.js app to Supabase Auth SDK.
- [ ] Build Login/Register screens and verify user creation.
	- Status: Partial. Supabase auth scaffolding and login/register flow exist in code, but end-to-end runtime verification is still pending.
	- Blocker: Environment/runtime verification still needed to confirm user creation in active setup.

**Sprint 1 Dependency Notes (for Sprint 2 readiness):**
- Frontend auth setup must be runtime-verified before FE3 report submission tasks.
- FE2 camera test route and Take Photo component should be created first to unblock capture + GPS work.
- ReD backend schema finalization should align with OpenAPI payload contracts before `/api/reports` and `/api/leaderboard` implementation.

---

### 🏃 Sprint 2: Core Data Flow 
**Goal:** A user can take a photo, attach GPS, and send it to the Laravel backend.

**ReD:**
- [ ] Build Laravel POST `/api/reports` endpoint (accepts image/GPS).
- [ ] Configure Laravel to upload images to Supabase Storage.
- [ ] Build Laravel GET `/api/leaderboard` endpoint.

**FE1:**
- [ ] Build the "Ghost Mode" toggle switch component.
- [ ] Implement dynamic Tailwind dark/light theme switching based on toggle state.

**FE2:**
- [x] Update Camera component to capture and save base64 image / File.
- [x] Integrate Geolocation API to get Lat/Long when photo snaps.
	- Status: Completed in `apps/frontend/src/app/camera-test/page.tsx`.

**FE3:**
- [ ] Create Form State to hold FE2's camera/GPS data.
- [ ] Write Axios/Fetch request to hit Laravel POST `/api/reports`.
- [ ] Add loading spinners and success toasts to the form.

---

### 🏃 Sprint 3: The "Brain" & Ghost Mode Security
**Goal:** Integrate AI routing, implement EXIF stripping, and test two-tiered pipelines.

**ReD:**
- [ ] Deploy Python FastAPI YOLOv8 microservice to Azure Container Apps.
- [ ] Set up Cosmos DB (Gremlin) logic rules for automated routing.
- [ ] Connect Laravel triage logic to Azure Function / Python API.

**FE1:**
- [ ] Build "Edge Interceptor" Warning Modal UI (High risk detected).
- [ ] Build User Profile UI to display Eco-Credits.

**FE2:**
- [x] Write JS utility function to strip EXIF data from images.
- [x] Apply EXIF stripper ONLY when Ghost Mode toggle is ON.
	- Status: Completed in `apps/frontend/src/utils/exifStripper.ts` and `apps/frontend/src/app/camera-test/page.tsx`.

**FE3:**
- [ ] Hook up Scoreboard UI to fetch real data from Laravel GET endpoint.
- [ ] Modify Form POST logic: Strip user_id if Ghost Mode is ON.

---

### 🏃 Sprint 4: PWA, Polishing & Demo Prep
**Goal:** Installable on phones, squashed bugs, simulation ready.

**ReD:**
- [ ] Deploy Laravel backend to Azure Container Apps.
- [ ] End-to-end testing of Triage routing logic. *(Ensure Gemini conversation soft-deletes are active for legal compliance).*

**FE1:**
- [ ] Polish mobile responsiveness (fix paddings, tap targets).
- [ ] Ensure theme colors meet contrast accessibility standards.

**FE2:**
- [x] Install and configure `next-pwa` plugin.
- [x] Generate `manifest.json` and app icons for home screen installation.
	- Status: Completed in `apps/frontend/next.config.ts`, `apps/frontend/public/manifest.json`, and `apps/frontend/public/icons/`.

**FE3:**
- [ ] Add offline error catching (prompt user if connection drops).
- [ ] Clean up unused console.logs and dead code.

---

## 🧠 Memory Bank (Context for the AI)
* **Documentation:** Always refer to `README.md` for the tech stack overview and `instructions.md` for team-specific coding standards and Copilot skills.
* **Mission:** Build a neuro-symbolic, PWA-based civic reporting platform featuring a gamified "Civic Mode" and a secure "Ghost Mode."
* **Architecture:** Next.js (Frontend) → Laravel (Backend) → Supabase (Database).
* **Workflow Rules:** Devs use a Kanban board. No more than 2 tickets "In Progress" at once per dev.

## 🤝 Handoff Notes
*ReD update: Sprint 1 status was audited and annotated with Partial/Not started markers. FE2 camera test, capture + GPS, EXIF stripping, and PWA setup are now implemented. Use the status notes above to claim next tickets in Kanban.*