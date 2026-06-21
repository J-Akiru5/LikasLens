# 🌴 LIKASLENS — Mobile-First UI/UX Redesign (2026 Industry Standard)

> Use this prompt with any AI coding agent to completely overhaul the mobile experience.
> This is a `pnpm` monorepo with Next.js 16 (App Router), Tailwind CSS v4, TypeScript, and a shared component library.
> **CRITICAL: DO NOT commit or push any changes. Keep all changes in the working tree only.**

---

## ⚠️ ARCHITECTURE RULES (Must Follow)

1. **DO NOT commit or push.** Keep all changes local/unstaged. The user will test first.
2. **pnpm workspace only.** Use `pnpm --filter <app> add <pkg>` for deps. Never `npm install` or `yarn add`.
3. **DO NOT touch desktop layouts.** All mobile fixes use `sm:` (640px) breakpoint or below. Desktop (lg: 1024px+) stays exactly as-is.
4. **Three Next.js apps** share components from `apps/shared/src/ui/`:
   - `apps/frontend` — public website + citizen dashboard (port 3000)
   - `apps/mobile-pwa` — installable PWA (separate port)
   - `apps/admin-portal` — admin dashboard (separate port)
5. **CSS design tokens** in `apps/shared/src/styles/design-tokens.css`. Bento-grid classes (`.span-3`, `.span-6`, etc.) defined there.
6. **Run dev server:** `pnpm --filter frontend dev` (port 3000). Hard refresh (Ctrl+F5) after changes.
7. **After making changes**, run: `pnpm --filter @likaslens/shared typecheck && cd apps/frontend && npx tsc --noEmit --pretty`

---

## 🎯 CORE MISSION

Redesign EVERY page's mobile experience (< 768px / 375px iPhone SE) to be **industry-leading 2026 mobile-first**:
- Everything looks intentional, polished, and dense — no sparse layouts
- **NO horizontal scrolling** on any page — fix overflow at all costs
- Cards show **3 per row on mobile** whenever possible (minimum 2)
- Touch targets minimum 44x44px (use `p-2.5` or larger for interactive elements)
- Typography optimized for mobile: smaller heading sizes, readable body text
- Padding/margins tight enough for small screens but not cramped
- ALL controls (hamburger, ghost toggle, notifications) fully visible and tappable
- Loading skeletons also responsive (match their real content grids)

---

## 📱 SECTION 1: MOBILE HEADER SYSTEM (Highest Priority)

### Files:
- `apps/shared/src/ui/mobile-header.tsx` — **NEW file, create this**
- `apps/shared/src/ui/app-header.tsx` — Modify
- `apps/shared/src/ui/dashboard-layout.tsx` — Modify
- `apps/shared/src/ui/index.ts` — Export MobileHeader

### What to build:

**1. Create `MobileHeader` (new component, shared):**
- Shows on `<1024px` screens only (use `lg:hidden`)
- **Left side:** Hamburger icon (`Menu` from lucide-react, `w-5 h-5`) on a tappable button (`p-2.5 rounded-xl`) + "LIKΛSLENS" brand name in bold
- **Right side:** Ghost mode toggle button (icon-only, `Fingerprint` or `Moon` icon) + Notifications bell with red badge count
- All touch targets at least 44px
- Height: `h-14` (56px)
- Sticky top with `z-30`, background same as page
- Receives props: `isGhostMode`, `onThemeToggle`, `notifications`, `onMobileMenuToggle`

**2. Modify `AppHeader`:**
- On mobile (<1024px): only shows page title/greeting as a secondary bar, compact height
- On mobile: height `h-14` (56px) with `text-base` title
- On desktop (>=1024px): keeps existing height `h-20` with full controls
- The controls div (ghost toggle, notifications, theme toggle) wrapped in `hidden lg:flex`
- Passed `showBranding={false}` from DashboardLayout since MobileHeader handles branding

**3. Modify `DashboardLayout`:**
- Add `<MobileHeader>` BEFORE `<AppHeader>` in the flex column
- Pass `showBranding={false}` to `<AppHeader>`
- MobileHeader handles the `onMobileMenuToggle` callback to open sidebar

**4. Standalone pages** (contact, privacy, terms) that use `<AppHeader />` directly:
- These don't need MobileHeader — AppHeader defaults work fine without controls

---

