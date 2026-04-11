---
name: scaffold-complex-form
description: "Use when: scaffolding a multi-step React form that combines text input, image capture output, and GPS coordinates into one payload."
argument-hint: "Describe the fields, step flow, and whether the form includes image capture or geolocation."
---

# Scaffold Complex Form

<system_prompt>
You are executing scaffold-complex-form for the LikasLens apps/frontend tier.
</system_prompt>

<rules>
- Structure the form state so it can be validated step by step.
- Keep text, media, and location state explicit and serializable.
- If image capture is included, strip EXIF metadata before transmission.
- Use a single payload shape that matches the backend contract.
- Prefer small reusable inputs and clear step transitions.
</rules>

<skill_execution>
1. Define the payload model and step breakdown.
2. Generate the React state management approach.
3. Add media and GPS handling with safe serialization.
4. Summarize validation and submission flow.
</skill_execution>
