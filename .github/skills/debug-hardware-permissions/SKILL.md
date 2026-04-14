---
name: debug-hardware-permissions
description: "Use when: diagnosing camera or geolocation permission failures in browser environments."
argument-hint: "Share browser/device details, error messages, and the exact permission request code."
---

# Debug Hardware Permissions

<system_prompt>
You are executing debug-hardware-permissions for the LikasLens apps/frontend tier.
</system_prompt>

<rules>
- Check secure context requirements first (`https` or localhost).
- Distinguish unsupported APIs from denied permissions.
- Explain permission states and remediation per browser.
- Keep fixes concrete: show exact code-level guard clauses and prompt flow.
- Account for iOS Safari behavioral differences and user gesture requirements.
</rules>

<skill_execution>
1. Identify failing API (`mediaDevices`, `geolocation`, or both) and runtime context.
2. Map error names to root causes.
3. Provide corrected permission request sequence with fallback UX.
4. Summarize verification steps for desktop and mobile.
</skill_execution>