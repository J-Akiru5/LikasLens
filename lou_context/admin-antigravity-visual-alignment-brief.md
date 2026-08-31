# Admin Portal Visual Alignment Brief

**Prepared for:** Antigravity / Gemini 3.7 Flash
**Date:** August 31, 2026
**Purpose:** Repository-grounded handoff for focused visual-system alignment

---

## 1. PROJECT CONTEXT

LikasLens is a civic environmental intelligence platform for the Philippines. It has two primary surfaces:

- **Public Frontend** (`apps/frontend`) — The citizen-facing environmental intelligence experience. Landing page, incident reporting, law database, public records, dashboards. Dark atmospheric/civic aesthetic.
- **Admin Portal** (`apps/admin-portal`) — The operational command center for analysts, NGO partners, and government agencies. Triage, ticket management, user management, analytics, audit logs. Functionally complete but visually disconnected.

Both share a component library (`apps/shared`) and a design token system (`design-tokens.css`). The tokens exist. The admin portal does not consistently use them.

**The task is not a redesign.** The task is to make the admin portal inherit the visual DNA of the public frontend while preserving all existing functionality, routing, RBAC, density, and operational usability.

---

## 2. VISUAL SOURCE OF TRUTH

The **public frontend** (`apps/frontend`) is the visual reference. Everything below is extracted from the actual repository.

### Files Antigravity Must Inspect

#### Frontend (Visual Reference)

| File | Purpose |
|------|---------|
| `apps/shared/src/styles/design-tokens.css` | **Single source of truth** — all CSS variables, theme system, utility classes (1231 lines) |
| `apps/frontend/src/app/globals.css` | Frontend CSS overrides — font overrides, ec-grid, ec-ledger, ec-scanline, ec-casefile (252 lines) |
| `apps/frontend/src/app/layout.tsx` | Root layout — font loading (Bricolage Grotesque, Public Sans, JetBrains Mono) |
| `apps/frontend/src/app/[locale]/HomeClient.tsx` | Landing page — hero, features, CTA, footer |
| `apps/frontend/src/components/marketing/sections/hero-section.tsx` | Hero section — atmospheric dark background, ec-grid, ec-ledger, ec-scanline |
| `apps/frontend/src/components/layout/sticky-landing-nav.tsx` | Sticky nav — frosted glass, scroll progress bar |
| `apps/frontend/src/components/layout/footer.tsx` | Footer — background photos, grid overlay, wordmark watermark |
| `apps/frontend/src/app/[locale]/login/login-client.tsx` | Login — split-panel, nature photo, glass card |
| `apps/shared/src/ui/button.tsx` | Button component — 6 variants (primary, ink, secondary, ghost, danger, brutal) |
| `apps/shared/src/ui/sidebar.tsx` | Sidebar — collapsible, role-filtered, search, keyboard shortcuts |
| `apps/shared/src/ui/dashboard-layout.tsx` | Dashboard shell — sidebar + header + mobile |
| `apps/shared/src/ui/stats-cards.tsx` | KPI cards — glassmorphic, sparklines, ambient glow |
| `apps/shared/src/ui/activity-feed.tsx` | Activity feed — live timeline, status dots |
| `apps/shared/src/ui/card.tsx` | Card, ReportCard components |
| `apps/shared/src/ui/badge.tsx` | Badge — 6 variants |
| `apps/shared/src/ui/modal.tsx` | Modal, ConfirmModal |
| `apps/shared/src/ui/skeleton.tsx` | 16 skeleton variants including AdminKPIs, AdminTable, AdminCardGrid |
| `apps/shared/src/ui/app-header.tsx` | App header — greeting, notifications, ghost toggle |
| `apps/shared/src/ui/empty-state.tsx` | Empty state — 4 SVG illustrations |

#### Admin Portal (Modification Target)