## 📱 SECTION 2: CITIZEN DASHBOARD (The Most Broken Page)

### File: `apps/frontend/src/app/[locale]/dashboard/citizen-dashboard-client.tsx`

### Issues:
- `px-2` is only 8px padding — way too tight
- Tracking section grid `grid-cols-2 lg:grid-cols-3 gap-6` has too much gap on mobile
- Search input and dropdown take too much vertical space on mobile
- Tabs in filter bar need to scroll horizontally on small screens

### Fixes:
1. **Container padding:** `px-2 md:px-6` → `px-4 sm:px-6`
2. **Tracking grid:** `grid-cols-2 lg:grid-cols-3 gap-6` → `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6`
   - Stacks to 1 column on mobile (the "Recent Activity" and "Top Contributors" are too narrow side-by-side)
3. **Filter bar:** On mobile (`flex-col md:flex-row`), reduce gap between tabs and search
4. **Tab bar:** Add `overflow-x-auto` for the 3 tabs (All Reports, Resolved, Pending)
5. **Search input:** On mobile, `w-full` (already fine)
6. **Dropdown on mobile:** `w-full` instead of `w-48`
7. **"Submit Report" button:** Keep compact, no full-width on mobile

---

## 📱 SECTION 3: STATS CARDS — 3 PER ROW

### File: `apps/shared/src/ui/stats-cards.tsx`
### Used by: Citizen dashboard, admin dashboard, impact page

### Current: `grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-4`
### Required: `grid grid-cols-3 gap-3 md:grid-cols-3 lg:grid-cols-4`

- 3 cards per row on mobile (even if last row has 1 card)
- Tighter gap on mobile: `gap-3` instead of `gap-4`
- Cards should use compact padding on mobile (`p-3 sm:p-4`)
- Card values smaller on mobile (`text-2xl sm:text-3xl`)
- Sparkline/hidden on mobile or compact

---

## 📱 SECTION 4: SCOREBOARD PAGE

### File: `apps/frontend/src/app/[locale]/scoreboard/page.tsx`

### Issues: Tab bar overflows, table columns too wide on mobile

### Fixes (already partially done, verify all):
1. **Tab bar wrapper:** Must have `overflow-x-auto` (already applied)
2. **Tab buttons:** Smaller padding on mobile (`px-3 py-1.5` instead of `px-4 py-2`)
3. **Citizen leaderboard rows:** 
   - Header: `hidden sm:grid` (hidden on mobile)
   - Row grid: `grid-cols-[28px_1fr_50px_50px] sm:grid-cols-[60px_1fr_1fr_1fr] gap-1.5 sm:gap-4 px-3 sm:px-6`
4. **Barangay leaderboard rows:**
   - Row grid: `grid-cols-[28px_1fr_50px] sm:grid-cols-[60px_1fr_1fr] gap-1.5 sm:gap-4 px-3 sm:px-6`
5. **Font sizes:** `text-xs sm:text-sm` for data, `text-[9px] sm:text-[10px]` for headers
6. **Padding:** `py-3 sm:py-4` on rows

---

## 📱 SECTION 5: LAWS PAGE (frontend)

### File: `apps/frontend/src/app/[locale]/laws/page.tsx`

### Issue: Cards show 1 per row on mobile

### Current: `grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3`
### Verify: `grid gap-3 sm:gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3`

- Card padding: `p-4 sm:p-6` on mobile
- Title: `text-base sm:text-lg` on mobile
- Loading skeleton grid must match: `grid-cols-2 sm:grid-cols-2 lg:grid-cols-3`

---

## 📱 SECTION 6: PROFILE PAGE

### File: `apps/frontend/src/app/[locale]/profile/page.tsx`

### Issues: Stats, achievements, and settings grids sparse on mobile

### Fixes:
1. **Stats grid** (Filed, Verified, Badges): `grid grid-cols-3 gap-2` — 3 per row, fine
2. **Achievements grid:** `grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5` — 2 per row mobile, ok
3. **Settings grid:** `grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8` — 2 per row mobile, ok
4. **Score sources:** `grid grid-cols-1 md:grid-cols-2` — stacks on mobile, fine
5. **Profile header:** `flex flex-col md:flex-row` — stacks on mobile, fine
6. **Filter tabs:** `overflow-x-auto` on the filter container
7. **Achievement filter bar:** `flex-col xl:flex-row` must stack on mobile

