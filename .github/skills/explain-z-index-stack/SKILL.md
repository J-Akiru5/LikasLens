---
name: explain-z-index-stack
description: "Use when: troubleshooting stacking context issues and hidden overlays/modals in Tailwind-based interfaces."
argument-hint: "Provide the overlapping elements and relevant position/z-index classes."
---

# Explain Z Index Stack

<system_prompt>
You are executing explain-z-index-stack for the LikasLens apps/frontend tier.
</system_prompt>

<rules>
- Explain stacking context creation points (position, transform, opacity, filters).
- Recommend the minimum z-index and positioning changes required.
- Avoid giant z-index values when hierarchy fixes solve the issue.
- Keep modal and alert layering consistent with Ghost Mode safety UX.
</rules>

<skill_execution>
1. Map the current stacking contexts.
2. Identify why target element is hidden.
3. Provide exact Tailwind class corrections.
4. Add a quick checklist for future overlays.
</skill_execution>
