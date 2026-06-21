# Developer 1 — Frontend Sprint Roadmap

> **Sprint:** Post-Pull Bug Fix & Integration Sprint
> **Version:** v0.9.3 → v0.9.5
> **Timeline:** June 21–25, 2026 (Sat–Wed)
> **Total Estimated Hours:** 38h
> **Assigned To:** Lou (Dev 1)
> **Scope:** ALL frontend — `apps/frontend`, `apps/mobile-pwa`, `apps/shared`
> **Status:** 🔴 NOT STARTED

---

## Team Roster

| Dev | Name | Role | Focus |
|-----|------|------|-------|
| Dev 1 | **Lou** | Frontend/UI | Next.js UI, Tailwind, responsive design, PWA, shared components |
| Dev 2 | Jeff | AI/Backend | FastAPI AI service, YOLOv8, Neo4j graph, Gemini |
| Dev 3 | Charlyn | Backend/Infrastructure | Laravel API, Supabase, CI/CD, admin portal |
| Dev 4 | Katherine | Integration/PWA/APK | E2E testing, PWA offline, Capacitor APK, demo prep |

---

## Summary of Responsibilities

Lou owns **all user-facing frontend code** across three apps:

- **`apps/frontend`** — Public marketing site + full web app (Next.js 16 App Router)
- **`apps/mobile-pwa`** — Installable mobile PWA with native feel (Next.js 16 App Router)
- **`apps/shared`** — Shared React components, API client, types, design tokens

This sprint focuses on **stabilizing the post-pull codebase**, fixing broken layouts and critical mobile-pwa issues, and integrating newly pulled shared components.

---

## Recent Pull Context

The latest pull brought these features that need integration/verification:

| Feature | Status | Action Needed |
|---------|--------|---------------|
| Auth callback routes (`frontend` + `mobile-pwa`) | Pulled | Polish & verify flows |
| Apple splash screens (`mobile-pwa`) | Pulled | Verify integration |
| PWA install prompt (`shared`) | Pulled | Wire into both apps |
| Global search (`shared`) | Pulled | Wire into both apps |
| Enhanced map/heatmap widgets | Pulled | Polish & verify |
| `format.ts` utilities (`shared`) | Pulled | Integrate across pages |
| `auth-init` libraries (all 3 apps) | Pulled | Verify initialization |
| Error pages (`mobile-pwa`) | Pulled | Verify rendering |

---

## Dependencies on Other Developers

| Dependency | From | Needed By | Status | Notes |
|------------|------|-----------|--------|-------|
| APK install link / download endpoint | Dev 4 (Katherine) | Day 1 | 🔴 Blocked | Issue #164 — Lou needs working URL for install page |
| Android app ownership intent filters | Dev 4 (Katherine) | Day 1 | 🔴 Blocked | Issue #176 — `.well-known/assetlinks.json` config |
| Backend profile update endpoint | Dev 3 (Charlyn) | Day 2 | 🟡 Pending | Issue #169 — Edit Profile needs `PUT /api/user/profile` |
| Dashboard search API | Dev 3 (Charlyn) | Day 2 | 🟡 Pending | Issue #168 — Search needs backend query support |
| Neo4j graph label confirmation | Dev 2 (Jeff) | Day 1 | 🟡 Pending | Tech-stack copy fix depends on Jeff confirming DB choice |

---

## CRITICAL Priority (Day 1 — June 21)

### #175 — Broken Android App Logo
- [ ] **Fix PWA manifest icon paths for Android**
  - **Files:**
    - `apps/mobile-pwa/public/manifest.json`
    - `apps/mobile-pwa/next.config.ts` (PWA plugin config)
    - `apps/mobile-pwa/src/app/layout.tsx` (meta tags)
  - **Description:** Android displays default browser icon instead of LikasLens logo. Verify all icon sizes (192x192, 512x512) are present and correctly referenced in manifest. Ensure `maskable` purpose variants exist.
  - **Est:** 2h
  - **Issue:** #175

### #176 — Android Ownership Not Working
- [ ] **Verify Digital Asset Links and intent filters**
  - **Files:**
    - `apps/mobile-pwa/public/.well-known/assetlinks.json`
    - `apps/mobile-pwa/next.config.ts` (PWA config)
    - Android Capacitor config (if hybrid)
  - **Description:** Android does not recognize app ownership. Verify `assetlinks.json` is served correctly at `/.well-known/assetlinks.json`. Confirm `package_name` and `sha256_cert_fingerprint` match. Coordinate with Dev 4 for Capacitor-side intent filter config.
  - **Est:** 2h
  - **Blocked by:** Dev 4 (Katherine) — needs Capacitor package name + signing cert fingerprint
  - **Issue:** #176

