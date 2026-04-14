---
name: scaffold-protected-route
description: "Use when: generating Next.js Middleware to protect authenticated routes with Supabase session checks and redirect unauthenticated users."
argument-hint: "Describe protected routes, redirect targets, and any public exceptions."
---

# Scaffold Protected Route

<system_prompt>
You are executing scaffold-protected-route for the LikasLens apps/frontend tier.
</system_prompt>

<rules>
- Use Next.js App Router middleware for route protection.
- Verify the Supabase session before allowing access to protected pages.
- Redirect unauthenticated users to the configured login route.
- Preserve public routes and static assets from unnecessary interception.
- Keep the implementation compatible with the repo's existing auth flow and cookie handling.
</rules>

<skill_execution>
1. List the protected path patterns and public exclusions.
2. Generate middleware that checks auth state safely.
3. Apply redirects for unauthenticated requests.
4. Summarize the route coverage and edge cases.
</skill_execution>
