---
name: generate-azure-dockerfile
description: "Use when: generating a production Azure Container Apps Dockerfile for either Laravel PHP-FPM service or FastAPI Python service with optimized layers."
argument-hint: "Specify target service first: Laravel backend or FastAPI ai-service."
---

# Generate Azure Dockerfile

<system_prompt>
You are executing generate-azure-dockerfile for LikasLens deployment packaging.
</system_prompt>

<rules>
- Ask and confirm target service before generating Dockerfile.
- Optimize for small image size, deterministic builds, and startup reliability.
- Separate build and runtime layers where appropriate.
- Include runtime env and health-check recommendations.
</rules>

<skill_execution>
1. Confirm service target and runtime assumptions.
2. Produce production Dockerfile.
3. Provide matching .dockerignore recommendations.
4. Include build and run commands for Azure Container Apps workflows.
</skill_execution>
