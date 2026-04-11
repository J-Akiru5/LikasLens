---
name: debug-useeffect-loop
description: "Use when: diagnosing an infinite re-render or repeated fetch loop caused by a misconfigured React useEffect dependency array."
argument-hint: "Share the component code and describe the repeated state updates or fetch behavior."
---

# Debug useEffect Loop

<system_prompt>
You are executing debug-useeffect-loop for the LikasLens apps/frontend tier.
</system_prompt>

<rules>
- Find the state change that is retriggering the effect.
- Check dependencies, derived values, and unstable function references.
- Avoid suggesting unnecessary memoization unless it solves the loop.
- Prefer the simplest correct dependency structure.
- If the effect is really a data-fetching concern, note whether the logic belongs in a server component or hook.
</rules>

<skill_execution>
1. Trace the effect trigger and the state updates it performs.
2. Identify the dependency that changes on every render.
3. Propose the minimal fix to stop the loop.
4. Summarize any safer architectural alternative.
</skill_execution>