| File | Purpose |
|------|---------|
| `apps/admin-portal/src/app/globals.css` | Admin CSS — `.admin-hero`, scrollbars, theme helpers (71 lines) |
| `apps/admin-portal/src/app/layout.tsx` | Root layout — font loading, theme initializer |
| `apps/admin-portal/src/app/[locale]/page.tsx` | Landing page — hero, features, CTA |
| `apps/admin-portal/src/app/[locale]/login/login-client.tsx` | Login — split-panel, glass card |
| `apps/admin-portal/src/components/admin-layout-wrapper.tsx` | Sidebar config — nav items, roles, feature flags |
| `apps/admin-portal/src/app/[locale]/(dashboard)/dashboard/page.tsx` | Dashboard — KPIs, activity feed, hotspots (376 lines) |
| `apps/admin-portal/src/app/[locale]/(dashboard)/tickets/page.tsx` | Tickets — card grid, filters, bulk actions (457 lines) |
| `apps/admin-portal/src/app/[locale]/(dashboard)/triage/page.tsx` | Triage — kanban board (127 lines) |
| `apps/admin-portal/src/app/[locale]/(dashboard)/analytics/page.tsx` | Analytics — charts, bias register (469 lines) |
| `apps/admin-portal/src/app/[locale]/(dashboard)/users/page.tsx` | Users — table, RBAC, modals (549 lines) |
| `apps/admin-portal/src/app/[locale]/(dashboard)/settings/page.tsx` | Settings — tabs, forms, toggles (396 lines) |
| `apps/admin-portal/src/app/[locale]/(dashboard)/not-found.tsx` | 404 page |

---

## 3. DESIGN DNA EXTRACTION

All values below are from the actual repository. Do not invent new tokens.

### 3A. Color System

#### Civic Mode (Light — `:root`)

| Token | Hex/Value | Usage |
|-------|-----------|-------|
| `--page` | `#ffffff` | Page background |
| `--panel` | `#ffffff` | Cards, panels |
| `--panel-elevated` | `#fafafa` | Dropdowns, popovers |
| `--overlay` | `#ffffff` | Modals |
| `--ink` | `#111814` | Primary text (14:1 contrast) |
| `--muted` | `#525e58` | Secondary text (5.4:1) |
| `--muted-subtle` | `#748078` | Captions (3.1:1) |
| `--border` | `rgba(0,0,0,0.06)` | Default borders |
| `--border-strong` | `rgba(0,0,0,0.12)` | Form field borders |
| `--accent` | `#1b4332` | Forest green — primary brand |
| `--accent-foreground` | `#ffffff` | Text on accent |
| `--accent-hover` | `#163829` | Accent hover state |
| `--accent-subtle` | `rgba(27,67,50,0.08)` | Accent background tint |
| `--accent-bright` | `#2ee6c8` | Tech teal — highlights, CTAs |
| `--green` | `#166534` | Success (7.2:1) |
| `--red` | `#991b1b` | Error (8.1:1) |
| `--amber` | `#b45309` | Warning (4.6:1) |
| `--info` | `#1d4ed8` | Info blue |
| `--teal-ink` | `#0d8c79` | Teal text on light (5.1:1) |
| `--secondary` | `#5a7d6a` | Secondary brand |

#### Ghost Mode (Dark — `[data-theme="ghost"]`)

| Token | Hex/Value | Usage |
|-------|-----------|-------|
| `--page` | `#0c1628` | Deep navy background |
| `--panel` | `#111e35` | Card surfaces |
| `--panel-elevated` | `#162240` | Elevated surfaces |
| `--overlay` | `#1c2a4a` | Modal backdrops |
| `--ink` | `#e8e0d4` | Warm off-white (13.5:1) |
| `--muted` | `#8a9baa` | Secondary text (6.8:1) |
| `--accent` | `#facc15` | Yellow-gold — Ghost primary |
| `--accent-bright` | `#facc15` | Ghost accent |
| `--green` | `#34d399` | Success |
| `--red` | `#f87171` | Error |
| `--amber` | `#f59e0b` | Warning |
| `--teal-ink` | `#2ee6c8` | Teal on dark |

#### Hero-Specific Tokens (Dark backgrounds for hero/landing)

| Token | Value |
|-------|-------|
| `--hero-bg` | `#0d1a12` |
| `--hero-ink` | `#f0ede8` |
| `--hero-muted` | `rgba(240,237,232,0.5)` |
| `--hero-border` | `rgba(240,237,232,0.08)` |
| `--hero-panel` | `rgba(255,255,255,0.04)` |

### 3B. Typography

| Variable | Font | Weights | Usage |
|----------|------|---------|-------|
| `--font-display` | Bricolage Grotesque | 600, 700, 800 | Display headlines, hero text |
| `--font-body` | Public Sans | 400, 500, 600, 700 | Body text, headings, UI |
| `--font-data` | JetBrains Mono | 400, 500, 700 | IDs, timestamps, coordinates, labels |