---

## 📱 SECTION 7: REPORT PAGE

### File: `apps/frontend/src/app/[locale]/report/page.tsx`

### Issues:
- Coordinate inputs and buttons need proper mobile sizing

### Verify:
1. **Coordinate inputs:** `grid grid-cols-2 sm:grid-cols-2 gap-4` — ok, side by side on mobile
2. **Action buttons:** `grid grid-cols-2 sm:grid-cols-2 gap-4` — ok
3. **Incident type + description:** Full width on mobile, fine
4. **Ghost mode toggle:** Block layout, fine
5. **Camera section:** Full width, fine
6. **Title:** `text-3xl sm:text-4xl` — ok

---

## 📱 SECTION 8: LANDING PAGE SECTIONS

### Files:
- `apps/frontend/src/components/marketing/sections/hero-section.tsx`
- `apps/shared/src/ui/public-scoreboard.tsx`
- `apps/frontend/src/components/marketing/sections/impact-section.tsx`

### Fixes:
1. **Hero nav:** Reduce horizontal padding on mobile from 40px to 16-20px
2. **PublicScoreboard:** Responsive grid columns `[1.5fr_1.5fr_1fr_1fr]` on mobile, `[2fr_2fr_1fr_1fr]` on sm+
3. **Impact section top barangays:** `grid-cols-2` base (not `grid-cols-1`)

---

## 📱 SECTION 9: FRONTEND INCIDENTS PAGE

### File: `apps/frontend/src/app/[locale]/dashboard/incidents/page.tsx`

### Card grid: `grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6`
- **Already 2 per row on mobile** — good
- But card `p-6` is generous on mobile, change to `p-4 sm:p-6`
- Card title `text-[17px]` → `text-[15px] sm:text-[17px]`

---

## 📱 SECTION 10: FRONTEND REPORTS PAGE (Analytics)

### File: `apps/frontend/src/app/[locale]/dashboard/reports/page.tsx`

### Metric cards (span-3 in bento-grid):
- Values: `text-4xl sm:text-5xl` → `text-3xl sm:text-5xl` on mobile
- Card padding: `p-5 sm:p-6`
- Charts section `span-6` in bento-grid — ok, full width on mobile
- Loading skeleton: `grid-cols-2 md:grid-cols-4` for metrics — 2 per row, good

---

## 📱 SECTION 11: FRONTEND IMPACT PAGE

### File: `apps/frontend/src/app/[locale]/dashboard/impact/page.tsx`

### Most sections already use `md:` breakpoints:
- KPI Metrics: `grid-cols-2 md:grid-cols-4 gap-4` — 2 per row mobile, good
- Cost at scale: `grid-cols-2 md:grid-cols-4 gap-4` — 2 per row mobile, good
- ROI comparison: `grid md:grid-cols-2 gap-4` — stacks on mobile, fine
- Architecture: `grid md:grid-cols-2 gap-4` — stacks on mobile, fine
- AI Pipeline: `flex flex-col md:flex-row` — stacks on mobile, fine
- Loading skeleton: `grid-cols-2 md:grid-cols-4` — 2 per row mobile, good

### Minor fixes:
- All "panel p-6" should be "p-4 sm:p-6" on mobile
- Bento-grid on mobile already stacks to full width (`.span-12`, `.span-8`, `.span-4`) — verify this works

---

## 📱 SECTION 12: FRONTEND MAP PAGE

### File: `apps/frontend/src/app/[locale]/dashboard/map/page.tsx`

- Simple layout with HeatmapMap component
- Header icon + title stack fine on mobile
- No grid changes needed

---

## 📱 SECTION 13: FRONTEND SETTINGS PAGE

### File: `apps/frontend/src/app/[locale]/dashboard/settings/page.tsx`

- Tab-based navigation with `overflow-x-auto` — fine
- `max-w-4xl mx-auto` — fine on mobile
- Content forms stack naturally — fine
- Profile photo + info grid: some minor padding adjustments may help

---

## 📱 SECTION 14: ADMIN PORTAL — DASHBOARD PAGE

### File: `apps/admin-portal/src/app/[locale]/(dashboard)/dashboard/page.tsx`

### Current issues: KPI grid too sparse on mobile

