-- ============================================================
-- LIKASLENS SUPABASE SETUP
-- Paste this into Supabase Dashboard → SQL Editor
-- Run section by section (they're numbered)
-- ============================================================

-- ============================================================
-- 1. PUBLIC READ POLICIES (lets the frontend read data)
-- ============================================================

-- Enable RLS on all tables we need (safe to run, won't break existing policies)
ALTER TABLE IF EXISTS tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS environmental_laws_ph ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS violation_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ngo_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ticket_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ticket_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS citizen_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rewards_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS partner_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS currency_settings ENABLE ROW LEVEL SECURITY;

-- Public read policies (anon + authenticated can read)
CREATE POLICY "public_read_tickets" ON tickets FOR SELECT USING (true);
CREATE POLICY "public_read_reports" ON reports FOR SELECT USING (true);
CREATE POLICY "public_read_users" ON users FOR SELECT USING (true);
CREATE POLICY "public_read_laws" ON environmental_laws_ph FOR SELECT USING (true);
CREATE POLICY "public_read_violation_types" ON violation_types FOR SELECT USING (true);
CREATE POLICY "public_read_ngos" ON ngo_groups FOR SELECT USING (true);
CREATE POLICY "public_read_notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "public_read_evidence" ON ticket_evidence FOR SELECT USING (true);
CREATE POLICY "public_read_timeline" ON ticket_timeline FOR SELECT USING (true);
CREATE POLICY "public_read_audit_logs" ON audit_logs FOR SELECT USING (true);
CREATE POLICY "public_read_contact_messages" ON contact_messages FOR SELECT USING (true);
CREATE POLICY "public_read_tenants" ON tenants FOR SELECT USING (true);
CREATE POLICY "public_read_achievements" ON achievements FOR SELECT USING (true);
CREATE POLICY "public_read_user_achievements" ON user_achievements FOR SELECT USING (true);
CREATE POLICY "public_read_wallets" ON citizen_wallets FOR SELECT USING (true);
CREATE POLICY "public_read_rewards" ON rewards_catalog FOR SELECT USING (true);
CREATE POLICY "public_read_partner_stores" ON partner_stores FOR SELECT USING (true);
CREATE POLICY "public_read_currency" ON currency_settings FOR SELECT USING (true);

-- Authenticated write policies (only logged-in users can insert/update/delete)
CREATE POLICY "auth_insert_tickets" ON tickets FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_tickets" ON tickets FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_tickets" ON tickets FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_insert_reports" ON reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_reports" ON reports FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_insert_notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_notifications" ON notifications FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_insert_evidence" ON ticket_evidence FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_evidence" ON ticket_evidence FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "auth_insert_timeline" ON ticket_timeline FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "auth_insert_contact" ON contact_messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_contact" ON contact_messages FOR UPDATE USING (auth.uid() IS NOT NULL);


-- ============================================================
-- 2. TEST ADMIN USER (seed into Supabase Auth)
-- Run this to create a test admin you can login with
-- Password: Admin123!
-- ============================================================

-- Insert into Supabase Auth (this creates the login credential)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@likaslens.ph') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_token, confirmation_sent_at,
      recovery_token, recovery_sent_at, email_change_token_new, email_change,
      email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, phone, phone_confirmed_at, phone_change,
      phone_change_token, phone_change_sent_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated', 'authenticated',
      'admin@likaslens.ph', crypt('Admin123!', gen_salt('bf')),
      now(), '', now(), '', now(), '', '', now(), now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Test Admin", "role": "admin"}',
      now(), now(), NULL, NULL, '', '', now()
    );
  ELSE
    UPDATE auth.users
    SET raw_user_meta_data = '{"full_name": "Test Admin", "role": "admin"}',
        updated_at = now()
    WHERE email = 'admin@likaslens.ph';
  END IF;
END
$$;


-- ============================================================
-- 3. SYNC THE ADMIN USER INTO PUBLIC.USERS TABLE
-- ============================================================

-- Wait a moment for the auth trigger to fire, then run this
-- (If the trigger already created the user, this just updates the role)
UPDATE users
SET role = 'admin', name = 'Test Admin'
WHERE email = 'admin@likaslens.ph';

-- If the row doesn't exist yet in public.users, insert it
INSERT INTO users (id, supabase_auth_user_id, email, name, role, created_at, updated_at)
SELECT
  gen_random_uuid(),
  au.id,
  au.email,
  'Test Admin',
  'admin',
  now(),
  now()
FROM auth.users au
WHERE au.email = 'admin@likaslens.ph'
  AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@likaslens.ph');


-- ============================================================
-- 4. ALSO CREATE AN ANALYST ACCOUNT
-- Password: Analyst123!
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'analyst@likaslens.ph') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_token, confirmation_sent_at,
      recovery_token, recovery_sent_at, email_change_token_new, email_change,
      email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, phone, phone_confirmed_at, phone_change,
      phone_change_token, phone_change_sent_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated', 'authenticated',
      'analyst@likaslens.ph', crypt('Analyst123!', gen_salt('bf')),
      now(), '', now(), '', now(), '', '', now(), now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Juan Dela Cruz", "role": "analyst"}',
      now(), now(), NULL, NULL, '', '', now()
    );
  ELSE
    UPDATE auth.users
    SET raw_user_meta_data = '{"full_name": "Juan Dela Cruz", "role": "analyst"}',
        updated_at = now()
    WHERE email = 'analyst@likaslens.ph';
  END IF;
END
$$;

UPDATE users
SET role = 'analyst', name = 'Juan Dela Cruz'
WHERE email = 'analyst@likaslens.ph';

INSERT INTO users (id, supabase_auth_user_id, email, name, role, created_at, updated_at)
SELECT
  gen_random_uuid(), au.id, au.email, 'Juan Dela Cruz', 'analyst', now(), now()
FROM auth.users au
WHERE au.email = 'analyst@likaslens.ph'
  AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'analyst@likaslens.ph');


-- ============================================================
-- 5. AFTER RUNNING: switch to anon key
-- Once you've confirmed the policies work, update
-- apps/shared/src/supabase/client.ts to use anon key instead:
--
--   const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
--
-- Test by visiting http://localhost:3000/en/public-record
-- You should see 20+ incidents loading.
-- ============================================================
