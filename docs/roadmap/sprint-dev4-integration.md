# Developer 4 — Integration, PWA, APK & Demo Prep

> **Sprint:** ASEAN AI Hackathon Prep
> **Timeline:** June 5-8, 2026 (Thu-Sun)
> **Total Hours:** 32h
> **Focus:** E2E testing, PWA offline, APK build, ASEAN data, demo materials

---

## Dependencies on Other Developers

| Dependency | From | Needed By | Notes |
|------------|------|-----------|-------|
| Working backend | Dev 3 (Backend) | Thu evening | Need `/api/health` working for E2E tests |
| Working AI service | Dev 2 (AI) | Sat | Need triage pipeline for full demo rehearsal |
| Demo data seeded | Dev 3 (Backend) | Fri afternoon | Need tickets/users for demo scenarios |
| Polished UI | Dev 1 (Frontend) | Sat evening | Need impact dashboard and Ghost Mode for demo |

---

## Day 1 — Thursday, June 5

### Task 1.1: End-to-End Integration Testing
**Time:** 3h | **Priority:** HIGH

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
**Time:** 5h | **Priority:** HIGH

**Goal:** Convert Next.js PWA into an Android APK using Capacitor.

**Steps:**

1. **Install Capacitor in frontend:**
   ```bash
   pnpm --filter frontend add @capacitor/core @capacitor/cli @capacitor/android
   ```

2. **Initialize Capacitor:**
   ```bash
   cd apps/frontend
   npx cap init likaslens com.likaslens.app --web-dir=out
   ```

3. **Configure `capacitor.config.ts`:**
   ```typescript
   import { CapacitorConfig } from '@capacitor/cli';

   const config: CapacitorConfig = {
     appId: 'com.likaslens.app',
     appName: 'LikasLens',
     webDir: 'out',
     server: {
       androidScheme: 'https',
       url: 'https://likaslens.vercel.app', // Production URL for web content
       cleartext: true,
     },
     plugins: {
       SplashScreen: {
         launchShowDuration: 2000,
         backgroundColor: '#1B4332',
         showSpinner: false,
       },
     },
   };

   export default config;
   ```

4. **Add Android platform:**
   ```bash
   npx cap add android
   ```

5. **Build and sync:**
   ```bash
   pnpm --filter frontend build
   npx cap sync android
   ```

6. **Open in Android Studio:**
   ```bash
   npx cap open android
   ```

**Acceptance Criteria:**
- [ ] Capacitor initialized in frontend project
- [ ] Android platform added
- [ ] `npx cap sync` runs without errors
- [ ] Android Studio opens the project
- [ ] App builds in Android Studio (debug APK)

---

## Day 2 — Friday, June 6

### Task 2.1: PWA Offline Polish
**Time:** 4h | **Priority:** HIGH

**Files to modify:**
- `apps/frontend/next.config.ts` (PWA config)
- `apps/frontend/public/sw.js` (if custom service worker)
- `apps/frontend/src/components/layout/OfflineBanner.tsx`

**Enhancements:**
- [ ] Verify service worker caches critical assets (CSS, JS, images)
- [ ] Test offline report queue: submit report offline → go online → auto-sync
- [ ] Offline banner shows when network is down
- [ ] Online banner shows when connection restored
- [ ] Cache API responses for `/api/laws`, `/api/achievements` (static data)
- [ ] Test: disconnect WiFi → navigate pages → reconnect → verify sync

**Cache Strategy:**
```
Static assets: Cache-first (CSS, JS, fonts, images)
API static data: Stale-while-revalidate (laws, achievements)
API dynamic data: Network-first (tickets, profile)
Report submission: Queue in IndexedDB, flush on reconnect
```

**Acceptance Criteria:**
- [ ] App loads offline after first visit
- [ ] Reports queue in IndexedDB when offline
- [ ] Reports auto-sync when connection restored
- [ ] Offline banner appears/disappears correctly
- [ ] No data loss during offline→online transition

---

### Task 2.2: Build APK with Capacitor
**Time:** 4h | **Priority:** HIGH

**Steps:**

1. **Configure Android project:**
   - Set `minSdkVersion` to 22 (Android 5.1+)
   - Set `targetSdkVersion` to 34 (Android 14)
   - Add internet permission in `AndroidManifest.xml`
   - Configure app icon and splash screen

2. **Generate signing key:**
   ```bash
   keytool -genkey -v -keystore likaslens.keystore -alias likaslens -keyalg RSA -keysize 2048 -validity 10000
   ```

3. **Build debug APK:**
   ```bash
   cd apps/frontend
   npx cap sync android
   cd android
   ./gradlew assembleDebug
   ```

4. **Test APK on device/emulator:**
   - Install: `adb install app/build/outputs/apk/debug/app-debug.apk`
   - Test all critical flows
   - Verify offline capability
   - Check camera access
   - Verify GPS works

5. **Version control setup:**
   - Add `android/` to `.gitignore` (or track selectively)
   - Create release branch: `release/apk-v1.0.0`
   - Tag release: `git tag apk-v1.0.0`

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
**Time:** 4h | **Priority:** MEDIUM

**Add placeholder data for ASEAN countries:**

