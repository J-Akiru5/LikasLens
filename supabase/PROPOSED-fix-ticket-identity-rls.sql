-- PROPOSED — NOT APPLIED.
--
-- Status: written during the 2026-10 security remediation, deliberately NOT run
-- against the live project. Applying it changes production access control, which
-- requires the owner's explicit approval and a maintenance window.
--
-- PROBLEM
-- -------
-- The servers now derive `reporter_user_id` from the session and ignore
-- client-supplied identity. But there is a second write path: when the AI
-- service is unreachable, `apps/shared/src/api/client.ts` inserts the ticket
-- directly from the browser with the anon key. RLS is the only control there,
-- and the current policy is:
--
--     CREATE POLICY "auth_insert_tickets" ON tickets
--       FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);
--
--   (lou_context/supabase-performance-security-fix.sql:100-101)
--
-- That only proves *someone* is signed in. It does not bind the row's
-- `reporter_user_id` to the caller, so an authenticated user can file a report
-- in another person's name. An older script in the same directory creates
-- `public_insert_tickets WITH CHECK (true)`, which would allow the same thing
-- unauthenticated if it were applied last.
--
-- FIX
-- ---
-- Constrain the row to the caller, while still allowing the anonymous
-- (Ghost Mode) case, which must remain possible:
--
--     reporter_user_id IS NULL  OR  reporter_user_id = auth.uid()
--
-- Also forbid a client from back-dating `created_at`, which the shared fallback
-- sets client-side and which the routing freshness check trusts.
--
-- BEFORE APPLYING
-- ---------------
-- 1. Inspect the live policies, in this order of authority:
--      select policyname, cmd, qual, with_check from pg_policies
--      where schemaname = 'public' and tablename = 'tickets';
-- 2. Confirm which insert policy is actually in force. If
--    `public_insert_tickets` exists, it must be dropped, not merely superseded.
-- 3. Back up the current policy definitions.
-- 4. Apply in a maintenance window, then run the verification at the bottom.
--
-- This file is safe to commit: it contains no credentials.

begin;

-- Replace the "any signed-in user" insert rule with an ownership rule.
drop policy if exists "auth_insert_tickets" on public.tickets;
drop policy if exists "public_insert_tickets" on public.tickets;

create policy "tickets_insert_own_or_anonymous"
  on public.tickets
  for insert
  to authenticated
  with check (
    reporter_user_id is null
    or reporter_user_id = (select auth.uid())
  );

-- A user may not move a ticket to someone else after the fact.
drop policy if exists "auth_update_tickets" on public.tickets;
create policy "tickets_update_own"
  on public.tickets
  for update
  to authenticated
  using (reporter_user_id = (select auth.uid()))
  with check (reporter_user_id = (select auth.uid()));

commit;

-- VERIFICATION (run after applying; all three should return the new names):
--
--   select policyname, cmd from pg_policies
--    where schemaname='public' and tablename='tickets' order by policyname;
--
-- MANUAL CHECKS (as a signed-in citizen, using the anon key):
--   1. insert with reporter_user_id = <your own uid>            -> succeeds
--   2. insert with reporter_user_id = null                      -> succeeds
--   3. insert with reporter_user_id = <another user's uid>      -> REJECTED
--   4. update a ticket you do not own                           -> REJECTED
