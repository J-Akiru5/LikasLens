-- ============================================================
-- FIX: public ticket reads exposed the reporter's identity
-- APPLIED to the live project on 2026-10-20.
-- Supersedes and replaces PROPOSED-fix-ticket-identity-rls.sql.
-- ============================================================
--
-- PROBLEM (measured on the live project before applying)
-- -----------------------------------------------------
-- `public_select_tickets` was `USING (true)`, and the anon key ships in the
-- browser bundle. Measured: 109 tickets, 80 with a named reporter, 11 distinct
-- reporters, 109 with coordinates.
--
-- Anyone could therefore read `reporter_user_id` for every report, together with
-- `ai_analysis_raw`, `ai_confidence` and `composite_confidence`. That makes the
-- Ghost Mode promise untrue for every report that is not anonymous.
--
-- MODEL
-- -----
--   base table  : your own rows, or everything if `is_admin()`
--   public view : `public_tickets` — every field the public UI needs, and no
--                 identity. `reporter_user_id` is replaced by the boolean
--                 `reporter_verified`, so the UI can still distinguish
--                 "Verified Citizen" from "Anonymous (Ghost Mode)".
--
-- The view is a definer-rights view on purpose (owner = migration role, which
-- bypasses RLS). That is what makes it a public projection: it returns all rows
-- but only the safe columns. It is read-only and is granted only to anon and
-- authenticated.
--
-- Deliberately EXCLUDED from the view:
--   reporter_user_id     identity
--   reporter_display_name
--   ai_analysis_raw      raw model output
--   ai_confidence, composite_confidence   uncalibrated figures that the product
--                        has decided must not be shown anywhere
--   SLA internals, tenant_id, chain_id, escalation fields, submission_path
--
-- Ghost-mode rows already carry `location_fuzzed = true` (verified 7/7), so the
-- coordinates in the view are already the fuzzed ones. Nothing needs nulling.
--
-- VERIFIED AFTER APPLYING (simulating PostgREST, in rolled-back transactions)
-- -------------------------------------------------------------------------
--   role anon, no claims        -> base 0 rows, view 109 rows
--   anon insert (Ghost Mode)    -> not readable from base, visible in view
--   role authenticated, own sub -> 56 rows (their own), 0 rows of others
--   role authenticated, staff   -> 109 rows
--
-- BACKUP
-- ------
--   S:/Dev/Laravel/LikasLens/rls-policies-backup-tickets-identity.json
--
-- Safe to re-run (DROP POLICY IF EXISTS / CREATE OR REPLACE VIEW).
-- ============================================================

BEGIN;

DROP POLICY IF EXISTS "public_select_tickets" ON public.tickets;

CREATE POLICY "tickets_select_own_or_staff"
  ON public.tickets
  FOR SELECT
  TO public
  USING (
    reporter_user_id = (SELECT auth.uid())
    OR is_admin()
  );

CREATE OR REPLACE VIEW public.public_tickets
WITH (security_invoker = false)
AS
SELECT
  t.id,
  t.title,
  t.description,
  t.status,
  t.urgency_score,
  t.latitude,
  t.longitude,
  t.address_text,
  t.ai_triage_summary,
  t.created_at,
  t.updated_at,
  t.resolved_at,
  t.ghost_mode,
  t.location_fuzzed,
  (t.reporter_user_id IS NOT NULL) AS reporter_verified
FROM public.tickets t;

REVOKE ALL ON public.public_tickets FROM public;
GRANT SELECT ON public.public_tickets TO anon, authenticated;

COMMIT;

-- VERIFICATION
-- ------------
--   SELECT policyname, cmd, qual FROM pg_policies
--    WHERE schemaname='public' AND tablename='tickets' ORDER BY cmd;
--
--   SELECT column_name FROM information_schema.columns
--    WHERE table_schema='public' AND table_name='public_tickets'
--    ORDER BY ordinal_position;
--   -- must NOT contain reporter_user_id, ai_analysis_raw, ai_confidence
--
--   -- as an anonymous client:
--   SELECT count(*) FROM public.tickets;        -- 0
--   SELECT count(*) FROM public.public_tickets; -- all rows
