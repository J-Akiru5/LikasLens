-- ==============================================================================
-- LIKASLENS SUPABASE MIGRATION: GHOST MODE & ANONYMOUS INCIDENT SUBMISSION FIX
-- ==============================================================================
-- Purpose:
-- 1. Makes `reporter_user_id` in `tickets` NULLABLE so Ghost Mode (whistleblower)
--    and unauthenticated citizen reports can be saved without constraint errors.
-- 2. Ensures `reports` table also supports anonymous submissions if used.
-- 3. Updates RLS policies so both authenticated users and anonymous citizens
--    can submit incident reports securely.
--
-- Instructions:
-- Paste this script into your Supabase Dashboard -> SQL Editor and click "Run".
-- ==============================================================================

-- 1. Make reporter_user_id NULLABLE in tickets table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'tickets' 
      AND column_name = 'reporter_user_id'
  ) THEN
    ALTER TABLE public.tickets ALTER COLUMN reporter_user_id DROP NOT NULL;
  END IF;
END $$;

-- 2. Make user_id NULLABLE in reports table (if applicable)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'reports' 
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.reports ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END $$;

-- 3. Ensure primary keys default to gen_random_uuid() if omitted
DO $$
BEGIN
  ALTER TABLE public.tickets ALTER COLUMN id SET DEFAULT gen_random_uuid();
EXCEPTION WHEN OTHERS THEN
  -- In case gen_random_uuid() / uuid-ossp is not default extension
  NULL;
END $$;

-- 4. Enable Row Level Security (RLS) and Grant Public Insert Access
ALTER TABLE IF EXISTS public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reports ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive insert policies if any
DROP POLICY IF EXISTS "auth_insert_tickets" ON public.tickets;
DROP POLICY IF EXISTS "public_insert_tickets" ON public.tickets;
DROP POLICY IF EXISTS "auth_insert_reports" ON public.reports;
DROP POLICY IF EXISTS "public_insert_reports" ON public.reports;

-- Create open insert policies for civic report dispatch (anon + authenticated)
CREATE POLICY "public_insert_tickets" ON public.tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "public_insert_reports" ON public.reports FOR INSERT WITH CHECK (true);

-- Ensure public select works for dashboards and live map feeds
DROP POLICY IF EXISTS "public_read_tickets" ON public.tickets;
CREATE POLICY "public_read_tickets" ON public.tickets FOR SELECT USING (true);

-- ==============================================================================
-- DONE! Ghost Mode and citizen reports can now be submitted seamlessly.
-- ==============================================================================
