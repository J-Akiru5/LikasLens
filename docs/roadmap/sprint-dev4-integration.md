# Developer 4 — Lightweight Tasks, QA & Documentation

> **Sprint:** ASEAN AI Hackathon Prep
> **Version:** v0.9.3
> **Timeline:** June 21-22, 2026 (Sat-Sun)
> **Total Hours:** 8-10h (minimal load — Kat is also video editing)
> **Assigned To:** Katherine (Kat)
> **Focus:** Quick CSS fixes, manual QA, documentation, content verification

---

## Team Roster

| Dev | Name | Role | Focus |
|-----|------|------|-------|
| Dev 1 | Lou | Frontend/UI | Next.js UI, Tailwind, responsive design, Ghost Mode theme |
| Dev 2 | Jeff | AI/Backend | FastAPI AI service, YOLOv8, Gremlin graph, Gemini |
| Dev 3 | Charlyn | Backend/Infrastructure | Laravel API, Supabase, CI/CD, admin portal |
| Dev 4 | Katherine (Kat) | Lightweight + QA | Quick fixes, testing, docs, video editing support |

---

## Summary

Kat handles **lightweight, quick tasks** that don't require deep frontend or backend expertise. Focus areas:

1. **Mobile PWA card layout fixes** — CSS/styling tweaks (grid, spacing, overflow)
2. **Manual QA testing** — Smoke test all 3 Next.js apps
3. **Documentation** — CHANGELOG, README, AGENTS.md verification
4. **Content** — i18n translation completeness check

> **Note:** Kat is also doing video editing. Keep tasks simple and quick. Escalate anything complex to Lou.

---

## Dependencies on Other Developers

| Dependency | From | Needed For | Notes |
|------------|------|-----------|-------|
| Complex CSS/layout issues | Dev 1 (Lou) | #168 Dashboard Search Bar | If search bar needs JS logic, hand off to Lou |
| Backend API verification | Dev 3 (Charlyn) | QA testing | Need working endpoints for manual testing |
| AI service health | Dev 2 (Jeff) | Report submission QA | Need triage pipeline for full flow test |

---

## HIGH Priority

### UI Fixes — Mobile PWA Card Layouts

These are CSS-only fixes in `apps/mobile-pwa`. Most are grid/flex/overflow issues.

- [ ] **#173** Laws Database: Broken Card Layout
  - **File:** `apps/mobile-pwa/src/app/[locale]/laws/page.tsx`
  - **Fix:** Card grid layout broken on mobile — likely grid columns or overflow issue
  - **Time:** 30min
  - **Priority:** HIGH

- [ ] **#170** Incidents: Broken Card Layout
  - **File:** `apps/mobile-pwa/src/app/[locale]/incidents/page.tsx` (or similar)
  - **Fix:** Card layout broken — check grid/flex properties
  - **Time:** 30min
  - **Priority:** MEDIUM

---

## MEDIUM Priority

### UI Fixes — Mobile PWA Spacing & Layout

- [ ] **#172** Leaderboard: 1st-3rd Placement Crowded
  - **File:** `apps/mobile-pwa/src/app/[locale]/scoreboard/page.tsx`
  - **Fix:** Top 3 rank cards overlapping — add spacing/gap between podium items
  - **Time:** 20min
  - **Priority:** MEDIUM

- [ ] **#165** Display Name Squeezed to Side
  - **File:** `apps/mobile-pwa/src/app/[locale]/profile/page.tsx` (or dashboard)
  - **Fix:** Display name text pushed to edge — add padding or fix flex alignment
  - **Time:** 15min
  - **Priority:** MEDIUM

- [ ] **#166** Impact Insights: Broken Card Layout
  - **File:** `apps/mobile-pwa/src/app/[locale]/dashboard/impact/page.tsx` (or similar)
  - **Fix:** Stats/insight cards layout broken — grid or flex issue
  - **Time:** 30min
  - **Priority:** MEDIUM

- [ ] **#168** Dashboard Search Bar Not Working
  - **File:** `apps/mobile-pwa/src/app/[locale]/dashboard/page.tsx`
  - **Fix:** Search bar may need JS event handler or API wiring
  - **Time:** 30min
  - **Priority:** MEDIUM
  - **Dependency:** **Escalate to Lou** if it requires search logic, API calls, or state management

---

## LOW Priority

### Documentation

- [ ] Update `CHANGELOG.md` for v0.9.3 release
  - **File:** `CHANGELOG.md` (root)
  - **Action:** Add entries for recent fixes and features
  - **Time:** 20min

- [ ] Verify `README.md` is accurate
  - **File:** `README.md` (root)
  - **Action:** Check setup instructions, project structure, team credits
  - **Time:** 15min

- [ ] Verify `AGENTS.md` files are accurate
  - **Files:** `AGENTS.md` (root), `apps/*/AGENTS.md`
  - **Action:** Confirm instructions match current project state
  - **Time:** 15min

### Content — i18n Translations

- [ ] Verify all 6 locales are complete
  - **Files:** `apps/mobile-pwa/messages/{fil,id,ms,ta,vi,en}.json`
  - **Action:** Check no missing keys across locale files
  - **Time:** 20min

- [ ] Verify frontend i18n if applicable
  - **Files:** `apps/frontend/messages/*.json` (if exists)
  - **Action:** Spot-check translation completeness
  - **Time:** 10min

---

## Testing Checklist (Manual QA)

Smoke test each app. Report issues as GitHub issues — don't fix complex bugs yourself.

### Mobile PWA (`apps/mobile-pwa`)

- [ ] App loads at `http://localhost:3001` (or assigned port)
- [ ] Register flow works
- [ ] Login flow works
- [ ] Dashboard renders with stats
- [ ] Report page loads (camera/GPS may not work in dev)
- [ ] Scoreboard/leaderboard renders
- [ ] Profile page loads
- [ ] PWA install prompt appears in browser
- [ ] Pages are responsive at 375px width

### Frontend (`apps/frontend`)

- [ ] App loads at `http://localhost:3000`
- [ ] Landing page renders
- [ ] Auth flow: register → login → logout
- [ ] Dashboard loads with data
- [ ] Impact dashboard charts render
- [ ] Laws page loads
- [ ] Scoreboard loads
- [ ] Contact form submits

### Admin Portal (`apps/admin-portal`)

- [ ] App loads at assigned port
- [ ] Admin login works
- [ ] Dashboard renders
- [ ] Key admin pages accessible

---

## Escalation Rules

| Issue Type | Action |
|------------|--------|
| CSS-only fix (spacing, grid, overflow) | Fix it yourself |
| Needs JS logic or state management | Escalate to Lou |
| Backend API not responding | Escalate to Charlyn |
| AI service issues | Escalate to Jeff |
| Takes more than 30min | Stop and escalate |

---

## Definition of Done

- [ ] All HIGH priority card layout fixes merged
- [ ] MEDIUM priority fixes attempted (escalate if stuck >30min)
- [ ] Manual QA smoke test completed for all 3 apps
- [ ] CHANGELOG.md updated
- [ ] i18n locales verified complete
- [ ] All issues found during QA logged as GitHub issues