**Font class mapping:**
- `font-heading` → Bricolage Grotesque (via `--font-heading`)
- `font-body` → Public Sans (via `--font-body`)
- `font-sans` → Public Sans (alias)
- `font-mono` → JetBrains Mono (via `--font-data`)

**Key typography patterns from the frontend:**
- Hero: `text-5xl md:text-7xl lg:text-8xl font-heading font-black tracking-tighter leading-[0.85]`
- Section labels: `font-mono text-[10px] uppercase tracking-widest` with `label-pill-dark` class
- Stat values: `font-heading text-3xl font-black`
- Nav links: `text-[11px] uppercase tracking-widest font-mono`
- KPI values: `text-2xl sm:text-3xl font-black tracking-tight font-sans`

### 3C. Surface System

**Cards/panels from frontend:**
- `hero-card`: `backdrop-blur-sm bg-white/[0.04] border border-white/[0.08] rounded-2xl`
- `feature-card`: `bg-hero-panel border border-hero-border rounded-2xl` with hover gradient line
- `panel`: `bg-panel border border-ink/5 rounded-2xl`
- `kpi-card`: `rounded-2xl border border-border` with accent top bar pseudo-element

**Glass effects:**
- Login card: `bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl`
- Nav: `backdrop-blur(16px)` with `rgba(247,245,242,0.85)` (civic) / `rgba(13,26,18,0.85)` (ghost)
- Stats cards: `bg-panel/90 backdrop-blur-xl border border-ink/[0.08]`

**Shadows:**
- `--shadow-sm`: `0 1px 2px rgba(17,24,20,0.04)`
- `--shadow-md`: `0 4px 12px rgba(17,24,20,0.06)`
- `--shadow-lg`: `0 12px 32px rgba(17,24,20,0.08)`
- Dashboard shell (Ghost mode): `lg:shadow-[0_8px_30px_rgb(0,0,0,0.04)]`
- Stats cards: `shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]` with hover glow

### 3D. Background Patterns

| Pattern | CSS Class | Description |
|---------|-----------|-------------|
| Grid overlay | `.ec-grid` | 80px fine instrument grid, 3.5% opacity |
| Aurora background | `.admin-hero` | Radial gradients with accent-bright teal on dark |
| Scan line | `.ec-scanline` | Horizontal scan sweep (7s animation) |
| Contour/topographic | Frontend hero background images | `/images/landing_hero_bg_premium.webp` |

### 3E. Button System

From `apps/shared/src/ui/button.tsx`:

| Variant | Appearance |
|---------|------------|
| `primary` | `bg-accent text-white` + inset highlight + hover glow |
| `ink` | `bg-ink text-page` — inverted dark |
| `secondary` | `border-accent/50 bg-transparent text-accent` |
| `ghost` | `bg-transparent text-ink/70` — subtle hover |
| `danger` | `bg-red text-white` |
| `brutal` | `bg-primary text-white` + offset box-shadow |

From design-tokens.css utility classes:

| Class | Description |
|-------|-------------|
| `.btn-primary-dark` | Teal bg (`accent-bright`), dark text, glow hover |
| `.btn-secondary-dark` | Transparent, hero-ink text, border teal |
| `.btn-primary-light` | Forest green bg, white text |
| `.btn-primary` | Teal bg, dark text |
| `.btn-secondary` | Transparent, ink text, border accent |

### 3F. Spacing & Layout

**Dashboard shell:**
- Sidebar: `w-64` (expanded), `w-20` (collapsed)
- Main content: `lg:my-4 lg:mr-4 lg:rounded-[2.5rem]`
- Inner padding: `px-4 sm:px-8 lg:px-12`
- Max width: `max-w-[1440px]`

**Page sections (frontend):**
- `.ec-section`: `padding-block: clamp(64px, 9vw, 120px)`
- Hero: `pt-32 pb-20 px-6 lg:pt-48 lg:pb-32`

**Admin panels:**
- Cards: `p-4 sm:p-6` or `p-4 sm:p-8`
- Grid gaps: `gap-3 sm:gap-4` (stats), `gap-4` (KPI grid)

### 3G. Border Radius

