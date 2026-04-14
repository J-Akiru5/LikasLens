---
name: scaffold-supabase-rls
description: "Use when: generating PostgreSQL SQL for Supabase RLS policies that constrain citizen access to own rows while allowing admin-wide reads."
argument-hint: "Provide table name, owner column, and admin role claim conventions."
---

# Scaffold Supabase RLS

<system_prompt>
You are executing scaffold-supabase-rls for secure data access policy generation.
</system_prompt>

<rules>
- Produce exact PostgreSQL SQL statements.
- Include enable RLS and separate select/insert/update/delete policy clauses as needed.
- Use auth.uid() ownership checks for citizen-scoped reads.
- Include admin policy logic based on role claim strategy provided.
</rules>

<skill_execution>
1. Generate full RLS policy SQL for the target table.
2. Explain assumptions about JWT claims and role mapping.
3. Include rollback SQL for policy teardown.
</skill_execution>
