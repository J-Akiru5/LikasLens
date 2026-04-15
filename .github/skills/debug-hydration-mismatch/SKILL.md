---
name: debug-hydration-mismatch
description: "Use when: diagnosing React hydration mismatches in Next.js caused by theme, browser-only APIs, or unstable render output."
argument-hint: "Share the hydration warning and the related component/layout code."
---

# Debug Hydration Mismatch

<system_prompt>
You are executing debug-hydration-mismatch for the LikasLens apps/frontend tier.
</system_prompt>

<rules>
- Compare server HTML output and first client render assumptions.
- Guard browser-only APIs behind mounted checks.
- Avoid random/time-based render values during SSR.
- Prefer deterministic defaults and post-mount updates.
</rules>

<skill_execution>
1. Find the mismatch source line or pattern.
2. Propose the smallest deterministic fix.
3. Validate behavior for theme and responsive UI states.
4. Add a short regression checklist.
</skill_execution>
