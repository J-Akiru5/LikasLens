# Developer 1 — Design & Frontend

> **Sprint:** ASEAN AI Hackathon Prep
> **Timeline:** June 5-8, 2026 (Thu-Sun)
> **Total Hours:** 24h
> **Assigned To:** Lou (replacing Katherine)
> **Focus:** UI/UX polish, impact dashboard, Ghost Mode, mobile responsiveness

---

## Team Roster (Updated)

| Dev | Name | Role | Focus |
|-----|------|------|-------|
| Dev 1 | Lou | Frontend/UI | Next.js UI, Tailwind, responsive design, Ghost Mode theme |
| Dev 2 | Jeff | AI/Backend | FastAPI AI service, YOLOv8, Gremlin graph, Gemini |
| Dev 3 | Charlyn | Backend/Infrastructure | Laravel API, Supabase, CI/CD, admin portal |
| Dev 4 | Katherine | Integration/PWA/APK | E2E testing, PWA offline, Capacitor APK, demo prep |

> **Note:** Roseby is no longer on the team. Katherine moved from Dev 1 to Dev 4. Lou joined as Dev 1.

### Lou's Completed Work (from codebase evidence)
- ✅ Impact dashboard significantly expanded (`dashboard/impact/page.tsx` — 977+ lines with charts, stats, activity feed)
- ✅ Landing page updates (`page.tsx` — 88+ lines of changes)
- ✅ Register form improvements
- ✅ Sidebar refinements
- ✅ Theme provider updates
- ✅ Global CSS adjustments
- ✅ Changelog page with GitHub cat logo in footer (v0.6.x)
- ✅ Loading states for scoreboard, report, contact, laws, privacy pages (v0.7.2)
- ✅ Error boundary pages for all major routes (v0.7.2)
- ✅ Contact form page with API integration (v0.7.2)
- ✅ EXIF stripping utility + inline implementation in report page (v0.7.1)
- ✅ Offline queue built into report page (IndexedDB + auto-flush) (v0.7.2)
- ✅ Framer motion ease type fix on landing page
- ✅ Recharts type errors fix

---

## Dependencies on Other Developers

| Dependency | From | Needed By | Notes |
|------------|------|-----------|-------|
| Working API endpoints | Dev 3 (Charlyn) | Fri morning | Impact dashboard needs `/api/dashboard/stats` |
| Seeded demo data | Dev 3 (Charlyn) | Fri afternoon | Dashboard needs real tickets/users to display |
| Ghost Mode theme tokens | Already built | Thu | `data-theme="ghost"` CSS vars exist in `globals.css` |
| AI triage working | Dev 2 (Jeff) | Sat | Edge Interceptor modal needs triage responses |

---

## Day 1 — Thursday, June 5

### Task 1.1: Role-Aware Sidebar Rendering
**Time:** 3h | **Priority:** HIGH

**Problem:** The sidebar currently shows the same nav items for all users. Analyst and super_admin roles should see different navigation options.

**Files to modify:**
- `apps/frontend/src/components/layout/sidebar.tsx`
- `apps/shared/src/ui/` (any shared nav components)

**Acceptance Criteria:**
- [x] Citizen sees: Dashboard, Report, Scoreboard, Laws, Profile
- [x] Analyst sees: + Incidents, Towns Analytics
- [ ] Super Admin sees: + Users, NGOs, Laws Admin, Rewards, Audit Logs
- [x] Role fetched from `/api/user/profile` and cached
- [ ] Loading state while role is being fetched

**Implementation Notes:**
- Role is fetched from Supabase `user_metadata` via `getRole(user?.user_metadata)` (not from Laravel API)
- Stored in `useState`, not a context/zustand store
- Conditionally render nav items based on role
- Uses `lucide-react` icons matching existing icon patterns
- **Missing:** Laws Admin link for super_admin, loading skeleton while role fetches

---

### Task 1.2: Scoreboard Page Polish
**Time:** 3h | **Priority:** MEDIUM

**Files to modify:**
- `apps/frontend/src/app/[locale]/scoreboard/page.tsx`
- `apps/shared/src/ui/public-scoreboard.tsx`

**Acceptance Criteria:**
- [x] Top 3 ranked users have special visual treatment (gold/silver/bronze)
- [x] Rank #1 has amber glow: `shadow-[0_0_16px_rgba(255,183,3,0.12)]`
- [x] Eco-credit balance visible per user
- [ ] Mobile layout is responsive (single column on small screens)
- [x] Loading skeleton matches Civic Brutalism style
- [x] Empty state message when no data

**Design Reference:**
- Uses `font-heading font-black uppercase` for rank names
- Uses `font-data` for XP numbers
- Applies `brutal-panel` + `panel-surface` classes
- Hard shadows: `shadow-[4px_4px_0px_#1b4332]`

---

## Day 2 — Friday, June 6

### Task 2.1: Impact Dashboard Page
**Time:** 8h | **Priority:** HIGH

**New file:** `apps/frontend/src/app/[locale]/dashboard/impact/page.tsx`

**This is the centerpiece feature for the hackathon demo.**

**Data Sources (from Laravel API):**
- `GET /api/dashboard/stats` — total tickets, resolution rate, avg response time
- `GET /api/tickets` — all tickets with lat/lng for heat map
- `GET /api/leaderboard` — top reporters

**Dashboard Sections:**

#### Section A: Key Metrics (Top Row)
- Total Reports Submitted
- Reports Resolved (with % rate)
- Average Response Time (hours)
- Active Citizens (unique reporters)

**Component:** `StatsCards` from `apps/shared/src/ui/stats-cards.tsx`

