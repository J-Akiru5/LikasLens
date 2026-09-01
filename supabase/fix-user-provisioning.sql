-- LikasLens — New-Signup Profile Provisioning (IDEMPOTENT)
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/sql/new
--
-- PROBLEM FIXED
-- The public.users row was only created by manual seeds or ad-hoc sync calls,
-- so brand-new signups (email or Google, frontend or mobile PWA) could end up
-- with a valid Supabase session but NO profile row — no role, no name, nothing.
--
-- FIX
-- A trigger on auth.users AFTER INSERT provisions the matching public.users
-- row automatically. Role comes from sign-up metadata (register pages send
-- role=citizen) and defaults to 'citizen'.
--
-- LEGACY-SAFE (v2)
-- Older app code created public.users rows with a RANDOM row id and the real
-- auth uid stored separately in supabase_auth_user_id. Those rows conflict
-- with the unique constraint on supabase_auth_user_id (not just on id), so
-- the backfill/trigger now skip any auth user that ALREADY has a row under
-- any of the unique keys (id, supabase_auth_user_id, OR email).
-- Re-running is fully safe.

-- 1. Provisioning function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip if this auth uid (or its email) already has a profile row under
  -- ANY key: legacy rows use a random id with supabase_auth_user_id pointing
  -- here, and older seeds also hold the same email under a fabricated id.
  IF EXISTS (
    SELECT 1 FROM public.users
    WHERE id = NEW.id
       OR supabase_auth_user_id = NEW.id
       OR email = NEW.email
  ) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.users (
    id,
    supabase_auth_user_id,
    name,
    email,
    role,
    trust_score,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'citizen'),
    50,
    NEW.created_at,
    NEW.created_at
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. Trigger (dropped first so re-running is safe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill: provision rows for auth users created before this trigger.
--    Skips anyone who already has a profile row under their auth uid
--    (existing profiles are left untouched — fixes the duplicate-key error
--    on users_supabase_auth_user_id_unique for legacy rows).
INSERT INTO public.users (id, supabase_auth_user_id, name, email, role, trust_score, created_at, updated_at)
SELECT
  au.id,
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1)
  ),
  au.email,
  COALESCE(au.raw_user_meta_data->>'role', 'citizen'),
  50,
  au.created_at,
  au.created_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users u
  WHERE u.id = au.id
     OR u.supabase_auth_user_id = au.id
     OR u.email = au.email
);
-- No ON CONFLICT needed: the WHERE clause already guarantees neither unique
-- key (id, supabase_auth_user_id) can collide.