| Token | Value |
|-------|-------|
| `--radius-sm` | `0.375rem` (6px) |
| `--radius-md` | `0.5rem` (8px) |
| `--radius-lg` | `0.75rem` (12px) |
| `--radius-xl` | `1rem` (16px) |
| `--radius-2xl` | `1.5rem` (24px) |
| `--radius-full` | `9999px` |

**Admin uses:** `rounded-xl` (12px) for buttons/inputs, `rounded-2xl` (16px) for cards, `rounded-3xl` (24px) for panels.

---

## 4. ADMIN ALIGNMENT TARGET

### Current State

```
Admin Portal = Generic dark dashboard
- Shares some dark green colors
- Flatter, more generic appearance
- Lacks atmospheric depth
- Typography hierarchy feels disconnected
- Surfaces/cards do not consistently feel part of the same design system
- Navigation and dashboard elements need stronger visual cohesion
```

### Target State

```
Admin Portal = LikasLens Operational Command Center
- Same design tokens as frontend
- Same typography DNA (Bricolage Grotesque + Public Sans + JetBrains Mono)
- Same accent behavior (teal highlights, forest green primary)
- Same surface language (glass panels, subtle borders, ambient glow)
- Same background atmosphere (dark, grid overlay, subtle depth)
- Denser, more functional, more information-rich than frontend
- Professional command-center feel, not marketing page
```

### The Test

If the public frontend and admin portal are shown side by side:
- They should clearly look like products from the same company
- The public frontend should feel like the public-facing environmental intelligence experience
- The admin should feel like the professional command center

---

## 5. COMPONENT-BY-COMPONENT PRIORITIES

### Priority 1 — Admin Shell (Highest Impact)

These define the first impression and frame everything else.

#### 1A. Dashboard Layout Shell (`apps/shared/src/ui/dashboard-layout.tsx`)

**Current:** `bg-ink/[0.04]` container with `bg-page lg:rounded-[2.5rem] lg:shadow-[0_8px_30px_rgb(0,0,0,0.04)]` main panel.

**Frontend reference:** The frontend uses `--hero-bg` dark backgrounds with `.ec-grid` overlays and aurora gradients for atmospheric depth.

**Alignment opportunity:**
- The main content panel already uses `bg-page` which is theme-aware — this is correct
- The outer container `bg-ink/[0.04]` could benefit from a subtle atmospheric treatment
- Consider adding a very faint `.ec-grid` overlay to the outer shell in Ghost mode
- The `lg:rounded-[2.5rem]` is already distinctive and matches the frontend's rounded aesthetic

#### 1B. Sidebar (`apps/shared/src/ui/sidebar.tsx`)

**Current:** Clean white/panel background, `border-r-0`, active state `bg-accent text-page shadow-md shadow-accent/20`.

**Frontend reference:** The sticky nav uses frosted glass (`backdrop-blur(16px)`) with semi-transparent backgrounds.

**Alignment opportunity:**
- Sidebar is already well-structured with token-based colors
- Active state already uses `accent` — correct
- Consider: in Ghost mode, the sidebar could benefit from a subtle glass treatment to match the frontend's frosted nav aesthetic
- The sidebar logo area already uses `font-heading tracking-[0.2em]` — consistent with frontend

#### 1C. App Header (`apps/shared/src/ui/app-header.tsx`)

**Current:** Clean header with greeting, ghost toggle, notifications.

**Alignment opportunity:**
- Already uses token-based colors throughout
- Ghost toggle already has the pill-shaped design with accent colors
- The notification badge already uses `bg-red text-white` (civic) / `bg-accent-bright text-ink` (ghost) — consistent
- Minor: page title could use `font-heading` for display consistency with frontend hero typography

#### 1D. Page Background (Admin Landing + Dashboard)

**Current admin landing:** Uses `.admin-hero` class with radial gradients — already aligned.

**Current dashboard:** Plain `bg-page` — functional but flat.

**Alignment opportunity:**
- Dashboard pages could benefit from a very subtle atmospheric treatment
- Ghost mode dashboard could have a barely perceptible grid overlay (`.ec-grid` at 1-2% opacity)
- Avoid heavy effects behind dense tables — readability first

### Priority 2 — Dashboard Cards & Data Display

#### 2A. KPI Cards (`apps/admin-portal/src/app/[locale]/(dashboard)/dashboard/page.tsx`)

**Current:** Uses `.kpi-card` class with accent top bars and ghost icons.

