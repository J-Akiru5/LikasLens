-- ============================================================
-- FIX: Admin Portal RLS Policies — v2 (ROLE-GATED)   (IDEMPOTENT)
-- ============================================================
-- Replaces the outdated fix-admin-rls-policies.sql, which granted
-- write access to ANY authenticated user (auth.uid() IS NOT NULL).
-- That meant any logged-in citizen could delete tickets, edit laws,
-- and change user roles by calling the REST API directly.
--
-- v2 gates every admin write on an actual admin role:
--   super_admin, admin, analyst, lgu, lgu_officer, partner
--
-- Public (anon) behavior is preserved where the products need it:
--   • tickets  INSERT       → citizen report submission (frontend fallback)
--   • tickets  SELECT       → public record, map, feeds
--   • contact_messages INSERT → public contact form
--   • users    INSERT       → registration profile creation
--   • laws / ngos / currency / timeline / assignments SELECT → public reads
--
-- Safe to re-run — drops existing policies before creating.
-- ============================================================

-- ── Role helpers ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE supabase_auth_user_id = auth.uid()
      AND role IN ('super_admin', 'admin', 'analyst', 'lgu', 'lgu_officer', 'partner')
      AND (deleted_at IS NULL)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE supabase_auth_user_id = auth.uid()
      AND role = 'super_admin'
      AND (deleted_at IS NULL)
  );
$$;

-- ── Tickets ─────────────────────────────────────────────────────────────
-- Public read (public record / maps / feeds); citizen INSERT (report
-- submission fallback); admin-only UPDATE/DELETE (status, triage, delete).
DROP POLICY IF EXISTS "public_select_tickets" ON tickets;
CREATE POLICY "public_select_tickets" ON tickets
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_insert_tickets" ON tickets;
CREATE POLICY "public_insert_tickets" ON tickets
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_tickets" ON tickets;
CREATE POLICY "admin_update_tickets" ON tickets
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_tickets" ON tickets;
CREATE POLICY "admin_delete_tickets" ON tickets
  FOR DELETE USING (public.is_admin());

-- ── Ticket Assignments ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "public_select_ticket_assignments" ON ticket_assignments;
CREATE POLICY "public_select_ticket_assignments" ON ticket_assignments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_insert_ticket_assignments" ON ticket_assignments;
CREATE POLICY "admin_insert_ticket_assignments" ON ticket_assignments
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_ticket_assignments" ON ticket_assignments;
CREATE POLICY "admin_update_ticket_assignments" ON ticket_assignments
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_ticket_assignments" ON ticket_assignments;
CREATE POLICY "admin_delete_ticket_assignments" ON ticket_assignments
  FOR DELETE USING (public.is_admin());

-- ── Ticket Timeline ─────────────────────────────────────────────────────
-- Public read (ticket detail / history steps); INSERT open to anon so the
-- citizen submission pipeline can append ghost entries; admin UPDATE/DELETE.
DROP POLICY IF EXISTS "public_select_ticket_timeline" ON ticket_timeline;
CREATE POLICY "public_select_ticket_timeline" ON ticket_timeline
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_insert_ticket_timeline" ON ticket_timeline;
CREATE POLICY "public_insert_ticket_timeline" ON ticket_timeline
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "admin_update_ticket_timeline" ON ticket_timeline;
CREATE POLICY "admin_update_ticket_timeline" ON ticket_timeline
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_ticket_timeline" ON ticket_timeline;
CREATE POLICY "admin_delete_ticket_timeline" ON ticket_timeline
  FOR DELETE USING (public.is_admin());

-- ── NGOs ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "public_select_ngos" ON ngo_groups;
CREATE POLICY "public_select_ngos" ON ngo_groups
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_insert_ngos" ON ngo_groups;
CREATE POLICY "admin_insert_ngos" ON ngo_groups
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_ngos" ON ngo_groups;
CREATE POLICY "admin_update_ngos" ON ngo_groups
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_ngos" ON ngo_groups;
CREATE POLICY "admin_delete_ngos" ON ngo_groups
  FOR DELETE USING (public.is_admin());

