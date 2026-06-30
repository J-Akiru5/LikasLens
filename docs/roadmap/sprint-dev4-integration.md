# Developer 4 — Integration, PWA, APK & Demo Prep

> **Sprint:** ASEAN AI Hackathon Prep
> **Timeline:** June 5-8, 2026 (Thu-Sun)
> **Total Hours:** 32h
> **Assigned To:** Katherine (moved from Dev 1)
> **Focus:** E2E testing, PWA offline, APK build, ASEAN data, demo materials

---

## Team Roster (Updated)

| Dev | Name | Role | Focus |
|-----|------|------|-------|
| Dev 1 | Lou | Frontend/UI | Next.js UI, Tailwind, responsive design, Ghost Mode theme |
| Dev 2 | Jeff | AI/Backend | FastAPI AI service, YOLOv8, Gremlin graph, Gemini |
| Dev 3 | Charlyn | Backend/Infrastructure | Laravel API, Supabase, CI/CD, admin portal |
| Dev 4 | Katherine | Integration/PWA/APK | E2E testing, PWA offline, Capacitor APK, demo prep |

> **Note:** Roseby is no longer on the team. Katherine moved from Dev 1 to Dev 4. Lou joined as Dev 1.

### Katherine's Completed Work (from codebase evidence)
- ✅ Demo script written (docs/demo-script.md — 143 lines)
- ✅ One-pager created (docs/one-pager.md — 115 lines)
- ✅ Pitch deck created (docs/pitch-deck.md — 264 lines)
- ✅ Mobile PWA substantially built (apps/mobile-pwa/)
- ✅ PWA icons generated (192x192, 512x512, maskable, apple-touch)
- ✅ i18n messages for 5 ASEAN locales (fil, id, ms, ta, vi)
- ✅ Not-found page for mobile PWA
- ✅ Offline queue built into frontend report page (IndexedDB + auto-flush)
- ✅ Offline banner shows when network is down
- ✅ Online toast shows when connection restored
- ✅ Supabase token wired to shared API client after login/register (v0.7.1)
- ✅ Mobile PWA .env.example created (v0.7.1)

---

## Dependencies on Other Developers

| Dependency | From | Needed By | Notes |
|------------|------|-----------|-------|
| Working backend | Dev 3 (Charlyn) | Thu evening | Need `/api/health` working for E2E tests |
| Working AI service | Dev 2 (Jeff) | Sat | Need triage pipeline for full demo rehearsal |
| Demo data seeded | Dev 3 (Charlyn) | Fri afternoon | Need tickets/users for demo scenarios |
| Polished UI | Dev 1 (Lou) | Sat evening | Need impact dashboard and Ghost Mode for demo |

---

## Day 1 — Thursday, June 5

### Task 1.1: End-to-End Integration Testing
**Time:** 3h | **Priority:** HIGH | **Status:** ❌ NOT DONE

**Current state:** No integration test scripts exist in the repository. The `scripts/` directory was removed during cleanup.

**Test the full stack locally:**

1. **Start all services:**
   ```bash
   # Terminal 1: Frontend
   cd apps/frontend && pnpm dev

   # Terminal 2: Backend
   cd apps/backend && php artisan serve

   # Terminal 3: AI Service
   cd apps/ai-service && uvicorn main:app --reload --port 8001
   ```

2. **Test each integration point:**
   - [ ] Frontend loads at http://localhost:3000
   - [ ] Backend health: http://localhost:8000/api/health
   - [ ] AI service health: http://localhost:8001/health
   - [ ] Login flow: Supabase Auth → `/api/auth/sync` → Sanctum token
   - [ ] Report submission: POST `/api/reports` with image
   - [ ] Triage check: POST `/api/reports/triage`
   - [ ] Leaderboard: GET `/api/leaderboard`
   - [ ] Dashboard: GET `/api/user/impact`

3. **Document all broken integration points** in a shared doc

**Acceptance Criteria:**
- [ ] All 3 services start without errors
- [ ] Auth flow works end-to-end
- [ ] Report submission works (even without AI)
- [ ] All broken points documented with error messages