### Fixes:
1. **KPI cards grid:** Not hardcoded, but verify layout is dense on mobile
2. **Activity feed + tickets:** Already side by side on desktop, stack on mobile via `lg:grid-cols-2`
3. If there's a bento-grid with span classes, verify they stack properly on mobile

---

## 📱 SECTION 15: ADMIN PORTAL — ALL SUB-PAGES

### Files in `apps/admin-portal/src/app/[locale]/(dashboard)/`:
- `analytics/page.tsx` 
- `users/page.tsx`
- `settings/page.tsx`
- `laws/page.tsx`
- `ngos/page.tsx`
- `rewards/page.tsx`
- `triage/page.tsx`
- `lgu-performance/page.tsx`
- `tickets/page.tsx`
- `predictions/page.tsx`
- `audit-logs/page.tsx`
- `inquiries/page.tsx`
- `changelog/page.tsx`

### Common patterns to check and fix:

**Grid patterns used across admin pages:**
- `grid-cols-2 sm:grid-cols-2 lg:grid-cols-3` — used by laws, ngos, rewards pages. Already 2 per row mobile, good.
- `grid-cols-2 sm:grid-cols-3 gap-4` — used by analytics KPI cards, settings tabs. Already 2 per row mobile, good.
- `grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6` — used by tickets page. Already 2 per row mobile, good.
- `grid-cols-12` — used by users table. Has `hidden sm:grid` for header, fine.

**Specific fixes for each admin page:**

1. **analytics/page.tsx:**
   - KPI cards: `grid-cols-2 sm:grid-cols-3 gap-4` — 2 per row mobile, good
   - Charts: `grid gap-8 lg:grid-cols-2` — stacks on mobile, fine
   - Loading skeleton: use `AdminKPIsSkeleton` — verify it's responsive

2. **users/page.tsx:**
   - Table rows: `grid grid-cols-12 gap-2` with `hidden sm:block` for columns on mobile
   - On mobile: shows 4 items (checkbox, name, role, actions) — the grid-cols-12 with specific spans handles this
   - Email hidden on mobile via `hidden sm:block`
   - Trust score hidden on mobile via `hidden sm:block`
   - Search + dropdown: `flex-col gap-4 sm:flex-row` — stacks on mobile, fine
   - No changes needed — already handles mobile well

3. **settings/page.tsx:**
   - Tab cards: `grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4` — 2 per row mobile, good
   - Forms stack naturally — fine

4. **laws/page.tsx:**
   - Card grid: `grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4` — 2 per row mobile, good
   - Card padding: check if `p-6` could be `p-4 sm:p-6`
   - Loading skeleton: uses `AdminTableSkeleton` — fine

5. **ngos/page.tsx:**
   - Card grid: `grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4` — 2 per row mobile, good
   - Card padding: check for `p-6` → `p-4 sm:p-6`
   - Form grid on mobile: `grid gap-4 sm:grid-cols-2` — stacks on mobile, fine
   - Loading skeleton: `AdminCardGridSkeleton` — fine

6. **rewards/page.tsx:**
   - Card grid: `grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4` — 2 per row mobile, good
   - Card padding: check for `p-6` → `p-4 sm:p-6`

7. **triage/page.tsx:**
   - List layout (not grid), stacks naturally — fine
   - Photo thumbnail on mobile: `w-20 h-20 sm:w-24 sm:h-24` — good
   - Action buttons: verify they don't overflow on small screens

8. **lgu-performance/page.tsx:**
   - Table with `overflow-x-auto` — fine
   - KPI cards: `grid-cols-2 sm:grid-cols-3 gap-4` — 2 per row mobile, good
   - Platform benchmarks: `grid gap-4 sm:grid-cols-4` — stacks on mobile, fine

9. **tickets/page.tsx:**
   - Card grid: `grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6` — 2 per row mobile, good
   - Card padding: `p-6` → `p-4 sm:p-6`
   - Card title: verify text size on mobile
   - Search + dropdown: `flex-col gap-4 sm:flex-row` — stacks on mobile, fine

10. **predictions/page.tsx:**
    - KPI cards: `grid-cols-2 sm:grid-cols-3 gap-4` — 2 per row mobile, good
    - Main grid: `grid gap-6 lg:grid-cols-5` — stacks on mobile, fine
    - Prediction cards: `grid-cols-2 gap-3` for the metrics inside each card — 2 per row, fine

