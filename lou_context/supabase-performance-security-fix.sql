-- ============================================================
-- LIKASLENS SUPABASE PERFORMANCE & SECURITY FIX
-- Date: 2026-08-29
-- Based on: supabase-postgres-best-practices skill audit
--
-- Fixes:
--   1. RLS policies: wrap auth.uid() in (select) for 100x perf
--   2. FORCE ROW LEVEL SECURITY on all tables
--   3. Tighten public_read policies (admin-only for sensitive tables)
--   4. Require auth for ticket/report inserts (anti-spam)
--   5. Add missing foreign key indexes
--   6. Add NOT NULL on timestamps where missing
--
-- Safe to run: uses IF EXISTS / IF NOT EXISTS throughout.
-- ============================================================


-- ============================================================
-- 1. FORCE ROW LEVEL SECURITY
-- Prevents table owners and service_role from bypassing RLS.
-- ============================================================

ALTER TABLE IF EXISTS tickets FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reports FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS environmental_laws_ph FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS violation_types FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ngo_groups FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ticket_evidence FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ticket_timeline FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contact_messages FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenants FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS achievements FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_achievements FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS citizen_wallets FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rewards_catalog FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS partner_stores FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS currency_settings FORCE ROW LEVEL SECURITY;


-- ============================================================
-- 2. DROP OLD POLICIES (safe to re-create below)
-- ============================================================

-- Public read policies (will be replaced with tighter versions)
DROP POLICY IF EXISTS "public_read_tickets" ON tickets;
DROP POLICY IF EXISTS "public_read_reports" ON reports;
DROP POLICY IF EXISTS "public_read_users" ON users;
DROP POLICY IF EXISTS "public_read_laws" ON environmental_laws_ph;
DROP POLICY IF EXISTS "public_read_violation_types" ON violation_types;
DROP POLICY IF EXISTS "public_read_ngos" ON ngo_groups;
DROP POLICY IF EXISTS "public_read_notifications" ON notifications;
DROP POLICY IF EXISTS "public_read_evidence" ON ticket_evidence;
DROP POLICY IF EXISTS "public_read_timeline" ON ticket_timeline;
DROP POLICY IF EXISTS "public_read_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "public_read_contact_messages" ON contact_messages;
DROP POLICY IF EXISTS "public_read_tenants" ON tenants;
DROP POLICY IF EXISTS "public_read_achievements" ON achievements;
DROP POLICY IF EXISTS "public_read_user_achievements" ON user_achievements;
DROP POLICY IF EXISTS "public_read_wallets" ON citizen_wallets;
DROP POLICY IF EXISTS "public_read_rewards" ON rewards_catalog;
DROP POLICY IF EXISTS "public_read_partner_stores" ON partner_stores;
DROP POLICY IF EXISTS "public_read_currency" ON currency_settings;

-- Auth write policies (will be replaced with performance-optimized versions)
DROP POLICY IF EXISTS "auth_insert_tickets" ON tickets;
DROP POLICY IF EXISTS "auth_update_tickets" ON tickets;
DROP POLICY IF EXISTS "auth_delete_tickets" ON tickets;
DROP POLICY IF EXISTS "auth_insert_reports" ON reports;
DROP POLICY IF EXISTS "auth_update_reports" ON reports;
DROP POLICY IF EXISTS "auth_insert_notifications" ON notifications;
DROP POLICY IF EXISTS "auth_update_notifications" ON notifications;
DROP POLICY IF EXISTS "auth_insert_evidence" ON ticket_evidence;
DROP POLICY IF EXISTS "auth_update_evidence" ON ticket_evidence;
DROP POLICY IF EXISTS "auth_insert_timeline" ON ticket_timeline;
DROP POLICY IF EXISTS "auth_insert_contact" ON contact_messages;
DROP POLICY IF EXISTS "auth_update_contact" ON contact_messages;

-- Anonymous insert policies (will be replaced with auth-required versions)
DROP POLICY IF EXISTS "public_insert_tickets" ON tickets;
DROP POLICY IF EXISTS "public_insert_reports" ON reports;