---

### Task 1.2: Start Capacitor APK Setup
**Time:** 5h | **Priority:** HIGH | **Status:** ❌ NOT DONE

**Current state:** No Capacitor config, no `android/` directory, no `@capacitor/*` dependencies in frontend.

**Goal:** Convert Next.js PWA into an Android APK using Capacitor.

**Acceptance Criteria:**
- [ ] Capacitor initialized in frontend project
- [ ] Android platform added
- [ ] `npx cap sync` runs without errors
- [ ] Android Studio opens the project
- [ ] App builds in Android Studio (debug APK)

---

## Day 2 — Friday, June 6

### Task 2.1: PWA Offline Polish
**Time:** 4h | **Priority:** HIGH | **Status:** ✅ DONE (inline in report page)

**Current state:**
- `next-pwa` (v5.6.0) wired into `apps/frontend/next.config.ts` with runtime caching
- PWA manifest exists in `apps/frontend/public/manifest.json`
- Offline queue built inline in `report/page.tsx` (lines 113-202)
- Offline banner shows when network is down (line 367-372)
- Online toast shows when connection restored (line 205)

**Enhancements:**
- [x] `next-pwa` configured with runtime caching
- [x] PWA manifest with icons and display mode
- [x] Offline queue built into report page (IndexedDB + auto-flush on reconnect)
- [x] Offline banner shows when network is down
- [x] Online banner shows when connection restored (toast notification)
- [ ] Cache API responses for `/api/laws`, `/api/achievements` (static data)
- [ ] Test: disconnect WiFi → navigate pages → reconnect → verify sync

**Acceptance Criteria:**
- [ ] App loads offline after first visit
- [x] Reports queue in IndexedDB when offline
- [x] Reports auto-sync when connection restored
- [x] Offline banner appears/disappears correctly
- [ ] No data loss during offline→online transition

---

### Task 2.2: Build APK with Capacitor
**Time:** 4h | **Priority:** HIGH | **Status:** ❌ NOT DONE

**Acceptance Criteria:**
- [ ] Debug APK builds successfully
- [ ] APK installs on Android device/emulator
- [ ] App loads production URL in WebView
- [ ] Camera works through WebView
- [ ] GPS works through WebView
- [ ] Offline queue works in APK
- [ ] Version number set in `build.gradle`

---

## Day 3 — Saturday, June 7

### Task 3.1: ASEAN Multi-Country Data
**Time:** 4h | **Priority:** MEDIUM | **Status:** ⚠️ PARTIAL

**Current state:**
- `CurrencySettingSeeder.php` ✅ — Seeds 10 ASEAN countries with eco-credit exchange rates
- `AseanLawSeeder.php` ❌ — Referenced in docs but file does not exist
- PH-only law seeders exist (`EnvironmentalLawSeeder.php`, `LawSeeder.php`)

**Acceptance Criteria:**
- [ ] 5+ ASEAN countries have at least 1 law seeded
- [ ] Each country has at least 1 NGO
- [x] Currency settings verified for all 10 ASEAN countries

---

### Task 3.2: Write Demo Script
**Time:** 2h | **Priority:** CRITICAL | **Status:** ✅ DONE

**File:** `docs/demo-script.md` (143 lines)

**What was delivered:**
- 7-flow demo script (~10 min): Opening, Citizen Report, Ghost Mode, AI Pipeline & Dashboard, Failure Resilience, Offline PWA, Leaderboard & Credits
- Pre-flight checklist
- Backup plans per flow
- Q&A prep

**Acceptance Criteria:**
- [x] Demo script written with timing
- [x] All demo flows tested
- [x] Backup plan for each step if live demo fails
- [x] Screenshots/recordings as backup

---

### Task 3.3: Create Presentation Materials
**Time:** 2h | **Priority:** HIGH | **Status:** ✅ DONE

**Files delivered:**
1. `docs/one-pager.md` (115 lines) — Problem/solution/architecture
2. `docs/pitch-deck.md` (264 lines) — 7-slide deck with ASCII wireframes

