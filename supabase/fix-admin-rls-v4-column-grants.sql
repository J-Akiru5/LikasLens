-- ============================================================
-- FIX: Admin Portal RLS — v4 (CLOSE REMAINING WRITE HOLES)
-- ============================================================
-- v3 dropped the legacy auth_* / anon_* POLICY names, but two issues
-- remained (verified by live probes AFTER v3 ran):
--
--   1. users table: Supabase grants TABLE-LEVEL UPDATE on `users` to
--      anon/authenticated. A COLUMN-level REVOKE does not override a
--      table-level grant, so citizens could STILL change their own
--      role (probe: PATCH role='lgu' → 204, read-back [{"role":"lgu"}]).
--      Fix: REVOKE table-level UPDATE/INSERT/SELECT, then re-grant only
--      the columns the products legitimately need.
--
--   2. notifications / reports / ticket_evidence still had auth_*
--      write policies (they OR together with the read policies):
--        auth_insert_notifications, auth_update_notifications   → any
--          logged-in user can forge/mark notifications for everyone
--        auth_update_reports                                    → any
--          logged-in user can flip report status / evidence hashes
--        auth_insert_evidence, auth_update_evidence             → any
--          logged-in user can attach/forge evidence on ANY ticket
--      The Next.js apps only READ these tables (reports/ticket_evidence
--      via API routes / AI service DB; notifications read via public
--      SELECT). After dropping these, citizen writes go through the
--      AI service (service-role / own DB), which bypasses RLS.
--
-- Safe to re-run (DROP IF EXISTS / idempotent).
-- ============================================================

-- ── reports ─────────────────────────────────────────────────────────────
-- (citizen photo-submission staging table; only the AI service writes it)
DROP POLICY IF EXISTS "auth_update_reports" ON reports;
DROP POLICY IF EXISTS "auth_insert_reports" ON reports;

-- ── notifications ───────────────────────────────────────────────────────
-- (system-generated; marks-as-read currently go through the sessionless
--  shared client, which cannot pass auth.uid() — those writes already
--  failed. Reads stay public.)
DROP POLICY IF EXISTS "auth_insert_notifications" ON notifications;
DROP POLICY IF EXISTS "auth_update_notifications" ON notifications;

-- ── ticket_evidence ─────────────────────────────────────────────────────
-- (uploads/checksums managed by the AI service storage pipeline)
DROP POLICY IF EXISTS "auth_insert_evidence" ON ticket_evidence;
DROP POLICY IF EXISTS "auth_update_evidence" ON ticket_evidence;

-- ────────────────────────────────────────────────────────────────────────
-- users: replace table-level grants with column-level grants
-- ────────────────────────────────────────────────────────────────────────
-- Remove table-level UPDATE/INSERT/SELECT for anon + authenticated.
-- (keeps DELETE revoked — already the case)
REVOKE ALL ON users FROM anon, authenticated;

-- SELECT: everything the products read (NOT password / remember_token)
GRANT SELECT (
  id,
  supabase_auth_user_id,
  name,
  email,
  role,
  trust_score,
  reward_points_balance,
  email_verified_at,
  created_at,
  updated_at,
  deleted_at,
  total_verified_reports,
  total_xp,
  ranking_tier,
  country_code,
  tenant_id
) ON users TO anon, authenticated;

-- INSERT: citizen registration creates their own profile row.
-- RLS policy `public_insert_users` already constrains role='citizen'.
GRANT INSERT (id, supabase_auth_user_id, name, email, role, created_at, updated_at)
  ON users TO anon, authenticated;

-- UPDATE: citizens may edit ONLY their own display name (+ email_verified_at
-- is system-maintained by Supabase auth). The RLS policy
-- `auth_update_own_profile` restricts the ROW to auth.uid() = supabase_auth_user_id;
-- column grants restrict WHICH columns may change.
GRANT UPDATE (name) ON users TO authenticated;

-- ────────────────────────────────────────────────────────────────────────
-- Verify: confirm no auth_*/anon_* writable policies remain on these tables
-- ────────────────────────────────────────────────────────────────────────
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'notifications', 'reports', 'ticket_evidence')
ORDER BY tablename, cmd;