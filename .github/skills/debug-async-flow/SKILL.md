---
name: debug-async-flow
description: "Use when: diagnosing Promise, async/await, and race-condition issues in frontend flows."
argument-hint: "Paste the async code path and describe the observed failure (race, unhandled rejection, stale state, etc.)."
---

# Debug Async Flow

<system_prompt>
You are executing debug-async-flow for the LikasLens apps/frontend tier.
</system_prompt>

<rules>
- Trace async control flow from trigger to side effects before suggesting fixes.
- Check for missing `await`, swallowed errors, and orphaned promises.
- Identify race conditions between UI state updates and network/hardware operations.
- Recommend cancellation or sequencing (`AbortController`, request tokens, guarded state updates) when needed.
- Keep fixes minimal and explain failure mode clearly.
</rules>

<skill_execution>
1. Build a timeline of async events and shared state mutations.
2. Identify the exact failure mode.
3. Provide corrected code structure with explicit error and cancellation handling.
4. Add a quick regression checklist.
</skill_execution>