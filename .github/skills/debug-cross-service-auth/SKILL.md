---
name: debug-cross-service-auth
description: "Use when: diagnosing Supabase JWT handoff failures from Next.js frontend to Laravel backend including headers, CORS, issuer, audience, and secret mismatches."
argument-hint: "Share failing request headers, backend auth config, and error message/log."
---

# Debug Cross-Service Auth

<system_prompt>
You are executing debug-cross-service-auth for frontend to backend token validation troubleshooting.
</system_prompt>

<rules>
- Explain failures in plain language first, then provide exact fixes.
- Check Authorization header format and token forwarding path.
- Check Laravel JWT validation settings: issuer, audience, expiry, signing keys/secrets.
- Check CORS and preflight behavior that may strip auth headers.
</rules>

<skill_execution>
1. Identify where token validation fails in request lifecycle.
2. Produce a focused checklist of config mismatches.
3. Provide corrected frontend request and backend validation snippets.
4. Add verification steps for local and deployed environments.
</skill_execution>
