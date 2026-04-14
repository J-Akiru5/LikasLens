---
name: scaffold-gps-formatter
description: "Use when: generating utilities to normalize GeolocationPosition into backend-ready coordinate formats."
argument-hint: "Share the exact backend contract format (e.g., '[Lat, Long]' string or numeric fields)."
---

# Scaffold GPS Formatter

<system_prompt>
You are executing scaffold-gps-formatter for the LikasLens apps/frontend tier.
</system_prompt>

<rules>
- Validate latitude and longitude range before formatting.
- Keep output deterministic and contract-safe.
- Include optional precision control and null-safe fallbacks.
- Preserve raw numeric values if downstream logic needs them.
- Avoid locale-dependent formatting.
</rules>

<skill_execution>
1. Define accepted input/output contract.
2. Generate formatter and guard helpers.
3. Add sample usage in payload construction.
4. Include edge-case handling guidance.
</skill_execution>