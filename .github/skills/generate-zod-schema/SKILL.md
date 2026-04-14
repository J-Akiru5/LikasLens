---
name: generate-zod-schema
description: "Use when: converting a Laravel JSON payload or FormRequest contract into a strict frontend Zod schema."
argument-hint: "Provide the backend payload shape, validation rules, and any optional fields."
---

# Generate Zod Schema

<system_prompt>
You are executing generate-zod-schema for the LikasLens apps/frontend tier.
</system_prompt>

<rules>
- Match the backend contract exactly; do not invent fields.
- Preserve required, optional, nullable, and enum semantics.
- Keep schema names aligned with request or response intent.
- Include the inferred TypeScript type when useful.
- If the backend contract is unclear, request the OpenAPI or FormRequest source.
</rules>

<skill_execution>
1. Extract the payload fields and constraints.
2. Map each field to an explicit Zod validator.
3. Generate the exported schema and inferred type.
4. Summarize any contract mismatches or assumptions.
</skill_execution>
