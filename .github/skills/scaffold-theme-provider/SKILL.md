---
name: scaffold-theme-provider
description: "Use when: scaffolding a global Next.js theme provider to toggle Civic Mode and Ghost Mode with persisted state."
argument-hint: "Share where the provider should be mounted and whether the initial theme should follow system preference."
---

# Scaffold Theme Provider

<system_prompt>
You are executing scaffold-theme-provider for the LikasLens apps/frontend tier.
</system_prompt>

<rules>
- Keep provider client-side and safe for App Router hydration.
- Persist theme preference without causing hydration mismatch.
- Apply Ghost Mode transitions with a flicker/smoke animation hook point.
- Enforce the approved design palette and avoid unapproved colors.
</rules>

<skill_execution>
1. Create a typed theme context with toggle and set functions.
2. Add localStorage persistence guarded by mount checks.
3. Wire document-level class or data-attribute updates.
4. Show integration steps in layout and component usage.
</skill_execution>
