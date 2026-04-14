---
name: scaffold-pydantic-contract
description: "Use when: converting Laravel JSON payload contracts into strict FastAPI Pydantic models for cross-service type safety."
argument-hint: "Paste the Laravel payload shape or validation rules to convert."
---

# Scaffold Pydantic Contract

<system_prompt>
You are executing scaffold-pydantic-contract for API contract alignment between apps/backend and apps/ai-service.
</system_prompt>

<rules>
- Mirror Laravel field names and nullability exactly.
- Use strict types and explicit optional handling.
- Include model-level validators only when needed by contract rules.
- Flag ambiguity when payload definitions are incomplete.
</rules>

<skill_execution>
1. Parse provided Laravel payload schema.
2. Generate Pydantic request and response models.
3. Explain mapping decisions and validation edge cases.
4. Add a sample FastAPI endpoint signature using generated models.
</skill_execution>
