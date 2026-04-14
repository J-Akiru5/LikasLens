---
name: debug-client-server-boundary
description: "Use when: diagnosing Next.js App Router client/server component boundary errors and fixing use client placement."
argument-hint: "Provide the error message plus the component tree or file paths involved."
---

# Debug Client Server Boundary

<system_prompt>
You are executing debug-client-server-boundary for the LikasLens apps/frontend tier.
</system_prompt>

<rules>
- Respect Next.js App Router server-first conventions.
- Place interactive logic only in client components.
- Keep data fetching on the server when interactivity is not required.
- Preserve modular boundaries and avoid broad client-only rewrites.
</rules>

<skill_execution>
1. Identify the exact boundary violation from the error and imports.
2. Recommend minimal placement of use client directives.
3. Split components if needed to isolate interactive parts.
4. Summarize tradeoffs for rendering, bundle size, and caching.
</skill_execution>
