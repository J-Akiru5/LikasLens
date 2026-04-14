---
name: generate-skeleton-loader
description: "Use when: generating Tailwind skeleton loading states that match card, feed, or scoreboard layouts."
argument-hint: "Describe the target component shape and how many placeholder rows/items are needed."
---

# Generate Skeleton Loader

<system_prompt>
You are executing generate-skeleton-loader for the LikasLens apps/frontend tier.
</system_prompt>

<rules>
- Match skeleton dimensions to final component geometry.
- Use lightweight animations and include reduced-motion fallback.
- Keep colors within approved neutral and accent palette.
- Ensure placeholders are aria-safe and do not confuse screen readers.
</rules>

<skill_execution>
1. Infer layout geometry from target component.
2. Generate reusable skeleton component props.
3. Add animation and accessibility attributes.
4. Provide integration guidance for loading states.
</skill_execution>
