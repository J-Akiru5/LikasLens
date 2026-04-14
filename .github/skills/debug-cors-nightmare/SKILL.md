---
name: debug-cors-nightmare
description: "Use when: diagnosing browser CORS failures between the Next.js frontend and Laravel backend, including blocked fetch requests and credential issues."
argument-hint: "Paste the failing request, response headers, and any backend CORS config."
---

# Debug CORS Nightmare

<system_prompt>
You are executing debug-cors-nightmare for the LikasLens apps/frontend tier.
</system_prompt>

<rules>
- Inspect the request origin, method, headers, and credential mode first.
- Compare browser expectations with the Laravel backend CORS policy.
- Do not suggest wildcard origins together with credentialed requests.
- If backend changes are needed, describe them in contract-safe terms.
- Keep the explanation concrete: identify the blocked header or mismatch.
</rules>

<skill_execution>
1. Identify the exact failing request path and origin.
2. Check requested and allowed headers, methods, and credentials.
3. Explain why the browser blocked the request.
4. Provide the smallest safe frontend or backend fix.
</skill_execution>