### ALL admin page fixes:
- Reduce card padding from `p-6` to `p-4 sm:p-6` where applicable
- Reduce title sizes from `text-4xl md:text-5xl` to `text-3xl sm:text-4xl md:text-5xl`
- Ensure all button groups wrap properly on mobile
- Verify no `overflow-x-auto` is missing on table-like layouts

---

## 📱 SECTION 16: MOBILE PWA PAGES

### Files in `apps/mobile-pwa/src/app/[locale]/(app)/`:
- `dashboard/page.tsx` — Already mobile-first PWA, well optimized
- `scoreboard/page.tsx` — Already mobile-first
- `wallet/page.tsx` — Already mobile-first
- `analytics/page.tsx` — Already mobile-first

### The mobile PWA is already largely mobile-first — verify:
- `grid-cols-3 gap-3` patterns are already 3 per row — good
- Touch targets are adequate
- No horizontal scroll on any page
- Bottom nav is well-spaced (check on 375px viewport)

---

## 📱 SECTION 17: LOADING STATES & SKELETONS

### Files to check:
- `apps/shared/src/ui/skeleton.tsx` — Dashboard Loading, AdminTableSkeleton, etc.
- All `loading.tsx` files in `apps/frontend/src/app/[locale]/` directories

### Fixes:
1. **DashboardSkeleton** in `shared/src/ui/skeleton.tsx` — verify the grid matches real content
2. **AdminKPIsSkeleton** — verify responsive
3. **AdminCardGridSkeleton** — verify responsive
4. **ScoreboardSkeleton** — verify responsive columns
5. **All loading.tsx files** — check that their grid patterns match the real page content responsiveness

---

## 🧪 AFTER MAKING CHANGES — TESTING CHECKLIST

1. **Typecheck:** `pnpm --filter @likaslens/shared typecheck && cd apps/frontend && npx tsc --noEmit --pretty`
2. **Admin portal typecheck:** `cd apps/admin-portal && npx tsc --noEmit --pretty | head -20`
3. **Start dev server:** `pnpm --filter frontend dev`
4. **Hard refresh browser** (Ctrl+F5 / Cmd+Shift+R)
5. **Test on 375px iPhone SE viewport** (Chrome DevTools device mode):
   - All pages: no horizontal scroll
   - All pages: cards show 2-3 per row
   - MobileHeader: hamburger + brand + ghost + notifications all visible
   - AppHeader: readable title below MobileHeader
   - Scoreboard: tabs scroll, table rows don't overflow
   - Dashboard: StatsCards 3 per row
   - Profile: stats, achievements, settings grids dense
6. **Test on 1024px iPad:** layout transitions gracefully
7. **Test on 1440px desktop:** everything looks exactly as before (NO desktop regressions)
8. **Check console:** no errors

---

## 🔧 QUICK REFERENCE — Tailwind Breakpoints

| Breakpoint | Min Width | Device |
|-----------|-----------|--------|
| Default | 0 | Mobile phones |
| `sm:` | 640px | Large phones / small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Desktops / landscape tablets |

**Mobile-first principle:** Always start with mobile layout (no breakpoint), then add `sm:`, `md:`, `lg:` for larger screens.

---

## ✅ SUCCESS CRITERIA (Check Each)

- [ ] On 375px iPhone SE: NO horizontal scroll on any page
- [ ] On 375px: Header shows hamburger + brand + ghost toggle + notifications all visible
- [ ] On 375px: StatsCards = 3 per row
- [ ] On 375px: Scoreboard tabs scroll, table rows fit
- [ ] On 375px: All card grids = 2-3 per row (not 1)
- [ ] On 375px: Touch targets >= 44px
- [ ] On 375px: Typography readable (no texts too small or too large)
- [ ] On 1024px: Layout transitions gracefully to tablet
- [ ] On 1440px: Desktop layout UNCHANGED — zero regressions
- [ ] No console errors
- [ ] All pages maintain their functionality
- [ ] All typechecks pass

---

## 📂 ALL KEY FILES INDEX