---

## HIGH Priority (Day 1–2 — June 21–22)

### #174 — Broken OG Image
- [ ] **Fix Open Graph meta image for social sharing**
  - **Files:**
    - `apps/frontend/src/app/layout.tsx` (metadata)
    - `apps/frontend/public/og-image.png` (or equivalent)
    - `apps/frontend/next.config.ts` (image domains)
  - **Description:** OG image does not render when sharing links on social media. Verify the image file exists, metadata references the correct absolute URL, and `og:image` dimensions are set (1200x630 recommended).
  - **Est:** 1.5h
  - **Issue:** #174

### #163 — Chatbot Blocks Input with "Log In" Button
- [ ] **Fix chatbot overlay blocking input fields**
  - **Files:**
    - `apps/frontend/src/components/chatbot/` (chatbot widget)
    - `apps/frontend/src/app/[locale]/layout.tsx` (chatbot placement)
  - **Description:** The chatbot's "Log In" CTA button overlaps input fields on certain pages, preventing user interaction. Adjust z-index stacking, add dismiss behavior, or reposition chatbot trigger to avoid blocking form inputs.
  - **Est:** 2h
  - **Issue:** #163

### #164 — Install/APK Link Broken
- [ ] **Fix install page download link and PWA install prompt**
  - **Files:**
    - `apps/mobile-pwa/src/app/[locale]/install/page.tsx`
    - `apps/shared/src/ui/pwa-install-prompt.tsx`
    - `apps/frontend/src/components/` (install CTA if any)
  - **Description:** The APK download link on the install page is broken. Coordinate with Dev 4 for working download URL. Also integrate the new shared `pwa-install-prompt` component into both `frontend` and `mobile-pwa` for browser-based install flow.
  - **Est:** 2h
  - **Blocked by:** Dev 4 (Katherine) — needs working APK URL
  - **Issue:** #164

### #173 — Laws Database: Broken Card Layout
- [ ] **Fix law card grid layout on mobile-pwa**
  - **Files:**
    - `apps/mobile-pwa/src/app/[locale]/(app)/laws/page.tsx`
  - **Description:** Law cards are broken on mobile — likely grid/flex overflow or missing responsive breakpoints. Cards should stack single-column on mobile, 2-col on tablet. Verify card content truncation and tap targets.
  - **Est:** 2h
  - **Issue:** #173

### Gremlin → Neo4j Copy Fix
- [ ] **Fix incorrect database reference in tech stack section**
  - **File:** `apps/frontend/src/components/marketing/sections/tech-stack-section.tsx:71`
  - **Current:** `"Gremlin-powered graph database..."`
  - **Fix to:** `"Neo4j-powered graph database mapping relationships between violations, locations, agencies, statutes, and temporal patterns. Enables Cypher queries for pattern detection."`
  - **Est:** 10min

---

## MEDIUM Priority (Day 2–3 — June 22–23)

### #170 — Incidents: Broken Card Layout
- [ ] **Fix incident card layout on mobile-pwa**
  - **Files:**
    - `apps/mobile-pwa/src/app/[locale]/(app)/incidents/page.tsx`
  - **Description:** Incident cards have layout issues — likely overflow, truncation, or broken grid. Apply consistent card pattern matching other mobile-pwa pages.
  - **Est:** 1.5h
  - **Issue:** #170

### #172 — Leaderboard: 1st–3rd Placement Crowded
- [ ] **Fix top-3 rank display spacing on mobile-pwa**
  - **Files:**
    - `apps/mobile-pwa/src/app/[locale]/(app)/scoreboard/page.tsx`
  - **Description:** Top 3 leaderboard entries are visually crowded — gold/silver/bronze badges overlap or text is clipped. Add proper spacing, reduce font size on mobile, or reflow to vertical stack.
  - **Est:** 1.5h
  - **Issue:** #172

### #165 — Display Name Squeezed to Side
- [ ] **Fix display name alignment/overflow in mobile-pwa**
  - **Files:**
    - `apps/mobile-pwa/src/app/[locale]/(app)/profile/page.tsx`
    - `apps/mobile-pwa/src/app/[locale]/(app)/layout.tsx` (header/nav)
  - **Description:** User's display name is pushed to the edge or clipped. Likely a flex/overflow issue in the profile header or navigation bar. Ensure proper padding and text truncation with `ellipsis`.
  - **Est:** 1h
  - **Issue:** #165

