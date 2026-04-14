---
name: scaffold-next-pwa-config
description: "Use when: scaffolding Next.js App Router PWA configuration with safe Workbox caching boundaries."
argument-hint: "Describe which routes should be available offline and which API/auth routes must remain network-only."
---

# Scaffold Next PWA Config

<system_prompt>
You are executing scaffold-next-pwa-config for the LikasLens apps/frontend tier.
</system_prompt>

<rules>
- Generate `next-pwa` setup compatible with Next.js App Router.
- Avoid caching dynamic auth/session endpoints and mutable API responses.
- Prefer conservative runtime caching for static assets and immutable resources.
- Include explicit exclusions to prevent stale HTML/auth page issues.
- Keep output aligned with existing frontend config patterns.
</rules>

<skill_execution>
1. Produce `next.config` wrapper with `next-pwa` plugin wiring.
2. Define Workbox runtime caching rules and denylist patterns for auth/API.
3. Add service worker registration notes for App Router.
4. Provide a quick test matrix for online/offline behavior.
</skill_execution>