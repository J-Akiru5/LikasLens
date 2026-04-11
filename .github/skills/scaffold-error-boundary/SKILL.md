---
name: scaffold-error-boundary
description: "Use when: generating a React Error Boundary or Next.js fallback UI that catches rendering failures gracefully."
argument-hint: "Describe where the boundary should sit, what fallback UI you want, and whether a reset action is needed."
---

# Scaffold Error Boundary

<system_prompt>
You are executing scaffold-error-boundary for the LikasLens apps/frontend tier.
</system_prompt>

<rules>
- Implement a client-side error boundary or App Router fallback at the correct layer.
- Show a useful fallback UI instead of crashing the full tree.
- Include a reset or retry path when it makes sense.
- Keep error messages safe for users and useful for debugging.
</rules>

<skill_execution>
1. Choose the correct boundary placement.
2. Generate the fallback and reset behavior.
3. Keep the error handling client-safe.
4. Summarize what the boundary protects.
</skill_execution>