**Frontend reference:** `StatsCards` component uses `bg-panel/90 backdrop-blur-xl border border-ink/[0.08] shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)]` with ambient glow on hover.

**Alignment opportunity:**
- Add subtle glass effect (`backdrop-blur-xl`) to KPI cards
- Add ambient glow on hover (the `w-28 h-28 rounded-full blur-[30px] opacity-0 group-hover:opacity-30` pattern from StatsCards)
- The accent top bar pattern is good — keep it
- Ghost icons at `opacity: 0.05` are fine — they add depth without distraction

**Token fixes needed:**
- Replace `bg-amber-500/[0.02]` with `bg-amber/[0.02]` (use token, not hardcoded shade)
- Replace `text-amber-600` with `text-amber` (use token)
- Replace `shadow-[0_0_0_4px_color-mix(...)]` with a simpler token-based shadow

#### 2B. Ticket Cards (`apps/admin-portal/src/app/[locale]/(dashboard)/tickets/page.tsx`)

**Current:** `bg-panel rounded-3xl p-4 sm:p-6 shadow-sm border border-ink/5` — already token-based and clean.

**Alignment opportunity:**
- Could benefit from the glass effect pattern: `backdrop-blur-xl border border-ink/[0.08]`
- Selected state ring (`border-green/40 ring-2 ring-green/10`) is good
- Consider adding subtle hover glow to match frontend card behavior

#### 2C. Tables (`apps/admin-portal/src/app/[locale]/(dashboard)/users/page.tsx`)

**Current:** `bg-panel rounded-3xl shadow-sm border border-ink/5 overflow-hidden` — clean and token-based.

**Alignment opportunity:**
- Tables should NOT have heavy glass/blur effects — readability first
- The current clean panel style is appropriate for dense data
- Consider: header row could use a subtle `bg-ink/[0.02]` tint for separation
- The grid header pattern (`font-mono text-xs text-ink/40 uppercase tracking-wider`) matches frontend's label style

#### 2D. Activity Feed (`apps/shared/src/ui/activity-feed.tsx`)

**Current:** Already uses `bg-panel border border-ink/5 rounded-2xl` with hover effects.

**Alignment opportunity:**
- Already well-aligned with frontend patterns
- The timeline dot system (colored by severity) is consistent
- Minor: the "load more" button could use the `btn-secondary` pattern

### Priority 3 — Buttons, Forms, Dialogs

#### 3A. Buttons

**Current admin:** Uses `Button` from shared with `variant="primary"|"secondary"`, `size="sm"`.

**Already aligned.** The Button component is shared between frontend and admin. No changes needed to the component itself.

**Usage check:** Ensure admin pages use `variant="primary"` (forest green) or `variant="secondary"` consistently, not arbitrary colors.

#### 3B. Forms & Inputs

**Current admin pattern:** `bg-panel border border-ink/10 rounded-xl` + `focus:ring-2 focus:ring-green/20 focus:border-green/30`

**Frontend reference:** `bg-ink/[0.02] border-ink/10 rounded-xl` + `focus:ring-accent/20 focus:border-accent/30`

**Alignment opportunity:**
- Admin uses `green` for focus rings while frontend uses `accent` — should align to `accent`
- The `bg-panel` vs `bg-ink/[0.02]` difference is acceptable (admin panels are white, frontend inputs are on page bg)
- Consider: admin form inputs could use `bg-page` instead of `bg-panel` for consistency with frontend's lighter input style

#### 3C. Modals & Dialogs

**Current:** Uses `Modal` and `ConfirmModal` from shared — already aligned.

**Users page modal:** `fixed inset-0 z-50 bg-black/50` overlay + `bg-panel rounded-3xl shadow-xl` — clean.

**No changes needed** to modal structure.

#### 3D. Empty States

**Current admin:** Uses `EmptyState` from shared or hand-rolled versions with same structure.

**Already aligned.** The `EmptyState` component provides 4 SVG illustrations.

### Priority 4 — Atmospheric Enhancements (Lowest Priority)

These add polish but are not critical for brand cohesion.

#### 4A. Ghost Mode Dashboard Atmosphere

In Ghost mode, the admin portal could benefit from:
- Very subtle `.ec-grid` overlay on the dashboard shell (1-2% opacity)
- Faint accent glow on the sidebar active state
- Subtle border glow on cards in Ghost mode (`border-accent-bright/10`)