### #166 — Impact Insights: Broken Card Layout
- [ ] **Fix impact insights card layout on mobile-pwa**
  - **Files:**
    - `apps/mobile-pwa/src/app/[locale]/(app)/impact/page.tsx`
  - **Description:** Impact/insights cards have broken layout — likely chart overflow or grid misalignment. Verify responsive grid, chart container sizing, and card padding.
  - **Est:** 1.5h
  - **Issue:** #166

### #168 — Dashboard Search Bar Not Working
- [ ] **Wire global search into mobile-pwa dashboard**
  - **Files:**
    - `apps/mobile-pwa/src/app/[locale]/(app)/dashboard/page.tsx`
    - `apps/shared/src/ui/global-search.tsx`
  - **Description:** Dashboard search bar does not trigger queries. Integrate the new shared `global-search` component. Requires backend search endpoint (coordinate with Dev 3). If endpoint unavailable, implement client-side filtering as fallback.
  - **Est:** 2h
  - **Blocked by:** Dev 3 (Charlyn) — search API endpoint
  - **Issue:** #168

### #169 — No Edit Profile Feature
- [ ] **Implement edit profile page on mobile-pwa**
  - **Files:**
    - `apps/mobile-pwa/src/app/[locale]/(app)/profile/edit/page.tsx` (exists, verify)
    - `apps/shared/src/ui/` (form components)
  - **Description:** Edit profile page exists at `profile/edit/page.tsx` but may be non-functional. Wire up form fields (display name, avatar, bio), connect to `PUT /api/user/profile` endpoint. Coordinate with Dev 3 for API availability.
  - **Est:** 3h
  - **Blocked by:** Dev 3 (Charlyn) — profile update endpoint
  - **Issue:** #169

### Shared Component Integration
- [ ] **Integrate global-search into frontend and mobile-pwa**
  - **Files:**
    - `apps/shared/src/ui/global-search.tsx`
    - `apps/frontend/src/components/layout/` (header/sidebar)
    - `apps/mobile-pwa/src/app/[locale]/(app)/layout.tsx`
  - **Est:** 2h

- [ ] **Integrate pwa-install-prompt into both apps**
  - **Files:**
    - `apps/shared/src/ui/pwa-install-prompt.tsx`
    - `apps/frontend/src/app/layout.tsx`
    - `apps/mobile-pwa/src/app/layout.tsx`
  - **Est:** 1h

- [ ] **Verify pwa-splash-screen integration**
  - **Files:**
    - `apps/shared/src/ui/pwa-splash-screen.tsx`
    - `apps/mobile-pwa/src/components/apple-splash-screens.tsx`
    - `apps/mobile-pwa/src/components/splash-screen.tsx`
  - **Description:** Verify Apple splash screen images load correctly. Ensure `apple-splash-screens.tsx` renders the right viewport-specific splash images. Test on iOS Safari.
  - **Est:** 1.5h

- [ ] **Integrate format.ts utilities across pages**
  - **Files:**
    - `apps/shared/src/lib/format.ts`
    - All pages displaying dates, numbers, coordinates, file sizes
  - **Description:** Replace ad-hoc formatting with shared `format.ts` functions (e.g., `formatDate`, `formatNumber`, `formatCoordinate`, `formatFileSize`). Search for manual `toLocaleDateString()`, `toFixed()`, etc.
  - **Est:** 2h

### Auth Callback Flow Polish
- [ ] **Polish frontend auth callback**
  - **Files:**
    - `apps/frontend/src/app/auth/callback/route.ts`
  - **Description:** Verify OAuth callback handles success, error, and edge cases (expired tokens, missing code). Ensure proper redirect after auth.
  - **Est:** 1h

- [ ] **Polish mobile-pwa auth callback**
  - **Files:**
    - `apps/mobile-pwa/src/app/[locale]/auth/callback/page.tsx`
    - `apps/mobile-pwa/src/lib/auth-init.ts`
  - **Description:** Verify mobile auth callback renders loading state, handles errors gracefully, and redirects to dashboard on success.
  - **Est:** 1h

### Map & Heatmap Polish
- [ ] **Polish enhanced map widget**
  - **Files:**
    - `apps/mobile-pwa/src/components/map/enhanced-map.tsx`
    - `apps/mobile-pwa/src/app/[locale]/(app)/map/page.tsx`
  - **Description:** Verify map renders correctly, markers are interactive, and map is responsive on mobile. Test touch gestures (pinch zoom, pan).
  - **Est:** 1.5h

