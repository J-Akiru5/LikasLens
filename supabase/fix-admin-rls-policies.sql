-- ============================================================
-- FIX: Admin Portal CRUD RLS Policies (IDEMPOTENT)
-- Safe to re-run — drops existing policies before creating.
--
-- The admin portal uses user session tokens (not service role),
-- so tables need INSERT/UPDATE/DELETE policies for authenticated users.
-- ============================================================

-- NGO Groups: allow authenticated INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "auth_insert_ngos" ON ngo_groups;
CREATE POLICY "auth_insert_ngos" ON ngo_groups
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "auth_update_ngos" ON ngo_groups;
CREATE POLICY "auth_update_ngos" ON ngo_groups
  FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "auth_delete_ngos" ON ngo_groups;
CREATE POLICY "auth_delete_ngos" ON ngo_groups
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Environmental Laws: allow authenticated INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "auth_insert_laws" ON environmental_laws_ph;
CREATE POLICY "auth_insert_laws" ON environmental_laws_ph
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "auth_update_laws" ON environmental_laws_ph;
CREATE POLICY "auth_update_laws" ON environmental_laws_ph
  FOR UPDATE USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "auth_delete_laws" ON environmental_laws_ph;
CREATE POLICY "auth_delete_laws" ON environmental_laws_ph
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Users: allow authenticated UPDATE (for soft-delete, role changes)
DROP POLICY IF EXISTS "auth_update_users" ON users;
CREATE POLICY "auth_update_users" ON users
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Currency Settings: allow authenticated UPDATE
DROP POLICY IF EXISTS "auth_update_currency" ON currency_settings;
CREATE POLICY "auth_update_currency" ON currency_settings
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Audit Logs: allow authenticated INSERT (for recording admin actions)
DROP POLICY IF EXISTS "auth_insert_audit_logs" ON audit_logs;
CREATE POLICY "auth_insert_audit_logs" ON audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- FIX: Tickets + Ticket Assignments + Timeline RLS Policies
--
-- The admin portal needs UPDATE/DELETE on the `tickets` table
-- (for status changes, bulk status, delete, triage classification)
-- and INSERT on `ticket_assignments` + `ticket_timeline`.
-- Without these policies, Supabase RLS returns 401 on writes.
-- ============================================================

-- Tickets: allow authenticated UPDATE (status changes, triage, escalation)
DROP POLICY IF EXISTS "auth_update_tickets" ON tickets;
CREATE POLICY "auth_update_tickets" ON tickets
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Tickets: allow authenticated DELETE (bulk delete, single delete)
DROP POLICY IF EXISTS "auth_delete_tickets" ON tickets;
CREATE POLICY "auth_delete_tickets" ON tickets
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Tickets: allow authenticated INSERT (batch sync, manual entry)
DROP POLICY IF EXISTS "auth_insert_tickets" ON tickets;
CREATE POLICY "auth_insert_tickets" ON tickets
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Ticket Assignments: allow authenticated INSERT (bulk assign, single assign)
DROP POLICY IF EXISTS "auth_insert_ticket_assignments" ON ticket_assignments;
CREATE POLICY "auth_insert_ticket_assignments" ON ticket_assignments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Ticket Assignments: allow authenticated UPDATE (reassign, status change)
DROP POLICY IF EXISTS "auth_update_ticket_assignments" ON ticket_assignments;
CREATE POLICY "auth_update_ticket_assignments" ON ticket_assignments
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Ticket Assignments: allow authenticated DELETE (remove assignment)
DROP POLICY IF EXISTS "auth_delete_ticket_assignments" ON ticket_assignments;
CREATE POLICY "auth_delete_ticket_assignments" ON ticket_assignments
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Ticket Timeline: allow authenticated INSERT (status change audit trail)
DROP POLICY IF EXISTS "auth_insert_ticket_timeline" ON ticket_timeline;
CREATE POLICY "auth_insert_ticket_timeline" ON ticket_timeline
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Verify all policies are created
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'ngo_groups',
    'environmental_laws_ph',
    'users',
    'currency_settings',
    'audit_logs',
    'tickets',
    'ticket_assignments',
    'ticket_timeline'
  )
ORDER BY tablename, cmd;
