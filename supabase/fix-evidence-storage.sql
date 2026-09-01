-- LikasLens — Storage Buckets (IDEMPOTENT)
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/sfklmmtimelotqvrldni/sql/new
--
-- Creates the storage buckets the apps write to:
--   1. evidence       — citizen report photos (AI-service upload) AND officer
--                       "after/resolution" photos (admin portal upload).
--                       MUST be public: the before/after photos are served
--                       straight from public storage URLs to the super admin.
--   2. profile-images — citizen profile/avatar uploads (frontend).
--
-- The upload routes use the service-role key, which bypasses RLS, so no
-- insert policies are strictly required. The read policies below are
-- defensive so public URLs keep working even if a bucket flips private.

-- 1. Create buckets as public (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Anyone (anon + authenticated) may read objects from these buckets
DO $$
DECLARE b text;
BEGIN
  FOREACH b IN ARRAY ARRAY['evidence', 'profile-images'] LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON storage.objects;', 'public_read_' || b
    );
    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR SELECT USING (bucket_id = %L);',
      'public_read_' || b, b
    );
  END LOOP;
END $$;