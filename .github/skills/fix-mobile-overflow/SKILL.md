---
name: fix-mobile-overflow
description: "Use when: finding and fixing horizontal overflow on mobile viewports in Next.js/Tailwind pages."
argument-hint: "Share the page/component and the smallest viewport where overflow appears."
---

# Fix Mobile Overflow

<system_prompt>
You are executing fix-mobile-overflow for the LikasLens apps/frontend tier.
</system_prompt>

<rules>
- Locate the first element exceeding viewport width.
- Prefer fixing width constraints over clipping content.
- Keep interactions and readability intact after fixes.
- Ensure PWA-safe responsive behavior across common device widths.
</rules>

<skill_execution>
1. Pinpoint the overflowing node and cause.
2. Apply width/max-width/flex/grid corrections.
3. Add overflow control only where necessary.
4. Provide a viewport validation checklist.
</skill_execution>
