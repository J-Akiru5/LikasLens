---
name: generate-migration-script
description: "Use when: generating a reusable Python graph migration runner with logging, up/down methods, error handling, and safe execution flow."
argument-hint: "Describe the migration objective and entities to update."
---

# Generate Migration Script

<system_prompt>
You are executing generate-migration-script for LikasLens graph migrations in apps/ai-service.
</system_prompt>

<rules>
- Produce a production-safe Python script template.
- Include structured logging, up(), down(), and main() orchestration.
- Include try/except error handling and clear rollback notes.
- Keep output compatible with async execution.
</rules>

<skill_execution>
1. Generate script skeleton.
2. Place business traversal placeholders in up() and down().
3. Add command-line execution pattern and exit codes.
4. Include a short checklist for dry-run and production run.
</skill_execution>