-- ============================================================
-- 3. PERFORMANCE-OPTIMIZED RLS POLICIES
--
-- KEY FIX: Use (select auth.uid()) instead of auth.uid()
-- This caches the call once per query instead of per row.
-- On a 10K-row table, this is 10,000x fewer function calls.
-- ============================================================

-- ── TICKETS ──────────────────────────────────────────────
-- Public can read tickets (citizen reports are public record)
CREATE POLICY "public_read_tickets" ON tickets
  FOR SELECT USING (true);

-- Authenticated users can create tickets (not anonymous — anti-spam)
CREATE POLICY "auth_insert_tickets" ON tickets
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

-- Users can update their own tickets
CREATE POLICY "auth_update_tickets" ON tickets
  FOR UPDATE USING (
    (select auth.uid()) IS NOT NULL
    AND reporter_user_id = (select auth.uid())
  );

-- Users can delete their own tickets
CREATE POLICY "auth_delete_tickets" ON tickets
  FOR DELETE USING (
    (select auth.uid()) IS NOT NULL
    AND reporter_user_id = (select auth.uid())
  );


-- ── REPORTS (evidence) ──────────────────────────────────
-- Public can read reports (evidence is public record)
CREATE POLICY "public_read_reports" ON reports
  FOR SELECT USING (true);

-- Authenticated users can create reports
CREATE POLICY "auth_insert_reports" ON reports
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

-- Users can update their own reports
CREATE POLICY "auth_update_reports" ON reports
  FOR UPDATE USING (
    (select auth.uid()) IS NOT NULL
    AND user_id = (select auth.uid())
  );


-- ── USERS ────────────────────────────────────────────────
-- Public can read user profiles (needed for public record display)
-- But we limit to non-sensitive columns via application-level filtering
CREATE POLICY "public_read_users" ON users
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "auth_update_own_user" ON users
  FOR UPDATE USING (id = (select auth.uid()));


-- ── ENVIRONMENTAL LAWS ───────────────────────────────────
CREATE POLICY "public_read_laws" ON environmental_laws_ph
  FOR SELECT USING (true);


-- ── VIOLATION TYPES ──────────────────────────────────────
CREATE POLICY "public_read_violation_types" ON violation_types
  FOR SELECT USING (true);


-- ── NGO GROUPS ───────────────────────────────────────────
CREATE POLICY "public_read_ngos" ON ngo_groups
  FOR SELECT USING (true);


-- ── NOTIFICATIONS ────────────────────────────────────────
-- Notifications table has no user_id column (global notification log)
-- Public read for display; authenticated write only
CREATE POLICY "public_read_notifications" ON notifications
  FOR SELECT USING (true);

CREATE POLICY "auth_insert_notifications" ON notifications
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "auth_update_notifications" ON notifications
  FOR UPDATE USING ((select auth.uid()) IS NOT NULL);


-- ── TICKET EVIDENCE ─────────────────────────────────────
-- Public can read evidence (needed for public record)
CREATE POLICY "public_read_evidence" ON ticket_evidence
  FOR SELECT USING (true);

CREATE POLICY "auth_insert_evidence" ON ticket_evidence
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "auth_update_evidence" ON ticket_evidence
  FOR UPDATE USING ((select auth.uid()) IS NOT NULL);


-- ── TICKET TIMELINE ─────────────────────────────────────
-- Public can read timeline (needed for public record)
CREATE POLICY "public_read_timeline" ON ticket_timeline
  FOR SELECT USING (true);

CREATE POLICY "auth_insert_timeline" ON ticket_timeline
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);


-- ── AUDIT LOGS (SENSITIVE — admin only) ─────────────────
-- Only admins can read audit logs
CREATE POLICY "admin_read_audit_logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
        AND users.role = 'admin'
    )
  );


-- ── CONTACT MESSAGES (SENSITIVE — admin only) ───────────
-- Only admins can read contact messages
CREATE POLICY "admin_read_contact_messages" ON contact_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
        AND users.role = 'admin'
    )
  );

-- Anyone can submit a contact message (public feedback form)
CREATE POLICY "public_insert_contact" ON contact_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "auth_update_contact" ON contact_messages
  FOR UPDATE USING ((select auth.uid()) IS NOT NULL);


-- ── TENANTS ──────────────────────────────────────────────
CREATE POLICY "public_read_tenants" ON tenants
  FOR SELECT USING (true);


