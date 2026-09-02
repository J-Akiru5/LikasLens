-- ═══════════════════════════════════════════════════════════════════════════
-- LikasLens — Makati / Luzon Pitch Demo Seed
-- For the IPOPHL @ University of Makati pitch.
--
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/sql/new
-- (Project: sfklmmtimelotqvrldni)
--
-- WHAT THIS ADDS (idempotent — safe to run multiple times):
--   4 demo login accounts  → 14 Makati/Luzon reports → full status timelines
--   → assignments to the Makati LGU desk → notifications → agency groups
--   → 2 supplementary environmental laws.
--
-- DEMO LOGIN ACCOUNTS (all email-confirmed, ready to use):
--   makati.lgu@likaslens.ph      / MakatiLgu123!   → LGU (Makati CENRO)
--   maria.citizen@likaslens.ph   / Citizen123!     → Citizen (Makati)
--   jose.citizen@likaslens.ph    / Citizen123!     → Citizen (Makati)
--   gina.citizen@likaslens.ph    / Citizen123!     → Citizen (Laguna)
--   (analyst@likaslens.ph / Analyst123! and superadmin@likaslens.ph /
--    Admin123! are kept intact from the existing demo seed.)
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Fix legacy NOT NULL password blocker + keep existing demo logins alive
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

UPDATE auth.users SET encrypted_password = crypt('Analyst123!', gen_salt('bf'))
WHERE email = 'analyst@likaslens.ph';
UPDATE auth.users SET encrypted_password = crypt('Admin123!', gen_salt('bf'))
WHERE email = 'superadmin@likaslens.ph';
UPDATE auth.users SET encrypted_password = crypt('Citizen123!', gen_salt('bf'))
WHERE email = 'citizen@likaslens.ph';
UPDATE auth.users SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL
  AND email IN ('analyst@likaslens.ph', 'superadmin@likaslens.ph', 'citizen@likaslens.ph');