**Do NOT:**
- Add heavy aurora backgrounds behind dense tables
- Add scanline effects to operational pages
- Add animated elements that reduce performance

#### 4B. Landing Page & Login

The admin landing page and login are already well-aligned with the frontend:
- Landing uses `.admin-hero` with aurora gradients
- Login uses `bg-hero-bg`, `.ec-grid`, glass card
- Both use `btn-primary-dark` / `btn-secondary-dark`

**Minor improvements:**
- Login glass card shadow could be slightly more prominent: `shadow-[0_0_80px_rgba(46,230,200,0.08)]`
- Consider adding a subtle contour/topographic background pattern to the login left panel

---

## 6. STRICT NON-GOALS

Antigravity must NOT:

- **Change routing** — all `href`, `router.push`, `Link` paths must remain identical
- **Modify RBAC** — role checks, `userRole`, feature flags must not change
- **Alter backend architecture** — API calls, proxy routes, data fetching patterns are off-limits
- **Change API calls** — `getTickets`, `getUser`, `updateUserRole`, etc. must not be modified
- **Rewrite business logic** — triage logic, ticket status transitions, bulk actions are off-limits
- **Remove operational information** — all data columns, status indicators, filters must remain
- **Reduce accessibility** — WCAG contrast ratios, keyboard navigation, ARIA attributes must be preserved or improved
- **Introduce excessive animation** — no heavy animations on dashboard pages, especially behind dense tables
- **Make the dashboard look like a marketing page** — the admin must remain dense, functional, information-rich
- **Add new dependencies** — no new npm packages for visual effects
- **Modify `design-tokens.css`** — this is the shared source of truth; admin changes must consume tokens, not redefine them
- **Break Ghost Mode** — both themes must continue working correctly

---

## 7. IMPLEMENTATION RULES

Antigravity must:

### 7A. Token Usage

- **Reuse existing CSS variables** from `design-tokens.css` — do not create new color variables
- **Use Tailwind utility classes** that map to tokens: `bg-panel`, `text-ink`, `border-ink/5`, `text-accent-bright`, etc.
- **Avoid hardcoded hex colors** — replace `bg-amber-500/[0.02]` with `bg-amber/[0.02]`
- **Avoid hardcoded Tailwind shades** — use `amber` not `amber-500`, `green` not `green-600`

### 7B. Surface Language

- **Cards:** `bg-panel rounded-2xl border border-ink/5` as base, add `backdrop-blur-xl` for glass effect where appropriate
- **Panels:** `bg-panel rounded-3xl p-4 sm:p-6 border border-ink/5` — already the admin pattern
- **Inputs:** `bg-page border border-ink/10 rounded-xl` + `focus:ring-2 focus:ring-accent/20`
- **Glass effect pattern:** `bg-panel/90 backdrop-blur-xl border border-ink/[0.08]` — from StatsCards

### 7C. Typography

- **Headings:** Use `font-heading` (Bricolage Grotesque) for page titles and section headers
- **Labels:** Use `font-mono text-[10px] uppercase tracking-widest` pattern from frontend
- **Body:** Use `font-body` / `font-sans` (Public Sans) — already default
- **Data:** Use `font-mono` (JetBrains Mono) for IDs, timestamps, coordinates

### 7D. Responsive Behavior

- **Preserve all existing breakpoints** — `sm:`, `md:`, `lg:` patterns
- **Preserve mobile layout** — `MobileHeader`, `BottomNav`, `MobileLayout` are shared and must not change
- **Preserve sidebar collapse behavior** — `lg:w-64` expanded, `lg:w-20` collapsed

### 7E. Dark Mode (Ghost)

- **All changes must work in both Civic and Ghost modes** — test both themes
- **Use theme-aware tokens** — `bg-panel`, `text-ink`, `border-ink/5` automatically adapt
- **Ghost-specific enhancements** should use `--accent` (gold) and `--accent-bright` (gold) tokens

### 7F. Performance

- **Avoid heavy CSS effects** behind dense data tables
- **No `backdrop-blur` on scrollable containers** — causes performance issues
- **Keep animations minimal** on operational pages — the frontend's ec-scanline and aurora effects are for landing/hero only
- **All animations must respect `prefers-reduced-motion: reduce`** — already handled by design-tokens.css

---

## 8. ACCEPTANCE CRITERIA

### Visual Coherence Test