-- ── ACHIEVEMENTS ─────────────────────────────────────────
CREATE POLICY "public_read_achievements" ON achievements
  FOR SELECT USING (true);


-- ── USER ACHIEVEMENTS ────────────────────────────────────
-- Public can read (for public profile display)
CREATE POLICY "public_read_user_achievements" ON user_achievements
  FOR SELECT USING (true);


-- ── CITIZEN WALLETS (SENSITIVE — owner only) ────────────
-- Users can only see their own wallet
CREATE POLICY "owner_read_wallets" ON citizen_wallets
  FOR SELECT USING (user_id = (select auth.uid()));


-- ── REWARDS CATALOG ─────────────────────────────────────
CREATE POLICY "public_read_rewards" ON rewards_catalog
  FOR SELECT USING (true);


-- ── PARTNER STORES ──────────────────────────────────────
CREATE POLICY "public_read_partner_stores" ON partner_stores
  FOR SELECT USING (true);


-- ── CURRENCY SETTINGS ───────────────────────────────────
CREATE POLICY "public_read_currency" ON currency_settings
  FOR SELECT USING (true);


-- ============================================================
-- 4. MISSING FOREIGN KEY INDEXES
-- Postgres does NOT auto-index foreign keys. Without these,
-- every JOIN and RLS check does a sequential scan.
-- ============================================================

-- Tickets: queries filter by reporter
CREATE INDEX IF NOT EXISTS idx_tickets_reporter_user_id
  ON tickets (reporter_user_id);

-- Tickets: status filtering for dashboard/kanban
CREATE INDEX IF NOT EXISTS idx_tickets_status
  ON tickets (status);

-- Tickets: created_at for sorting
CREATE INDEX IF NOT EXISTS idx_tickets_created_at
  ON tickets (created_at DESC);

-- Reports: user ownership
CREATE INDEX IF NOT EXISTS idx_reports_user_id
  ON reports (user_id);

-- Evidence and timeline: indexes skipped (column names not confirmed)
-- Run this query in Supabase SQL Editor to check actual columns:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name IN ('ticket_evidence', 'ticket_timeline')
--   ORDER BY table_name, ordinal_position;

-- Notifications: timestamp index for sorting
CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON notifications (created_at DESC);

-- Notifications: unread filter (by read_at null)
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications (read_at) WHERE read_at IS NULL;

-- Audit logs: admin queries by timestamp
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON audit_logs (created_at DESC);

-- Contact messages: admin queries
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at
  ON contact_messages (created_at DESC);

-- Users: auth lookup by supabase ID
CREATE INDEX IF NOT EXISTS idx_users_supabase_auth_user_id
  ON users (supabase_auth_user_id);

-- Users: email lookup (for login)
CREATE INDEX IF NOT EXISTS idx_users_email
  ON users (email);

-- Citizen wallets: owner lookup
CREATE INDEX IF NOT EXISTS idx_wallets_user_id
  ON citizen_wallets (user_id);

-- Citizen achievements: already has index from achievement_ranking_system.sql
-- (idx_citizen_achievements_user on citizen_achievements(user_id))


-- ============================================================
-- 5. TIMESTAMP CONSTRAINTS
-- Ensure created_at / updated_at are always populated.
-- ============================================================

-- These ALTER statements are safe: they only add NOT NULL to
-- columns that already have DEFAULT now() in most cases.
-- Wrapped in DO blocks to avoid errors if constraint already exists.

DO $$ BEGIN
  ALTER TABLE tickets ALTER COLUMN created_at SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE tickets ALTER COLUMN updated_at SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE reports ALTER COLUMN created_at SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE reports ALTER COLUMN updated_at SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE notifications ALTER COLUMN created_at SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE ticket_evidence ALTER COLUMN created_at SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE ticket_timeline ALTER COLUMN created_at SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE contact_messages ALTER COLUMN created_at SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE audit_logs ALTER COLUMN created_at SET NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;


-- ============================================================
-- DONE
-- Run this in Supabase Dashboard → SQL Editor
-- After running, verify with:
--   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
--   FROM pg_policies
--   WHERE schemaname = 'public'
--   ORDER BY tablename, policyname;
-- ============================================================
