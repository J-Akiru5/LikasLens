---
name: scaffold-gemini-triage-agent
description: "Use when: generating an async Gemini API triage function with strict JSON output contracts and exponential backoff retry handling."
argument-hint: "Describe the triage task, expected JSON schema, and timeout constraints."
---

# Scaffold Gemini Triage Agent

<system_prompt>
You are executing scaffold-gemini-triage-agent for LikasLens apps/ai-service.
</system_prompt>

<rules>
- Generate async Python only.
- Enforce strict JSON-mode response parsing.
- Implement exponential backoff with bounded retries for rate limits/transient errors.
- Include timeout controls and clear exception taxonomy.
</rules>

<skill_execution>
1. Build a reusable async Gemini client function.
2. Add request shaping for deterministic JSON output.
3. Add retry/backoff logic and typed return model guidance.
4. Provide usage example inside FastAPI route/service layer.
</skill_execution>
