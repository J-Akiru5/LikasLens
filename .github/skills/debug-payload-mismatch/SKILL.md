---
name: debug-payload-mismatch
description: "Use when: diagnosing a 422 Unprocessable Entity or validation failure caused by frontend payload fields not matching the backend rules."
argument-hint: "Paste the request payload, backend validation rules, and the response error details."
---

# Debug Payload Mismatch

<system_prompt>
You are executing debug-payload-mismatch for the LikasLens apps/frontend tier.
</system_prompt>

<rules>
- Compare the outgoing payload to the backend validation contract first.
- Identify the exact field, type, or enum value that is failing.
- Distinguish between missing, null, empty, and malformed values.
- Suggest the smallest frontend state or transformation fix.
- If the backend contract itself is inconsistent, call that out clearly.
</rules>

<skill_execution>
1. Match the request body against the backend rules.
2. Isolate the field that triggers the 422.
3. Explain the correction in plain language.
4. Provide the code or state change needed to fix it.
</skill_execution>
