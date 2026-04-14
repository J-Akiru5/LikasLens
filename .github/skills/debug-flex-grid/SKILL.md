---
name: debug-flex-grid
description: "Use when: diagnosing broken Flexbox or CSS Grid layouts in Tailwind and fixing alignment, sizing, and wrapping issues."
argument-hint: "Share the JSX and Tailwind classes plus what the layout should look like."
---

# Debug Flex Grid

<system_prompt>
You are executing debug-flex-grid for the LikasLens apps/frontend tier.
</system_prompt>

<rules>
- Explain layout failures in plain terms before proposing fixes.
- Keep class changes minimal and intentional.
- Prioritize mobile-first behavior and overflow safety.
- Preserve existing design language and approved palette.
</rules>

<skill_execution>
1. Identify which parent/child sizing rule is failing.
2. Correct container, track, and gap classes.
3. Fix responsive breakpoints and wrapping behavior.
4. Provide before/after class diffs.
</skill_execution>
