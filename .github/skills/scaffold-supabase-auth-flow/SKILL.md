---
name: scaffold-supabase-auth-flow
description: 'Scaffolds a complete Next.js App Router login/register boilerplate using @supabase/ssr, shadcn/ui components, and URL-parameter-based toast notifications.'
argument-hint: 'Run this to generate the Supabase utility files, Auth Server Actions, Middleware, and the Login UI.'
---

# Scaffold Supabase Auth Flow

<system_prompt>
You are executing the `scaffold-supabase-auth-flow` skill for the LikasLens `apps/frontend` tier. Your objective is to build a secure, HTTP-only cookie authentication pipeline using `@supabase/ssr` and Next.js 14+ Server Actions, styled with `shadcn/ui`.
</system_prompt>

<rules>
- **Strict Boundaries:** All database mutations (login/signup) MUST occur in Server Actions, not Client Components.
- **Cookie Management:** Use the `@supabase/ssr` package to ensure cookies are safely set and read across Server Components, Client Components, and Middleware.
- **UI & Styling:** Assume `shadcn/ui` is available. Use `<Input>`, `<Button>`, and `<Toast>` components. Do not write raw HTML forms without Tailwind styling.
- **Error Handling:** Server Actions must NEVER throw raw errors to the client. On failure, use `redirect('/login?error=Your+Message')`. On success, redirect to `/dashboard`.
- **Client Reactivity:** The login page MUST be a Client Component that uses `useSearchParams` and `useEffect` to trigger a `shadcn` toast when an `error` or `message` parameter is present in the URL.
</rules>

<skill_execution>
  <step>
    **Phase 1: Utility Generation**
    Create the three standard `@supabase/ssr` utility files in `apps/frontend/utils/supabase/`:
    1. `server.ts` (using `cookies()`)
    2. `client.ts` (using `createBrowserClient`)
    3. `middleware.ts` (handling the request/response cookie refresh loop)
  </step>
  
  <step>
    **Phase 2: Route Protection (Middleware)**
    Update or create `apps/frontend/middleware.ts` to consume `utils/supabase/middleware.ts`. Ensure it intercepts requests to `/dashboard` and redirects unauthenticated users to `/login`.
  </step>

  <step>
    **Phase 3: Server Actions**
    Create `apps/frontend/app/actions/auth.ts`. Write two asynchronous functions: `signIn(formData: FormData)` and `signUp(formData: FormData)`. 
    - Parse email and password from the formData.
    - Instantiate the Supabase server client.
    - Handle the auth call. 
    - `redirect('/dashboard')` on success, or `redirect('/login?error=[Supabase Error Message]')` on failure.
  </step>

  <step>
    **Phase 4: Login UI Construction**
    Create `apps/frontend/app/login/page.tsx` as a `"use client"` component.
    - Implement a form mapping to the `signIn` and `signUp` Server Actions (using the `action` attribute).
    - Import `shadcn/ui` components for the layout.
    - Implement `useSearchParams()` from `next/navigation`.
    - Write a `useEffect` block that checks for `error` or `message` in the URL parameters and triggers the `useToast()` hook accordingly.
  </step>
  
  <step>
    **Phase 5: Output Generation**
    Output the exact code for the generated files in structured markdown blocks, clearly indicating the file path above each block.
  </step>
</skill_execution>