**Create:** `apps/backend/database/seeders/AseanLawSeeder.php`

| Country | Code | Key Environmental Law | Agency |
|---------|------|----------------------|--------|
| Indonesia | ID | UU No. 32/2009 (Environmental Protection) | KLHK |
| Thailand | TH | Environmental Protection Act BE 2535 | DPC |
| Vietnam | VN | Law on Environmental Protection 2020 | MONRE |
| Malaysia | MY | Environmental Quality Act 1974 | DOE |
| Singapore | SG | Environmental Protection and Management Act | NEA |
| Philippines | PH | (Already seeded) | DENR |

**Also seed:**
- Currency exchange rates (already in `CurrencySettingSeeder`)
- Placeholder NGOs for each country (1-2 per country)
- Jurisdiction vertices in Gremlin (ID-NATIONAL, TH-NATIONAL, etc.)

**Acceptance Criteria:**
- [ ] 5+ ASEAN countries have at least 1 law seeded
- [ ] Each country has at least 1 NGO
- [ ] Gremlin graph has jurisdiction vertices for each country
- [ ] Currency settings verified for all 10 ASEAN countries

---

### Task 3.2: Write Demo Script
**Time:** 2h | **Priority:** CRITICAL

**Create:** `docs/demo-script.md`

**Demo Flow (10 minutes):**

1. **Opening (1 min)**
   - LikasLens tagline: "Every citizen's phone is an environmental sensor"
   - Show landing page with ASEAN positioning

2. **Citizen Report Flow (3 min)**
   - Open `/report` page
   - Camera captures photo of "environmental hazard"
   - GPS acquired (show map pin)
   - Select incident type (Illegal Logging)
   - Triage pre-check runs
   - Edge Interceptor modal appears (high-risk detected)
   - Recommend Ghost Mode
   - Submit report

3. **Ghost Mode Demo (2 min)**
   - Toggle Ghost Mode
   - Theme transitions to dark
   - EXIF stripped toast appears
   - Submit anonymous report
   - Show no user info in response

4. **Impact Dashboard (2 min)**
   - Navigate to Impact Dashboard
   - Show resolution rate chart
   - Show geographic heat map
   - Point out environmental hotspots

5. **AI Pipeline (1 min)**
   - Show YOLOv8 detection results
   - Show Gremlin graph traversal (hazard → law → agency)
   - Show Gemini incident summary

6. **Closing (1 min)**
   - Show leaderboard (top eco-citizens)
   - Show eco-credit wallet
   - ASEAN scalability message

**Acceptance Criteria:**
- [ ] Demo script written with timing
- [ ] All demo flows tested
- [ ] Backup plan for each step if live demo fails
- [ ] Screenshots/recordings as backup

---

### Task 3.3: Create Presentation Materials
**Time:** 2h | **Priority:** HIGH

**Create:**
1. **One-pager PDF** — LikasLens overview for judges
   - Problem statement
   - Solution architecture
   - Neuro-symbolic AI explanation
   - Impact metrics
   - ASEAN scalability

2. **Slide deck (optional)** — 5-7 slides
   - Slide 1: Title + tagline
   - Slide 2: Problem (environmental crimes in ASEAN)
   - Slide 3: Solution (LikasLens architecture)
   - Slide 4: AI Pipeline (neuro-symbolic)
   - Slide 5: Ghost Mode (safety innovation)
   - Slide 6: Impact & Scalability
   - Slide 7: Ask / Next steps

**Acceptance Criteria:**
- [ ] One-pager created
- [ ] Slide deck created (if needed)
- [ ] Materials match LikasLens branding (Eco-Brutalism)

---

## Day 4 — Sunday, June 8

### Task 4.1: Full Demo Rehearsal
**Time:** 4h | **Priority:** CRITICAL

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
**Time:** 2h | **Priority:** HIGH

- [ ] Build release APK (signed)
- [ ] Test on physical Android device
- [ ] Verify all demo flows work in APK
- [ ] Verify offline capability in APK
- [ ] Version number updated
- [ ] APK file ready for submission

---

### Task 4.3: Competition Submission
**Time:** 2h | **Priority:** CRITICAL

- [ ] Write competition essay / submission document
- [ ] Include: problem, solution, technical architecture, impact, scalability
- [ ] Attach: screenshots, demo video link, APK download link
- [ ] Submit before deadline

---

## Risk Items

| Risk | Mitigation |
|------|-----------|
| Capacitor APK won't build | Fallback: use TWA (Trusted Web Activity) with Bubblewrap |
| Camera doesn't work in WebView | Use `<input type="file" capture="camera">` as fallback |
| Demo fails live | Pre-record backup video of each flow |
| Supabase down during demo | Use local PostgreSQL as backup |
| AI service slow | Pre-cache demo responses; show loading states |

---

## Definition of Done

- [ ] All 3 services connected and tested end-to-end
- [ ] APK builds and installs on Android
- [ ] PWA offline queue works reliably
- [ ] ASEAN data seeded for 5+ countries
- [ ] Demo script written and rehearsed
- [ ] Presentation materials created
- [ ] Full demo completes in < 12 minutes
- [ ] Competition submission ready