#### Section B: Resolution Rate Chart
- Bar chart showing tickets by status (open, investigating, monitoring, resolved, closed)
- Use a lightweight chart library (recharts or chart.js)

#### Section C: Geographic Heat Map
- Leaflet map with markers for each ticket's lat/lng
- Cluster markers for dense areas
- Color-coded by urgency_score (1-5)
- **Reuse `GeoTagMap` component** from `apps/frontend/src/components/maps/`

#### Section D: AI Confidence Trends
- Line chart showing avg `ai_confidence` over time
- Grouped by week

#### Section E: Recent Activity Feed
- Last 10 tickets with status, type, location
- **Reuse `ActivityFeed`** from `apps/frontend/src/components/dashboard/`

**Acceptance Criteria:**
- [x] Page loads with real data from API
- [x] Stats cards show correct numbers
- [ ] Map renders with ticket markers (uses SVG ASEAN map instead of Leaflet)
- [x] Charts are responsive
- [x] Mobile layout stacks vertically
- [x] Loading states for each section
- [ ] Error states if API fails (falls back silently, no explicit error UI)

---

### Task 2.2: Install Chart Library
**Time:** 1h | **Priority:** HIGH

```bash
pnpm --filter frontend add recharts
```

**Status:** ✅ DONE — `recharts@^2.15.4` installed in `package.json`

---

## Day 3 — Saturday, June 7

### Task 3.1: Ghost Mode Enhancements
**Time:** 4h | **Priority:** HIGH

**Files to modify:**
- `apps/frontend/src/app/[locale]/report/page.tsx`
- `apps/frontend/src/components/modals/EdgeInterceptorModal.tsx`
- `apps/frontend/src/app/globals.css`

**Enhancements:**
- [ ] Ghost Mode toggle has animated transition (dark theme fade-in)
- [x] Edge Interceptor modal copy is clear and compelling for demo
- [ ] Ghost Mode status indicator (pulsing amber dot) in header when active
- [ ] EXIF stripping confirmation toast: "Metadata stripped for your safety"
- [x] Stealth theme: all UI elements switch to dark palette

**Ghost Mode CSS (already exists, verify):**
```css
[data-theme="ghost"] {
    --primary: #2DE1C2;
    --background: #081C15;
    --foreground: #F8F9FA;
    --panel: rgba(8, 28, 21, 0.9);
    --panel-border: rgba(45, 225, 194, 0.35);
}
```

**Additional completed work:**
- ✅ EXIF stripping now applied in all modes (not just Ghost Mode) — v0.7.1
- ✅ `exif-stripper.ts` utility exists at `apps/frontend/src/utils/exif-stripper.ts`

---

### Task 3.2: Mobile Responsiveness Audit
**Time:** 2h | **Priority:** MEDIUM

**Pages to audit:**
- `/report` — camera view, form fields, submit button
- `/dashboard` — stats cards, activity feed
- `/dashboard/impact` — new impact dashboard
- `/scoreboard` — rank cards
- `/laws` — law cards, search
- `/contact` — form layout

**Fixes:**
- [ ] All pages work at 375px width (iPhone SE) — unverifiable, needs runtime testing
- [ ] No horizontal scroll on any page — unverifiable
- [ ] Touch targets are minimum 44px — unverifiable
- [x] Bottom nav doesn't overlap content — pages use `pb-20 lg:pb-6`

---

## Day 4 — Sunday, June 8

### Task 4.1: Demo Script UI Flows
**Time:** 3h | **Priority:** HIGH

**Ensure these flows are demo-ready:**

**Flow 1: Citizen Report**
1. Landing page loads fast (< 2s)
2. Click "Report" → camera activates
3. Capture photo → GPS acquired
4. Select incident type → add description
5. Triage pre-check runs (Edge Interceptor if high-risk)
6. Submit → success animation
7. View in dashboard

**Flow 2: Ghost Mode**
1. Toggle Ghost Mode → theme transitions
2. Capture photo → EXIF stripped toast
3. Submit anonymously → confirmation
4. Verify no user info in response

**Flow 3: Impact Dashboard**
1. Navigate to Impact Dashboard
2. Show stats, map, charts
3. Point out resolution rate
4. Show geographic hotspots

**Acceptance Criteria:**
- [ ] All 3 flows complete without errors — unverifiable, needs runtime testing
- [ ] Each flow takes < 30 seconds — unverifiable
- [ ] UI looks polished at every step — unverifiable
- [ ] No console errors during demo — unverifiable

---

### Task 4.2: Final UI Fixes
**Time:** 1h | **Priority:** LOW

- Fix any visual glitches found during rehearsal
- Ensure consistent spacing across pages
- Verify all fonts load (Montserrat, Inter, Space Mono)
- Check dark mode (Ghost Mode) on all pages

---

## Risk Items

| Risk | Status | Mitigation |
|------|--------|-----------|
| Chart library SSR issues | ✅ Resolved | Uses direct imports in `"use client"` component |
| Map not rendering on mobile | ⚠️ Open | Uses SVG ASEAN map instead of Leaflet |
| API data not available | ✅ Resolved | Dev 3 seeded demo data (LikasLensSeeder) |
| Ghost Mode CSS conflicts | ✅ Resolved | Comprehensive `[data-theme="ghost"]` rules in globals.css |

---

## Definition of Done

- [x] Role-aware sidebar works for citizen/analyst/admin (missing Laws Admin for super_admin)
- [x] Impact dashboard shows real data with charts + map (SVG map, not Leaflet)
- [ ] Ghost Mode flow is polished and compelling (missing pulsing indicator + EXIF toast)
- [ ] All pages responsive at 375px — unverifiable
- [ ] All 3 demo flows complete without errors — unverifiable
- [ ] No console errors on any page — unverifiable
