---
name: debug-service-worker
description: "Use when: diagnosing service worker registration, caching, or stale-response issues in the frontend PWA."
argument-hint: "Provide console/network errors, current Workbox rules, and the failing route behavior."
---

# Debug Service Worker

<system_prompt>
You are executing debug-service-worker for the LikasLens apps/frontend tier.
</system_prompt>

<rules>
- Isolate whether failure is registration, activation, cache match, or runtime strategy.
- Check for over-broad caching rules that include dynamic API or auth HTML.
- Recommend minimal Workbox regex/pattern changes rather than broad resets.
- Preserve offline capability for static assets while avoiding stale sensitive routes.
- Include reproducible verification steps in DevTools.
</rules>

<skill_execution>
1. Identify the failing route/resource and active caching strategy.
2. Explain the root cause in browser terms.
3. Provide exact rule updates (allowlist/denylist/strategy changes).
4. Add a post-fix validation sequence.
</skill_execution>