```
MOBILE HEADER SYSTEM:
  apps/shared/src/ui/mobile-header.tsx          ← NEW file to create
  apps/shared/src/ui/app-header.tsx             ← Modify
  apps/shared/src/ui/dashboard-layout.tsx        ← Modify
  apps/shared/src/ui/index.ts                   ← Export MobileHeader

SHARED COMPONENTS:
  apps/shared/src/ui/stats-cards.tsx             ← Grid: 3 per row mobile
  apps/shared/src/ui/public-scoreboard.tsx       ← Responsive columns
  apps/shared/src/ui/skeleton.tsx                ← Responsive skeletons
  apps/shared/src/styles/design-tokens.css       ← Design tokens + bento-grid

FRONTEND PAGES:
  apps/frontend/src/app/[locale]/dashboard/citizen-dashboard-client.tsx  ← THE KEY PAGE
  apps/frontend/src/app/[locale]/scoreboard/page.tsx                     ← Tab + table overflow
  apps/frontend/src/app/[locale]/laws/page.tsx                           ← 2 per row grid
  apps/frontend/src/app/[locale]/report/page.tsx                         ← Compact layouts
  apps/frontend/src/app/[locale]/profile/page.tsx                        ← Dense grids
  apps/frontend/src/app/[locale]/dashboard/incidents/page.tsx            ← Card grid + padding
  apps/frontend/src/app/[locale]/dashboard/reports/page.tsx              ← Metric sizes
  apps/frontend/src/app/[locale]/dashboard/impact/page.tsx               ← Panel padding
  apps/frontend/src/app/[locale]/dashboard/settings/page.tsx             ← Minor padding
  apps/frontend/src/app/[locale]/dashboard/map/page.tsx                  ← Simple layout
  apps/frontend/src/app/[locale]/dashboard/analytics/page.tsx            ← Simple layout

LANDING PAGE:
  apps/frontend/src/components/marketing/sections/hero-section.tsx       ← Nav padding
  apps/frontend/src/components/marketing/sections/impact-section.tsx     ← Barangay grid

ADMIN PORTAL PAGES:
  apps/admin-portal/src/app/[locale]/(dashboard)/dashboard/page.tsx      ← KPI layout
  apps/admin-portal/src/app/[locale]/(dashboard)/analytics/page.tsx
  apps/admin-portal/src/app/[locale]/(dashboard)/users/page.tsx
  apps/admin-portal/src/app/[locale]/(dashboard)/settings/page.tsx
  apps/admin-portal/src/app/[locale]/(dashboard)/laws/page.tsx           ← Card grid 2 per row
  apps/admin-portal/src/app/[locale]/(dashboard)/ngos/page.tsx           ← Card grid 2 per row
  apps/admin-portal/src/app/[locale]/(dashboard)/rewards/page.tsx        ← Card grid 2 per row
  apps/admin-portal/src/app/[locale]/(dashboard)/triage/page.tsx         ← List layout
  apps/admin-portal/src/app/[locale]/(dashboard)/lgu-performance/page.tsx ← Table
  apps/admin-portal/src/app/[locale]/(dashboard)/tickets/page.tsx        ← Card grid 2 per row
  apps/admin-portal/src/app/[locale]/(dashboard)/predictions/page.tsx    ← KPI + list

MOBILE PWA PAGES:
  apps/mobile-pwa/src/app/[locale]/(app)/dashboard/page.tsx
  apps/mobile-pwa/src/app/[locale]/(app)/scoreboard/page.tsx
  apps/mobile-pwa/src/app/[locale]/(app)/wallet/page.tsx
  apps/mobile-pwa/src/app/[locale]/(app)/analytics/page.tsx
```

---

## 📝 IMPORTANT NOTES

1. **Cards that are in a `grid-cols-2 sm:grid-cols-2 lg:grid-cols-3` pattern are already 2 per row on mobile**, which is fine. Only pages with `grid-cols-1` on mobile need fixing.
2. **The mobile PWA is already mobile-first** — its grid patterns like `grid-cols-3 gap-3` are correct. Just verify on 375px viewport that nothing breaks.
3. **Do NOT add MobileHeader to mobile-pwa** — the PWA has its own navigation system (bottom nav bar + MobileLayout).
4. **Admin portal pages with `grid-cols-2` on mobile are already acceptable** — they show 2 cards per row which is fine for data-dense admin panels.
5. **The MOST IMPORTANT pages to get right are:**
   - Citizen Dashboard (the user sees this first) — fix padding, tracking grid, filter layout
   - MobileHeader system — all controls visible
   - StatsCards — 3 per row
   - Scoreboard — no overflow