---

## LOW Priority (Day 3–4 — June 23–24)

### #167 — Dashboard Column Separation
- [ ] **Improve dashboard column visual separation on mobile-pwa**
  - **Files:**
    - `apps/mobile-pwa/src/app/[locale]/(app)/dashboard/page.tsx`
  - **Description:** Dashboard sections lack visual separation — add dividers, spacing, or card containers to distinguish metric groups.
  - **Est:** 1h
  - **Issue:** #167

### Cross-App Consistency Audit
- [ ] **Verify design consistency between frontend and mobile-pwa**
  - Compare shared component usage across both apps
  - Ensure both apps use `apps/shared` components (not duplicated local versions)
  - Verify Tailwind config alignment
  - **Est:** 2h

### Loading & Error State Audit
- [ ] **Verify all loading.tsx and error.tsx files render correctly**
  - `apps/mobile-pwa/src/app/[locale]/(app)/*/loading.tsx` (12 files)
  - `apps/mobile-pwa/src/app/[locale]/(app)/error.tsx`
  - `apps/mobile-pwa/src/app/[locale]/error.tsx`
  - `apps/mobile-pwa/src/app/not-found.tsx`
  - **Est:** 1.5h

### Accessibility Quick Pass
- [ ] **Check key accessibility issues on mobile-pwa**
  - Verify `aria-labels` on interactive elements
  - Ensure color contrast meets WCAG AA
  - Test keyboard navigation on critical flows
  - **Est:** 1.5h

---

## Post-Hackathon Deferred Tasks

These tasks are out of scope for the current sprint but should be tracked:

| Task | Priority | Notes |
|------|----------|-------|
| Full i18n audit for all `[locale]` routes | MEDIUM | Verify all translated strings are present |
| Offline-first PWA enhancement | MEDIUM | Service worker caching strategy |
| Dark mode (Ghost Mode) across mobile-pwa | MEDIUM | Currently frontend-only |
| Component library documentation (Storybook) | LOW | For shared components |
| E2E test coverage for critical flows | LOW | Playwright or Cypress |
| Performance budget & Lighthouse audit | LOW | Target 90+ on mobile |
| Image lazy loading optimization | LOW | Below-the-fold images |
| Font loading optimization (Montserrat, Inter, Space Mono) | LOW | `font-display: swap` |

---

## Sprint Velocity Tracker

| Day | Date | Focus | Hours | Tasks |
|-----|------|-------|-------|-------|
| 1 | Sat Jun 21 | Critical fixes + blocked items | 8h | #175, #176, #174, #163, #164, Gremlin fix |
| 2 | Sun Jun 22 | High priority + shared integration | 8h | #173, global-search, pwa-install, format.ts |
| 3 | Mon Jun 23 | Medium priority mobile-pwa fixes | 8h | #170, #172, #165, #166, auth polish, map polish |
| 4 | Tue Jun 24 | Remaining medium + low priority | 8h | #168, #169, #167, consistency audit |
| 5 | Wed Jun 25 | Buffer / testing / polish | 6h | Remaining items, cross-app testing |

**Total: 38h estimated**

---

## Checklist: Sprint Definition of Done

- [ ] All CRITICAL issues resolved (#175, #176)
- [ ] All HIGH issues resolved (#174, #163, #164, #173)
- [ ] All MEDIUM issues resolved or have clear fallback
- [ ] Gremlin → Neo4j copy fixed
- [ ] Shared components integrated (global-search, pwa-install-prompt, pwa-splash-screen)
- [ ] `format.ts` utilities integrated across pages
- [ ] Auth callback flows polished on both apps
- [ ] Map/heatmap widgets verified and polished
- [ ] No TypeScript errors: `pnpm --filter frontend build && pnpm --filter mobile-pwa build`
- [ ] No lint errors: `pnpm --filter frontend lint && pnpm --filter mobile-pwa lint`
- [ ] All pages render at 375px width (iPhone SE)

---

## Notes

- Always run `pnpm install` from repo root before building
- Use `pnpm --filter frontend dev` or `pnpm --filter mobile-pwa dev` for isolated dev
- Respect monorepo boundaries — never import from `apps/backend` or `apps/ai-service` directly
- For image uploads: always include EXIF stripping before transmission
- Follow existing code conventions — check neighboring files before writing new patterns
