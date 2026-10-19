-- ============================================================
-- FIX: a client could choose a ticket's created_at
-- APPLIED to the live project on 2026-10-20.
-- ============================================================
--
-- PROBLEM
-- -------
-- `tickets.created_at` was fully client-controlled. The browser fallback wrote
-- its own value, and the routing freshness window reads that column, so a caller
-- could keep an anonymous ticket "fresh" indefinitely by writing a future
-- timestamp.
--
-- The application now rejects a created_at more than a minute in the future
-- (shared/src/lib/routing-authz.ts), which closes the exploit path in the
-- decision layer. This closes it at the storage layer too, so a direct REST
-- insert cannot do it either.
--
-- FIX
-- ---
-- A BEFORE INSERT OR UPDATE trigger stamps server time.
--
-- Demo and seed scripts deliberately insert historical, spread-out timestamps so
-- the impact charts show a trend. Forcing now() would collapse every seeded row
-- onto the same instant, so the trigger honours an explicit, session-scoped
-- opt-out:
--
--   SELECT set_config('likaslens.allow_timestamp_override', 'on', false);
--
-- Only seeding scripts set it. The setting is not reachable from PostgREST: a
-- client cannot set arbitrary GUCs, and `current_setting(..., true)` returns NULL
-- when unset, which the trigger treats as "enforce".
--
-- Safe to re-run.
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_ticket_timestamps()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Seeding only: preserve the supplied historical timestamps.
  IF current_setting('likaslens.allow_timestamp_override', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.created_at := now();
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tickets_set_timestamps ON public.tickets;

CREATE TRIGGER tickets_set_timestamps
  BEFORE INSERT OR UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_ticket_timestamps();

-- VERIFICATION (run inside a transaction, then roll back)
-- -------------------------------------------------------
--   BEGIN;
--     INSERT INTO public.tickets (title, description, status, created_at, updated_at)
--     VALUES ('probe', 'probe', 'open', now() + interval '30 days', now());
--     -- created_at must be approximately now(), not +30 days
--     SELECT created_at > now() + interval '1 day' AS wrongly_future FROM public.tickets
--      WHERE title = 'probe';
--   ROLLBACK;
--
--   BEGIN;
--     SELECT set_config('likaslens.allow_timestamp_override', 'on', true);
--     INSERT INTO public.tickets (title, description, status, created_at, updated_at)
--     VALUES ('probe2', 'probe2', 'open', '2020-01-01', '2020-01-01');
--     -- created_at must still be 2020-01-01
--     SELECT created_at FROM public.tickets WHERE title = 'probe2';
--   ROLLBACK;
