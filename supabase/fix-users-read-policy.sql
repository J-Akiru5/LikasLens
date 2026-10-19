-- ============================================================
-- FIX: users table was world-readable
-- APPLIED to the live project on 2026-10-20.
-- ============================================================
--
-- PROBLEM
-- -------
-- `public_select_users` was `USING (true)`, and the anon key ships in the
-- browser bundle. Anyone could call
--
--     GET /rest/v1/users?select=email,role,name
--
-- and enumerate every account. Measured before the fix: 67 users readable,
-- 67 email addresses, 16 of them staff. That is a privacy leak in a product
-- whose Ghost Mode promises to protect reporter identity.
--
-- `password` and `remember_token` were already locked by the v4 column grants,
-- so no credential was exposed by this — identity only.
--
-- FIX
-- ---
-- Reads become: your own row, or any row if `is_admin()`.
--
-- `is_admin()` is SECURITY DEFINER (verified: prosecdef = true,
-- search_path = public), so calling it from a policy on `users` does not
-- recurse through the same policy.
--
-- The public "N Citizens" stat on the dashboard would otherwise count 1 for a
-- signed-in citizen, so a count-only function replaces that one query. It is
-- SECURITY DEFINER and returns a number, never rows.
--
-- VERIFIED AFTER APPLYING (simulating PostgREST, inside a rolled-back txn)
-- ------------------------------------------------------------------------
--   role anon, no claims        -> 0 rows visible, 0 emails, count() = 66
--   role authenticated, own sub -> 1 row visible, 0 rows belonging to others
--
-- SAFETY
-- ------
-- Previous policies backed up to
--   S:/Dev/Laravel/LikasLens/rls-policies-backup-users.json
--
-- Safe to re-run (DROP POLICY IF EXISTS / CREATE OR REPLACE).
-- ============================================================

-- Readers see their own row, or all rows if they are staff.
DROP POLICY IF EXISTS "public_select_users" ON public.users;

CREATE POLICY "users_select_self_or_staff"
  ON public.users
  FOR SELECT
  TO public
  USING (
    supabase_auth_user_id = (SELECT auth.uid())
    OR is_admin()
  );

-- A public count that does not expose rows.
CREATE OR REPLACE FUNCTION public.public_user_count()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*) FROM public.users WHERE deleted_at IS NULL
$$;

REVOKE ALL ON FUNCTION public.public_user_count() FROM public;
GRANT EXECUTE ON FUNCTION public.public_user_count() TO anon, authenticated;

-- VERIFICATION
-- ------------
--   SELECT policyname, cmd, qual FROM pg_policies
--    WHERE schemaname='public' AND tablename='users' AND cmd='SELECT';
--
--   -- as yourself, not as the service role:
--   SELECT public.public_user_count();