-- ───────────────────────────────────────────────────────────────────────────
-- 2. Demo auth accounts (the public.users rows are auto-created by the
--    handle_new_user trigger, with role read from user_metadata).
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated', 'authenticated', email,
  crypt(password, gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object('full_name', full_name, 'role', role),
  now(), now()
FROM (VALUES
  ('makati.lgu@likaslens.ph',   'MakatiLgu123!', 'Engr. Ramon Villanueva', 'lgu'),
  ('maria.citizen@likaslens.ph','Citizen123!',   'Maria Concepcion Santos', 'citizen'),
  ('jose.citizen@likaslens.ph', 'Citizen123!',   'Jose Rizal Mercado',      'citizen'),
  ('gina.citizen@likaslens.ph', 'Citizen123!',   'Gina Cruz Reyes',         'citizen')
) AS demo(email, password, full_name, role)
ON CONFLICT (email) DO NOTHING;

-- Ensure the new accounts are confirmed and carry their role metadata
UPDATE auth.users
SET email_confirmed_at = now(),
    raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role', demo.role, 'full_name', demo.full_name)
FROM (VALUES
  ('makati.lgu@likaslens.ph',   'MakatiLgu123!', 'Engr. Ramon Villanueva', 'lgu'),
  ('maria.citizen@likaslens.ph','Citizen123!',   'Maria Concepcion Santos', 'citizen'),
  ('jose.citizen@likaslens.ph', 'Citizen123!',   'Jose Rizal Mercado',      'citizen'),
  ('gina.citizen@likaslens.ph', 'Citizen123!',   'Gina Cruz Reyes',         'citizen')
) AS demo(email, password, full_name, role)
WHERE auth.users.email = demo.email
  AND auth.users.email_confirmed_at IS NULL;

-- ───────────────────────────────────────────────────────────────────────────
-- 3. public.users rows (backstop — normally created by the trigger)
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO users (id, supabase_auth_user_id, name, email, role, trust_score, created_at)
SELECT au.id, au.id,
       COALESCE(au.raw_user_meta_data->>'full_name', au.email),
       au.email,
       COALESCE(au.raw_user_meta_data->>'role', 'citizen'),
       CASE WHEN au.email = 'makati.lgu@likaslens.ph' THEN 85 ELSE 60 END,
       au.created_at
FROM auth.users au
WHERE au.email IN (
  'makati.lgu@likaslens.ph', 'maria.citizen@likaslens.ph',
  'jose.citizen@likaslens.ph', 'gina.citizen@likaslens.ph'
)
ON CONFLICT DO NOTHING;

-- Makati CENRO desk profile for the LGU account (drives routing + LGU view)
UPDATE users
SET agency_name = 'Makati City Environment Office',
    service_area = 'Makati City',
    service_area_lat = 14.5547,
    service_area_lng = 121.0244,
    trust_score = 85,
    updated_at = now()
WHERE email = 'makati.lgu@likaslens.ph';

-- ───────────────────────────────────────────────────────────────────────────
-- 4. Agency groups (used as ticket "desks" for assignments)
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO ngo_groups (id, name, region, contact_email, contact_phone, is_active, created_at)
SELECT g.id, g.name, g.region, g.contact_email, g.contact_phone, true, now()
FROM (VALUES
  ('b2000001-0000-0000-0000-000000000001', 'Makati City Environment Office',  'NCR',    'cenro@makati.gov.ph',      '(02) 8899-1234'),
  ('b2000001-0000-0000-0000-000000000002', 'DENR-EMB NCR Office',             'NCR',    'ncr@emb.gov.ph',           '(02) 8926-1234'),
  ('b2000001-0000-0000-0000-000000000003', 'Pasig River Rehabilitation Commission', 'NCR', 'prrc@pasigriver.gov.ph', '(02) 8569-5678'),
  ('b2000001-0000-0000-0000-000000000004', 'BFAR Laguna de Bay Office',        'Region IV-A', 'bfar4a@bfar.gov.ph', '(049) 501-2345'),
  ('b2000001-0000-0000-0000-000000000005', 'Metro Manila Development Authority', 'NCR',  'environment@mmda.gov.ph', '(02) 8882-4151')
) AS g(id, name, region, contact_email, contact_phone)
WHERE NOT EXISTS (SELECT 1 FROM ngo_groups WHERE name = g.name);

-- ───────────────────────────────────────────────────────────────────────────
-- 5. Environmental laws (only if not already in the database)
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO environmental_laws_ph (id, title, law_code, summary, issuing_agency, country_code, jurisdiction_scope, source_url, is_active, created_at)
SELECT l.id, l.title, l.law_code, l.summary, l.issuing_agency, 'PH', l.jurisdiction_scope, l.source_url, true, now()
FROM (VALUES
  ('c2000001-0000-0000-0000-000000000001',
   'Toxic Substances and Hazardous and Nuclear Wastes Control Act of 1990',
   'RA 6969',
   'Regulates the import, manufacture, processing, sale and disposal of toxic substances and hazardous wastes, with a permitting system enforced by DENR-EMB.',
   'Department of Environment and Natural Resources - EMB', 'national',
   'https://emb.gov.ph/ra-6969/'),
  ('c2000001-0000-0000-0000-000000000002',
   'National Environmental Awareness and Education Act of 2008',
   'RA 9512',
   'Institutionalizes environmental education in schools and communities to build environmental awareness and responsible citizenship.',
   'Department of Education / DENR', 'national',
   'https://lawphil.net/statutes/repacts/ra2008/ra_9512_2008.html')
) AS l(id, title, law_code, summary, issuing_agency, jurisdiction_scope, source_url)
WHERE NOT EXISTS (SELECT 1 FROM environmental_laws_ph WHERE law_code = l.law_code);

-- ───────────────────────────────────────────────────────────────────────────
-- 6. Makati / Luzon environmental reports (14)
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO tickets (id,title,description,status,ghost_mode,latitude,longitude,location_fuzzed,address_text,ai_triage_summary,ai_confidence,ai_recommended_office,routing_source,urgency_score,reporter_user_id,submission_path,created_at,updated_at)
VALUES
('d2000001-0000-0000-0000-000000000001',
 'Construction debris dumped along Estero de San Antonio Abad',
 'Truckloads of concrete rubble and scrap lumber dumped along the estero bank near the Palanan bridge. Blocks the waterway during rains.',
 'open', false, 14.5570, 121.0100, false, 'Brgy. Palanan, Makati City',
 'Illegal Dumping', 0.93, 'Makati City Environment Office', 'neo4j', 8.7,
 (SELECT id FROM auth.users WHERE email = 'maria.citizen@likaslens.ph'),
 'ai_service', now() - interval '3 hours', now() - interval '3 hours'),

('d2000001-0000-0000-0000-000000000002',
 'Suspected chemical drums abandoned at Bangkal creek',
 'Five corroding drums labelled with chemical markings dumped beside the creek in Bangkal. Strong odor. Children play nearby.',
 'open', true, 14.5364, 121.0132, true, 'Brgy. Bangkal, Makati City',
 'Hazardous Waste', 0.95, 'DENR-EMB Hazardous Waste Division', 'neo4j', 9.4,
 NULL, 'ai_service', now() - interval '6 hours', now() - interval '6 hours'),

('d2000001-0000-0000-0000-000000000003',
 'Smoke-belching delivery truck along Ayala Avenue',
 'Delivery truck emitting thick black smoke along Ayala Avenue near the Makati Stock Exchange. Plate number captured.',
 'open', false, 14.5564, 121.0214, false, 'Ayala Avenue cor. Paseo de Roxas, Makati City',
 'Air Pollution', 0.82, 'DENR-EMB Air Quality Division', 'neo4j', 6.8,
 (SELECT id FROM auth.users WHERE email = 'jose.citizen@likaslens.ph'),
 'ai_service', now() - interval '9 hours', now() - interval '9 hours'),

('d2000001-0000-0000-0000-000000000004',
 'Raw sewage discharge into Pasig River near Guadalupe',
 'Untreated dark discharge flowing into the Pasig River from a pipe under the Guadalupe bridge. Foul odor and floating debris.',
 'investigating', false, 14.5627, 121.0463, false, 'Guadalupe Nuevo, Makati City',
 'Water Pollution', 0.91, 'Pasig River Rehabilitation Commission', 'neo4j', 8.9,
 (SELECT id FROM auth.users WHERE email = 'maria.citizen@likaslens.ph'),
 'ai_service', now() - interval '1 day', now() - interval '18 hours'),

('d2000001-0000-0000-0000-000000000005',
 'Illegal quarrying on Tanay mountainside',
 'Heavy equipment cutting into the hillside above Barangay Sampaloc, Tanay. Muddy runoff reaching the river below.',
 'investigating', true, 14.5500, 121.1700, true, 'Brgy. Sampaloc, Tanay, Rizal',
 'Deforestation', 0.87, 'DENR Mines and Geosciences Bureau', 'neo4j', 8.2,
 NULL, 'ai_service', now() - interval '2 days', now() - interval '1 day'),

('d2000001-0000-0000-0000-000000000006',
 'Open burning of e-waste in Valenzuela industrial area',
 'Circuit boards and cables being burned in an open lot. Black smoke drifting toward nearby homes.',
 'investigating', false, 14.7010, 120.9830, false, 'Paso de Blas, Valenzuela City',
 'Air Pollution', 0.90, 'DENR-EMB Air Quality Division', 'neo4j', 8.4,
 (SELECT id FROM auth.users WHERE email = 'gina.citizen@likaslens.ph'),
 'ai_service', now() - interval '2 days', now() - interval '1 day'),

('d2000001-0000-0000-0000-000000000007',
 'Construction noise past 10 PM at Salcedo Village',
 'Pile-driving continuing past midnight in a residential high-rise construction site along Tordesillas Street.',
 'pending_review', false, 14.5553, 121.0238, false, 'Salcedo Village, Makati City',
 'Noise Pollution', 0.68, 'Makati City Environment Office', 'postgresql_fallback', 4.2,
 (SELECT id FROM auth.users WHERE email = 'jose.citizen@likaslens.ph'),
 'direct_fallback', now() - interval '4 days', now() - interval '3 days'),

('d2000001-0000-0000-0000-000000000008',
 'Foamy industrial effluent in Marikina River',
 'Yellow foam and discolored water from a factory outfall upstream of the Marikina River footbridge.',
 'monitoring', false, 14.6213, 121.0895, false, 'Brgy. San Roque, Marikina City',
 'Water Pollution', 0.92, 'DENR-EMB Water Quality Division', 'neo4j', 8.6,
 NULL, 'ai_service', now() - interval '5 days', now() - interval '3 days'),

('d2000001-0000-0000-0000-000000000009',
 'Dumpsite fire smoke over Meycauayan',
 'Repeated fires at an open dumpsite in Barangay Pantoc, Meycauayan. Smoke covering nearby villages each afternoon.',
 'monitoring', false, 14.7350, 120.9600, false, 'Brgy. Pantoc, Meycauayan, Bulacan',
 'Air Pollution', 0.79, 'DENR-EMB Regional Office', 'postgresql_fallback', 7.1,
 NULL, 'direct_fallback', now() - interval '6 days', now() - interval '4 days'),

('d2000001-0000-0000-0000-000000000010',
 'Mangrove clearing at Manila Bay Coastal Park',
 'Mangrove saplings uprooted near the Coastal Park lagoon in Parañaque. Excavator tracks visible.',
 'resolved', false, 14.4795, 120.9870, false, 'Manila Bay Coastal Park, Parañaque City',
 'Deforestation', 0.88, 'DENR-EMB Protected Areas Division', 'neo4j', 7.6,
 (SELECT id FROM auth.users WHERE email = 'maria.citizen@likaslens.ph'),
 'ai_service', now() - interval '8 days', now() - interval '3 days'),

('d2000001-0000-0000-0000-000000000011',
 'Used oil spill along Bauan port pier',
 'Dark oil slick spreading from the cargo pier at Bauan International Port, reaching the shoreline.',
 'resolved', true, 13.7910, 121.0060, true, 'Bauan International Port, Batangas',
 'Hazardous Waste', 0.94, 'DENR-EMB Emergency Response', 'neo4j', 9.1,
 NULL, 'ai_service', now() - interval '10 days', now() - interval '4 days'),

('d2000001-0000-0000-0000-000000000012',
 'Plastic waste pile-up at Guadalupe underpass',
 'Single-use plastics and styrofoam accumulating under the EDSA Guadalupe underpass after heavy rain.',
 'verified', false, 14.5665, 121.0450, false, 'EDSA Guadalupe Underpass, Makati City',
 'Illegal Dumping', 0.81, 'Metro Manila Development Authority', 'postgresql_fallback', 6.0,
 (SELECT id FROM auth.users WHERE email = 'jose.citizen@likaslens.ph'),
 'direct_fallback', now() - interval '12 days', now() - interval '5 days'),

('d2000001-0000-0000-0000-000000000013',
 'Illegal fish pens blocking Laguna de Bay waterway',
 'Unauthorized fish pens encroaching on the navigation channel off Brgy. Muntinlupa-facing shore in Biñan.',
 'open', false, 14.3320, 121.0810, false, 'Brgy. Biñan, Laguna de Bay',
 'Water Pollution', 0.72, 'BFAR Regional Office', 'postgresql_fallback', 5.8,
 (SELECT id FROM auth.users WHERE email = 'gina.citizen@likaslens.ph'),
 'direct_fallback', now() - interval '1 day', now() - interval '20 hours'),

('d2000001-0000-0000-0000-000000000014',
 'Rice straw burning across Minalin fields',
 'Multiple fields burning rice straw simultaneously. Smoke blanketing the town during harvest season.',
 'closed', false, 14.9965, 120.6880, false, 'Brgy. San Nicolas, Minalin, Pampanga',
 'Air Pollution', 0.76, 'DENR-EMB Regional Office', 'postgresql_fallback', 5.2,
 NULL, 'direct_fallback', now() - interval '15 days', now() - interval '8 days')
ON CONFLICT DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- 7. Status timelines (realistic lifecycle progression)
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO ticket_timeline (id,ticket_id,actor_id,actor_type,from_status,to_status,note,created_at)
VALUES
-- TKT-4: sewage → investigating
('a2000001-0000-0000-0000-000000000001','d2000001-0000-0000-0000-000000000004',NULL,'system',NULL,'open','Report submitted by citizen',now() - interval '1 day'),
('a2000001-0000-0000-0000-000000000002','d2000001-0000-0000-0000-000000000004',NULL,'analyst','open','investigating','Water sampling scheduled with PRRC; inspection team dispatched',now() - interval '18 hours'),
-- TKT-5: quarry → investigating
('a2000001-0000-0000-0000-000000000003','d2000001-0000-0000-0000-000000000005',NULL,'system',NULL,'open','Report submitted by citizen (Ghost Mode)',now() - interval '2 days'),
('a2000001-0000-0000-0000-000000000004','d2000001-0000-0000-0000-000000000005',NULL,'analyst','open','investigating','MGB field team verifying quarry permits on site',now() - interval '1 day'),
-- TKT-6: e-waste → investigating
('a2000001-0000-0000-0000-000000000005','d2000001-0000-0000-0000-000000000006',NULL,'system',NULL,'open','Report submitted by citizen',now() - interval '2 days'),
('a2000001-0000-0000-0000-000000000006','d2000001-0000-0000-0000-000000000006',NULL,'analyst','open','investigating','EMB surveillance team monitoring burn site',now() - interval '1 day'),
-- TKT-8: Marikina effluent → monitoring
('a2000001-0000-0000-0000-000000000007','d2000001-0000-0000-0000-000000000008',NULL,'system',NULL,'open','Report submitted by citizen',now() - interval '5 days'),
('a2000001-0000-0000-0000-000000000008','d2000001-0000-0000-0000-000000000008',NULL,'analyst','open','investigating','Water quality lab testing started',now() - interval '4 days'),
('a2000001-0000-0000-0000-000000000009','d2000001-0000-0000-0000-000000000008',NULL,'analyst','investigating','monitoring','Cease-and-desist issued; compliance monitoring ongoing',now() - interval '3 days'),
-- TKT-9: Meycauayan dumpsite → monitoring
('a2000001-0000-0000-0000-000000000010','d2000001-0000-0000-0000-000000000009',NULL,'system',NULL,'open','Report submitted by citizen',now() - interval '6 days'),
('a2000001-0000-0000-0000-000000000011','d2000001-0000-0000-0000-000000000009',NULL,'analyst','open','investigating','Regional office coordinating with Bulacan LGU',now() - interval '5 days'),
('a2000001-0000-0000-0000-000000000012','d2000001-0000-0000-0000-000000000009',NULL,'analyst','investigating','monitoring','Fire suppressed; long-term closure plan in review',now() - interval '4 days'),
-- TKT-10: mangrove → resolved
('a2000001-0000-0000-0000-000000000013','d2000001-0000-0000-0000-000000000010',NULL,'system',NULL,'open','Report submitted by citizen',now() - interval '8 days'),
('a2000001-0000-0000-0000-000000000014','d2000001-0000-0000-0000-000000000010',NULL,'analyst','open','investigating','Coastal patrol confirmed excavation damage',now() - interval '7 days'),
('a2000001-0000-0000-0000-000000000015','d2000001-0000-0000-0000-000000000010',NULL,'analyst','investigating','resolved','Replanting of 400 mangrove saplings completed',now() - interval '3 days'),
-- TKT-11: oil spill → resolved
('a2000001-0000-0000-0000-000000000016','d2000001-0000-0000-0000-000000000011',NULL,'system',NULL,'open','Report submitted by citizen (Ghost Mode)',now() - interval '10 days'),
('a2000001-0000-0000-0000-000000000017','d2000001-0000-0000-0000-000000000011',NULL,'analyst','open','investigating','Boom deployed; cleanup crew mobilized',now() - interval '9 days'),
('a2000001-0000-0000-0000-000000000018','d2000001-0000-0000-0000-000000000011',NULL,'analyst','investigating','resolved','Shoreline cleanup and oil recovery completed',now() - interval '4 days'),
-- TKT-12: Guadalupe plastics → verified
('a2000001-0000-0000-0000-000000000019','d2000001-0000-0000-0000-000000000012',NULL,'system',NULL,'open','Report submitted by citizen',now() - interval '12 days'),
('a2000001-0000-0000-0000-000000000020','d2000001-0000-0000-0000-000000000012',NULL,'analyst','open','investigating','MMDA street sweepers deployed to underpass',now() - interval '11 days'),
('a2000001-0000-0000-0000-000000000021','d2000001-0000-0000-0000-000000000012',NULL,'analyst','investigating','resolved','Debris cleared; drainage flushed',now() - interval '10 days'),
('a2000001-0000-0000-0000-000000000022','d2000001-0000-0000-0000-000000000012',NULL,'super_admin','resolved','verified','Site inspection passed',now() - interval '5 days'),
-- TKT-14: Pampanga burning → closed
('a2000001-0000-0000-0000-000000000023','d2000001-0000-0000-0000-000000000014',NULL,'system',NULL,'open','Report submitted by citizen',now() - interval '15 days'),
('a2000001-0000-0000-0000-000000000024','d2000001-0000-0000-0000-000000000014',NULL,'analyst','open','investigating','Farmers briefed on RA 8749 open-burning ban',now() - interval '14 days'),
('a2000001-0000-0000-0000-000000000025','d2000001-0000-0000-0000-000000000014',NULL,'analyst','investigating','resolved','Municipal ordinance awareness drive completed',now() - interval '13 days'),
('a2000001-0000-0000-0000-000000000026','d2000001-0000-0000-0000-000000000014',NULL,'super_admin','resolved','closed','Case closed after follow-up inspection',now() - interval '8 days')
ON CONFLICT DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- 8. Assignments → Makati CENRO desk (so the LGU login has active cases)
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO ticket_assignments (id,ticket_id,assigned_group_id,assignee_user_id,assigned_by_user_id,status,created_at)
SELECT a.id, a.ticket_id,
       (SELECT id FROM ngo_groups WHERE name = 'Makati City Environment Office'),
       (SELECT id FROM auth.users WHERE email = 'makati.lgu@likaslens.ph'),
       (SELECT id FROM auth.users WHERE email = 'superadmin@likaslens.ph'),
       'pending', a.created_at
FROM (VALUES
  ('t2000001-0000-0000-0000-000000000001','d2000001-0000-0000-0000-000000000001', now() - interval '3 hours'),
  ('t2000001-0000-0000-0000-000000000002','d2000001-0000-0000-0000-000000000002', now() - interval '6 hours'),
  ('t2000001-0000-0000-0000-000000000003','d2000001-0000-0000-0000-000000000004', now() - interval '18 hours'),
  ('t2000001-0000-0000-0000-000000000004','d2000001-0000-0000-0000-000000000007', now() - interval '3 days'),
  ('t2000001-0000-0000-0000-000000000005','d2000001-0000-0000-0000-000000000012', now() - interval '5 days')
) AS a(id, ticket_id, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM ticket_assignments ta WHERE ta.ticket_id = a.ticket_id
);

-- ───────────────────────────────────────────────────────────────────────────
-- 9. Notifications (status updates + one broadcast)
-- ───────────────────────────────────────────────────────────────────────────
INSERT INTO notifications (id,type,data,for_role,user_id,notifiable_type,notifiable_id,read_at,created_at)
VALUES
('n2000001-0000-0000-0000-000000000001','TicketAssigned',
 '{"title":"Report received","message":"Your report (illegal dumping) was received and auto-routed to the Makati City Environment Office.","ticket_id":"d2000001-0000-0000-0000-000000000001"}',
 NULL,(SELECT id FROM auth.users WHERE email = 'maria.citizen@likaslens.ph'),
 'App\\Models\\User',(SELECT id FROM auth.users WHERE email = 'maria.citizen@likaslens.ph'),NULL,
 now() - interval '3 hours'),

('n2000001-0000-0000-0000-000000000002','StatusChanged',
 '{"title":"Your report is under investigation","message":"The sewage discharge near Guadalupe bridge is now under investigation. An inspection team was dispatched.","ticket_id":"d2000001-0000-0000-0000-000000000004"}',
 NULL,(SELECT id FROM auth.users WHERE email = 'maria.citizen@likaslens.ph'),
 'App\\Models\\User',(SELECT id FROM auth.users WHERE email = 'maria.citizen@likaslens.ph'),NULL,
 now() - interval '18 hours'),

('n2000001-0000-0000-0000-000000000003','StatusChanged',
 '{"title":"Case resolved — thank you!","message":"The plastic waste at the EDSA Guadalupe underpass has been cleared and the case is verified. Your report helped clean Makati.","ticket_id":"d2000001-0000-0000-0000-000000000012"}',
 NULL,(SELECT id FROM auth.users WHERE email = 'jose.citizen@likaslens.ph'),
 'App\\Models\\User',(SELECT id FROM auth.users WHERE email = 'jose.citizen@likaslens.ph'),NULL,
 now() - interval '5 days'),

('n2000001-0000-0000-0000-000000000004','TicketAssigned',
 '{"title":"Officer assigned to your report","message":"The illegal fish pens report is being reviewed by the BFAR Laguna de Bay Office.","ticket_id":"d2000001-0000-0000-0000-000000000013"}',
 NULL,(SELECT id FROM auth.users WHERE email = 'gina.citizen@likaslens.ph'),
 'App\\Models\\User',(SELECT id FROM auth.users WHERE email = 'gina.citizen@likaslens.ph'),NULL,
 now() - interval '20 hours'),

('n2000001-0000-0000-0000-000000000005','Broadcast',
 '{"title":"Clean Air Month Drive","message":"Report smoke-belching vehicles through LikasLens — the MMDA and DENR-EMB are acting on verified reports this month."}',
 'citizen',NULL,'App\\Models\\User',
 (SELECT id FROM auth.users WHERE email = 'citizen@likaslens.ph'),NULL,
 now() - interval '2 days')
ON CONFLICT DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────
-- Done. Quick sanity check:
--   SELECT count(*) FROM tickets;                -- expect 14 new (29 total w/ old seed)
--   SELECT email, role FROM users
--     WHERE email IN ('makati.lgu@likaslens.ph','maria.citizen@likaslens.ph',
--                     'jose.citizen@likaslens.ph','gina.citizen@likaslens.ph');
-- ───────────────────────────────────────────────────────────────────────────