-- ── Environmental Laws ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "public_select_laws" ON environmental_laws_ph;
CREATE POLICY "public_select_laws" ON environmental_laws_ph
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_insert_laws" ON environmental_laws_ph;
CREATE POLICY "admin_insert_laws" ON environmental_laws_ph
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_laws" ON environmental_laws_ph;
CREATE POLICY "admin_update_laws" ON environmental_laws_ph
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_laws" ON environmental_laws_ph;
CREATE POLICY "admin_delete_laws" ON environmental_laws_ph
  FOR DELETE USING (public.is_admin());

-- ── Users ───────────────────────────────────────────────────────────────
-- Public read (leaderboard / profiles); anon INSERT (registration);
-- UPDATE restricted to super_admin (role management, soft-delete).
DROP POLICY IF EXISTS "public_select_users" ON users;
CREATE POLICY "public_select_users" ON users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_insert_users" ON users;
CREATE POLICY "public_insert_users" ON users
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "super_admin_update_users" ON users;
CREATE POLICY "super_admin_update_users" ON users
  FOR UPDATE USING (public.is_super_admin());

-- ── Currency Settings ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "public_select_currency" ON currency_settings;
CREATE POLICY "public_select_currency" ON currency_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_insert_currency" ON currency_settings;
CREATE POLICY "admin_insert_currency" ON currency_settings
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_currency" ON currency_settings;
CREATE POLICY "admin_update_currency" ON currency_settings
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_currency" ON currency_settings;
CREATE POLICY "admin_delete_currency" ON currency_settings
  FOR DELETE USING (public.is_admin());

-- ── Contact Messages (Inquiries) ────────────────────────────────────────
-- Public INSERT (contact form); admin-only read / update / delete.
DROP POLICY IF EXISTS "public_insert_contact_messages" ON contact_messages;
CREATE POLICY "public_insert_contact_messages" ON contact_messages
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "admin_select_contact_messages" ON contact_messages;
CREATE POLICY "admin_select_contact_messages" ON contact_messages
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "admin_update_contact_messages" ON contact_messages;
CREATE POLICY "admin_update_contact_messages" ON contact_messages
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_contact_messages" ON contact_messages;
CREATE POLICY "admin_delete_contact_messages" ON contact_messages
  FOR DELETE USING (public.is_admin());

-- ── Audit Logs ──────────────────────────────────────────────────────────
-- Admin-only across the board. The service-role API routes and the
-- AI service write audit entries with the service key (bypasses RLS).
DROP POLICY IF EXISTS "admin_select_audit_logs" ON audit_logs;
CREATE POLICY "admin_select_audit_logs" ON audit_logs
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_audit_logs" ON audit_logs;
CREATE POLICY "admin_insert_audit_logs" ON audit_logs
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_audit_logs" ON audit_logs;
CREATE POLICY "admin_update_audit_logs" ON audit_logs
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_audit_logs" ON audit_logs;
CREATE POLICY "admin_delete_audit_logs" ON audit_logs
  FOR DELETE USING (public.is_admin());

-- ── Rewards ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "public_select_rewards_catalog" ON rewards_catalog;
CREATE POLICY "public_select_rewards_catalog" ON rewards_catalog
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_insert_rewards_catalog" ON rewards_catalog;
CREATE POLICY "admin_insert_rewards_catalog" ON rewards_catalog
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_rewards_catalog" ON rewards_catalog;
CREATE POLICY "admin_update_rewards_catalog" ON rewards_catalog
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_rewards_catalog" ON rewards_catalog;
CREATE POLICY "admin_delete_rewards_catalog" ON rewards_catalog
  FOR DELETE USING (public.is_admin());

-- ── Verify ──────────────────────────────────────────────────────────────
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'tickets',
    'ticket_assignments',
    'ticket_timeline',
    'ngo_groups',
    'environmental_laws_ph',
    'users',
    'currency_settings',
    'contact_messages',
    'audit_logs',
    'rewards_catalog'
  )
ORDER BY tablename, cmd;
