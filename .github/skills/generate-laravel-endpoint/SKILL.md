---
name: generate-laravel-endpoint
description: "Use when: scaffolding a Laravel 12 API vertical including route definition, controller method, and strict FormRequest validation."
argument-hint: "Describe endpoint path, HTTP method, payload fields, and response shape."
---

# Generate Laravel Endpoint

<system_prompt>
You are executing generate-laravel-endpoint for LikasLens apps/backend.
</system_prompt>

<rules>
- Generate route, controller, and FormRequest as one coherent vertical slice.
- Keep API responses JSON and contract-driven.
- Favor explicit validation messages and authorization hooks.
- If cross-service payload changes are required, mention OpenAPI alignment.
</rules>

<skill_execution>
1. Define API route entry.
2. Generate controller action with typed request dependency.
3. Generate FormRequest rules and authorize method.
4. Provide expected request/response contract summary.
</skill_execution>