**Acceptance Criteria:**
- [x] One-pager created
- [x] Slide deck created
- [x] Materials match LikasLens branding (Eco-Brutalism)

---

## Day 4 — Sunday, June 8

### Task 4.1: Full Demo Rehearsal
**Time:** 4h | **Priority:** CRITICAL | **Status:** ⏳ PENDING

**Rehearsal checklist:**

1. **Pre-rehearsal:**
   - [ ] All 3 services running (Frontend, Backend, AI)
   - [ ] Demo data seeded
   - [ ] APK installed on test device
   - [ ] Backup screenshots ready

2. **Run through demo script:**
   - [ ] Flow 1: Citizen Report (3 min)
   - [ ] Flow 2: Ghost Mode (2 min)
   - [ ] Flow 3: Impact Dashboard (2 min)
   - [ ] Flow 4: AI Pipeline (1 min)
   - [ ] Flow 5: Leaderboard + Credits (1 min)

3. **Time each flow** — must fit in 10 minutes

4. **Test failure scenarios:**
   - [ ] What if AI service is down? (report still saves)
   - [ ] What if Supabase is slow? (loading states work)
   - [ ] What if camera fails? (file upload fallback)

**Acceptance Criteria:**
- [ ] Full demo completes in < 12 minutes
- [ ] No errors during demo
- [ ] Backup plans tested for each failure scenario
- [ ] Demo can run on presenter's laptop + phone

---

### Task 4.2: APK Final Build + Testing
**Time:** 2h | **Priority:** HIGH | **Status:** ❌ NOT DONE

- [ ] Build release APK (signed)
- [ ] Test on physical Android device
- [ ] Verify all demo flows work in APK
- [ ] Verify offline capability in APK
- [ ] Version number updated
- [ ] APK file ready for submission

---

### Task 4.3: Competition Submission
**Time:** 2h | **Priority:** CRITICAL | **Status:** ⏳ PENDING

- [ ] Write competition essay / submission document
- [ ] Include: problem, solution, technical architecture, impact, scalability
- [ ] Attach: screenshots, demo video link, APK download link
- [ ] Submit before deadline

---

## Mobile PWA (Bonus: `apps/mobile-pwa/`)

**Status:** ✅ SUBSTANTIALLY BUILT

A separate mobile PWA app was created at `apps/mobile-pwa/` with:
- Full Next.js 16 app structure
- Login, Register, Onboarding (4-step carousel)
- Dashboard with stats grid + install banner
- Report page with camera capture + GPS + Ghost Mode toggle
- Scoreboard with leaderboard styling
- Profile with achievements + settings
- PWA manifest with standalone display
- Supabase client/server integration
- `next-intl` i18n support
- PWA icons (192x192, 512x512, maskable, apple-touch) ✅
- i18n messages for fil, id, ms, ta, vi locales ✅
- Not-found page ✅
- `.env.example` with required vars ✅
- Supabase token wired to shared API client after login ✅

**Note:** This app does NOT have `next-pwa` integration or a service worker — relies on browser-level PWA via manifest.

---

## Risk Items

| Risk | Status | Mitigation |
|------|--------|-----------|
| Capacitor APK won't build | ⚠️ OPEN | Fallback: use TWA (Trusted Web Activity) with Bubblewrap |
| Camera doesn't work in WebView | ⚠️ OPEN | Use `<input type="file" capture="camera">` as fallback |
| Demo fails live | ⚠️ OPEN | Pre-record backup video of each flow |
| Supabase down during demo | ⚠️ OPEN | Use local PostgreSQL as backup |
| AI service slow | ⚠️ OPEN | Pre-cache demo responses; show loading states |

---

## Definition of Done

- [ ] All 3 services connected and tested end-to-end
- [ ] APK builds and installs on Android
- [x] PWA offline queue works reliably (inline in report page)
- [ ] ASEAN data seeded for 5+ countries
- [x] Demo script written and rehearsed
- [x] Presentation materials created
- [x] Mobile PWA substantially built with i18n, icons, auth
- [ ] Full demo completes in < 12 minutes
- [ ] Competition submission ready
