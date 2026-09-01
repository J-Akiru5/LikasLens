-- ============================================================
-- FIX: Admin Portal RLS Policies — v3 (DROP LEGACY HOLES)
-- ============================================================
-- v2 (fix-admin-rls-v2.sql) added role-gated admin_* policies, but it did
-- NOT drop the legacy policies from fix-admin-rls-policies.sql. RLS policies
-- OR together — so the old `auth_uid() IS NOT NULL` policies STILL allow any
-- logged-in user (and in two cases, even anonymous visitors) to write.
--
-- Proven exploits (before this file):
--   1. ANONYMOUS (no login): PATCH users SET role='admin'  → HTTP 204 ✓
--   2. LOGGED-IN CITIZEN:    PATCH own row role='admin'     → HTTP 204 ✓
--   3. LOGGED-IN CITIZEN:    PATCH super_admin row name     → HTTP 204 ✓
--      (all three verified via read-back of the changed row)
--
-- This file drops every legacy `auth_*` / `anon_*` policy and locks down
-- the `users` table with column-level grants so self-profile updates can't
-- touch role/password/trust columns.
--
-- Safe to re-run (DROP IF EXISTS).
-- ============================================================

-- ── tickets ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "auth_insert_tickets" ON tickets;
DROP POLICY IF EXISTS "auth_update_tickets" ON tickets;
DROP POLICY IF EXISTS "auth_delete_tickets" ON tickets;
-- duplicate legacy read
DROP POLICY IF EXISTS "public_read_tickets" ON tickets;

-- ── ticket_assignments ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "auth_insert_ticket_assignments" ON ticket_assignments;
DROP POLICY IF EXISTS "auth_update_ticket_assignments" ON ticket_assignments;
DROP POLICY IF EXISTS "auth_delete_ticket_assignments" ON ticket_assignments;

-- ── ticket_timeline ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "auth_insert_timeline" ON ticket_timeline;
DROP POLICY IF EXISTS "auth_insert_ticket_timeline" ON ticket_timeline;
-- duplicate legacy read
DROP POLICY IF EXISTS "public_read_timeline" ON ticket_timeline;

-- ── ngo_groups ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "auth_insert_ngos" ON ngo_groups;
DROP POLICY IF EXISTS "auth_update_ngos" ON ngo_groups;
DROP POLICY IF EXISTS "auth_delete_ngos" ON ngo_groups;
-- duplicate legacy read
DROP POLICY IF EXISTS "public_read_ngos" ON ngo_groups;

-- ── environmental_laws_ph ───────────────────────────────────────────────
DROP POLICY IF EXISTS "auth_insert_laws" ON environmental_laws_ph;
DROP POLICY IF EXISTS "auth_update_laws" ON environmental_laws_ph;
DROP POLICY IF EXISTS "auth_delete_laws" ON environmental_laws_ph;
-- duplicate legacy read
DROP POLICY IF EXISTS "public_read_laws" ON environmental_laws_ph;

-- ── currency_settings ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "auth_update_currency" ON currency_settings;
-- duplicate legacy read
DROP POLICY IF EXISTS "public_read_currency" ON currency_settings;

-- ── contact_messages ────────────────────────────────────────────────────
-- any logged-in user could update inquiries
DROP POLICY IF EXISTS "auth_update_contact" ON contact_messages;
-- duplicate legacy policies
DROP POLICY IF EXISTS "public_insert_contact" ON contact_messages;
DROP POLICY IF EXISTS "admin_read_contact_messages" ON contact_messages;

-- ── audit_logs ──────────────────────────────────────────────────────────
-- any logged-in user could forge audit entries
DROP POLICY IF EXISTS "auth_insert_audit_logs" ON audit_logs;
-- duplicate legacy read
DROP POLICY IF EXISTS "admin_read_audit_logs" ON audit_logs;

-- ── rewards_catalog ─────────────────────────────────────────────────────
-- duplicate legacy read
DROP POLICY IF EXISTS "public_read_rewards" ON rewards_catalog;

-- ── users ───────────────────────────────────────────────────────────────
-- CRITICAL: unauthenticated visitors could UPDATE any user (role esc.)
DROP POLICY IF EXISTS "anon_select_users" ON users;
DROP POLICY IF EXISTS "anon_update_users" ON users;
-- any logged-in user could UPDATE any user row (role esc.)
DROP POLICY IF EXISTS "auth_update_users" ON users;
-- allow self-profile UPDATE only — recreated safely below
DROP POLICY IF EXISTS "auth_update_own_user" ON users;
-- duplicate legacy read
DROP POLICY IF EXISTS "public_read_users" ON users;

-- ────────────────────────────────────────────────────────────────────────
-- Safe replacement policies
-- ────────────────────────────────────────────────────────────────────────

-- Citizens may update ONLY their own profile row (name, avatar, etc.).
DROP POLICY IF EXISTS "auth_update_own_profile" ON users;
CREATE POLICY "auth_update_own_profile" ON users
  FOR UPDATE
  USING (auth.uid() = supabase_auth_user_id)
  WITH CHECK (auth.uid() = supabase_auth_user_id);

-- Tighten public registration: anon INSERT may only create role 'citizen' rows.
-- (Admin/analyst/lgu/officer rows are created by the AI service, which writes
--  with its own privileged DB connection — unaffected by this policy.)
DROP POLICY IF EXISTS "public_insert_users" ON users;
CREATE POLICY "public_insert_users" ON users
  FOR INSERT WITH CHECK (role = 'citizen');

-- ────────────────────────────────────────────────────────────────────────
-- Column-level grants on `users` (defense in depth)
-- Even if a policy ever matches, anon/authenticated cannot touch these
-- columns. The AI service (service-role DB writes) is unaffected.
-- ────────────────────────────────────────────────────────────────────────
REVOKE UPDATE (role, password, remember_token, email, trust_score,
       reward_points_balance, total_verified_reports, total_xp,
       ranking_tier, deleted_at, supabase_auth_user_id)
  ON users FROM anon, authenticated;

REVOKE INSERT (role, password, remember_token, trust_score,
       reward_points_balance, total_verified_reports, total_xp,
       ranking_tier, deleted_at, supabase_auth_user_id)
  ON users FROM anon, authenticated;

REVOKE SELECT (password, remember_token) ON users FROM anon, authenticated;

-- ────────────────────────────────────────────────────────────────────────
-- Verify: no auth_*/anon_* policies should remain
-- ────────────────────────────────────────────────────────────────────────
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND (policyname LIKE 'auth\_%' OR policyname LIKE 'anon\_%')
ORDER BY tablename, policyname;