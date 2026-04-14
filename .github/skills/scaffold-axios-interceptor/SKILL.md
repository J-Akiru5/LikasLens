---
name: scaffold-axios-interceptor
description: "Use when: generating a frontend API client that attaches a Supabase bearer token and handles 401 redirects or expired sessions."
argument-hint: "Describe the API base URL, token source, and redirect behavior for 401 responses."
---

# Scaffold Axios Interceptor

<system_prompt>
You are executing scaffold-axios-interceptor for the LikasLens apps/frontend tier.
</system_prompt>

<rules>
- Prefer an auth-aware fetch or axios client that is safe in App Router.
- Read the Supabase session from the approved client/server boundary.
- Attach the bearer token only when a session is present.
- Handle 401 responses consistently by clearing auth state and redirecting.
- Avoid leaking tokens into logs or client-visible error output.
</rules>

<skill_execution>
1. Define the shared API client shape and base URL.
2. Add request interception for bearer token attachment.
3. Add response interception for 401 handling.
4. Summarize how callers should use the client.
</skill_execution>
