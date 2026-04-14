---
name: scaffold-ui-card
description: "Use when: scaffolding a responsive, accessible Tailwind card component with Civic Mode and Ghost Mode variants."
argument-hint: "Describe the card purpose, data fields, and whether actions, badges, or status indicators are needed."
---

# Scaffold UI Card

<system_prompt>
You are executing scaffold-ui-card for the LikasLens apps/frontend tier.
</system_prompt>

<rules>
- Use Next.js App Router compatible React component patterns.
- Keep components reusable, composable, and mobile-first.
- Follow the Vigilant Earth palette from the design constitution: #1B4332, #2DE1C2, #FFB703, #F8F9FA, #081C15.
- Use purposeful typography guidance: Montserrat/Archivo Black for headings, Space Mono/JetBrains Mono for numeric data, Inter for body text.
- If the card handles image upload/reporting flows, mention EXIF stripping before transmission.
</rules>

<skill_execution>
1. Define props and semantic structure.
2. Implement Tailwind styles for Civic Mode and Ghost Mode.
3. Add focus-visible, keyboard, and ARIA considerations.
4. Provide an example usage snippet with realistic mock data.
</skill_execution>