Show the admin portal landing page and the frontend landing page side by side. They should:
- Share the same dark atmospheric background treatment
- Use the same typography hierarchy (Bricolage Grotesque for display, Public Sans for body)
- Use the same accent colors (teal `#2ee6c8` for highlights, forest green `#1b4332` for primary)
- Use the same button styles (`.btn-primary-dark`, `.btn-secondary-dark`)
- Use the same label/pill styles (`.label-pill-dark`)
- Feel like two views of the same visual universe

### Functional Preservation Test

- All routes work identically
- All RBAC role filtering works identically
- All API calls succeed
- Ghost Mode toggle works on every page
- Mobile layout works identically
- All forms submit correctly
- All tables display all columns
- All filters work correctly
- All bulk actions work correctly
- Keyboard navigation works throughout
- Screen reader announces all elements correctly

### Performance Test

- Lighthouse performance score does not decrease
- No layout shift from visual changes
- Scroll performance remains smooth on all pages
- No janky animations on operational pages

---

## 9. DESIGN TOKEN REFERENCE CARD

Quick reference for Antigravity — the most commonly needed tokens:

```
BACKGROUND:     bg-page, bg-panel, bg-panel-elevated, bg-overlay
TEXT:           text-ink, text-muted, text-muted-subtle
BORDERS:        border-ink/5, border-ink/10, border-ink/[0.08]
ACCENT:         text-accent, bg-accent, border-accent
ACCENT BRIGHT:  text-accent-bright, bg-accent-bright
STATUS:         text-green, bg-green/10, text-red, bg-red/10, text-amber, bg-amber/10
HERO:           text-hero-ink, text-hero-muted, bg-hero-bg, border-hero-border
TYPOGRAPHY:     font-heading, font-body, font-sans, font-mono
RADII:          rounded-xl (12px), rounded-2xl (16px), rounded-3xl (24px)
SHADOWS:        shadow-sm, shadow-md, shadow-lg
GLASS:          backdrop-blur-xl (used with bg-panel/90)
FOCUS:          focus:ring-2 focus:ring-accent/20 focus:border-accent/30
```

---

## 10. BRANCH STATUS

| Branch | Latest Commit | Status |
|--------|---------------|--------|
| `development` | `efedfe8` — docs: update brand alignment report | Current, up to date with origin |
| `staging` | `023a54a` — Merge branch 'development' into staging | Deployed to Vercel preview |
| `feat/admin-frontend-brand-alignment` | `8be0c0d` — feat: gate Predictions nav behind feature flag | Merged into development |

**Recommended starting branch:** `development` — it contains all recent visual alignment work and is the integration branch.

**Build status:** `pnpm --filter admin-portal build` passes clean (175 pages, no TypeScript errors).

---

## 11. FILE CHANGE LOG

Files already modified in the initial brand alignment pass (for reference — these are the files that have been started):

| File | Changes Made |
|------|-------------|
| `apps/admin-portal/src/app/layout.tsx` | Replaced Geist with Public Sans + Bricolage Grotesque |
| `apps/admin-portal/src/app/globals.css` | Added theme helpers, typography vars, `.admin-hero` class |
| `apps/admin-portal/src/app/[locale]/page.tsx` | Rewrote landing with design tokens, shared utility classes |
| `apps/admin-portal/src/app/[locale]/login/login-client.tsx` | Aligned login with `bg-hero-bg`, `ec-grid`, `accent-bright` |
| `apps/admin-portal/src/components/admin-layout-wrapper.tsx` | Added Predictions feature flag (default OFF) |

**What remains:** The dashboard pages (Priority 2-4 items above) still need the atmospheric depth, surface language refinement, and token consistency work described in this brief.

---

## 12. SUMMARY

The admin portal has the right tokens, the right shared components, and the right typography loaded. The gap is in **consistent application** — some pages use tokens perfectly (tickets, users, settings) while others have hardcoded shades or lack the atmospheric depth that defines the LikasLens visual identity.

The work is surgical, not architectural. It is about:

1. Adding subtle glass/depth effects to cards and panels
2. Fixing hardcoded color values to use tokens
3. Adding faint atmospheric overlays in Ghost mode
4. Ensuring typography hierarchy uses `font-heading` for display text
5. Aligning focus ring colors to `accent` instead of `green`

This is a focused visual polish pass, not a redesign.
