-- Fix Auth Passwords & Roles for Demo Login
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/sfklmmtimelotqvrldni/sql/new

-- 1. Set known passwords
UPDATE auth.users SET encrypted_password = crypt('Analyst123!', gen_salt('bf')) WHERE email = 'analyst@likaslens.ph';
UPDATE auth.users SET encrypted_password = crypt('Admin123!', gen_salt('bf')) WHERE email = 'superadmin@likaslens.ph';
UPDATE auth.users SET encrypted_password = crypt('Citizen123!', gen_salt('bf')) WHERE email = 'citizen@likaslens.ph';

-- 2. Confirm emails (skip email verification)
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL
  AND email IN ('analyst@likaslens.ph', 'superadmin@likaslens.ph', 'citizen@likaslens.ph');

-- 3. Set roles in user_metadata (admin portal reads this for sidebar)
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"role":"analyst"}'::jsonb
  WHERE email = 'analyst@likaslens.ph';
UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"role":"super_admin"}'::jsonb
  WHERE email = 'superadmin@likaslens.ph';
