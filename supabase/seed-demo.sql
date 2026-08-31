-- LikasLens Demo Seed SQL
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/sfklmmtimelotqvrldni/sql/new
-- NOTE: auth.users and auth.identities are auto-provisioned by the login page.
--       This script only fixes the public users table and seeds demo data.

-- 1. Fix NOT NULL password blocker (Laravel legacy)
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;


-- 1b. Set known passwords on existing auth users (idempotent)
UPDATE auth.users SET encrypted_password = crypt('Analyst123!', gen_salt('bf'))
WHERE email = 'analyst@likaslens.ph';
UPDATE auth.users SET encrypted_password = crypt('Admin123!', gen_salt('bf'))
WHERE email = 'superadmin@likaslens.ph';
UPDATE auth.users SET encrypted_password = crypt('Citizen123!', gen_salt('bf'))
WHERE email = 'citizen@likaslens.ph';

-- 1c. Ensure all auth users are confirmed (email_confirmed_at set)
UPDATE auth.users SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL
  AND email IN ('analyst@likaslens.ph', 'superadmin@likaslens.ph', 'citizen@likaslens.ph');

-- 1d. Ensure user_metadata has role set
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "analyst"}'::jsonb
WHERE email = 'analyst@likaslens.ph'
  AND (raw_user_meta_data IS NULL OR raw_user_meta_data->>'role' IS NULL);

UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "super_admin"}'::jsonb
WHERE email = 'superadmin@likaslens.ph'
  AND (raw_user_meta_data IS NULL OR raw_user_meta_data->>'role' IS NULL);

-- 2. Upsert App-Side User Rows (public.users)
-- The login page creates auth.users via signUp, but the public.users row
-- with role may not exist. We upsert by email to handle both cases.
-- NOTE: This uses the auth user's UUID from auth.users if it exists.
-- If it doesn't match, the ON CONFLICT handles it gracefully.
INSERT INTO users (id, supabase_auth_user_id, name, email, role, created_at)
SELECT au.id, au.id, COALESCE(au.raw_user_meta_data->>'full_name', 'User'), au.email,
       COALESCE(au.raw_user_meta_data->>'role', 'citizen'), au.created_at
FROM auth.users au
WHERE au.email IN ('analyst@likaslens.ph', 'superadmin@likaslens.ph', 'citizen@likaslens.ph')
ON CONFLICT DO NOTHING;

-- 3. Sample Tickets (15 environmental reports across all statuses)
INSERT INTO tickets (id,title,description,status,ghost_mode,latitude,longitude,location_fuzzed,address_text,ai_triage_summary,ai_confidence,ai_recommended_office,routing_source,urgency_score,reporter_user_id,submission_path,created_at,updated_at)
VALUES
('d1000001-0000-0000-0000-000000000001','Illegal dumping near Pasig River estero','Large pile of construction waste dumped along estero bank.','open',false,14.5995,120.9842,false,'Barangay 649, Tondo, Manila','Illegal Dumping',0.91,'LGU Environment Office','neo4j',8.5,NULL,'ai_service',now()-interval '2 hours',now()-interval '2 hours'),
('d1000001-0000-0000-0000-000000000002','Factory smoke belching in Valenzuela','Thick black smoke from metal processing factory.','open',false,14.7005,120.9682,false,'Paso de Blas, Valenzuela City','Air Pollution',0.88,'DENR-EMB Air Quality Division','neo4j',7.2,NULL,'ai_service',now()-interval '5 hours',now()-interval '5 hours'),
('d1000001-0000-0000-0000-000000000003','Coral reef damage from dynamite fishing','Dead coral fragments near the shore. Sanctuary markers destroyed.','open',true,10.3156,123.8908,true,'Moalboal, Cebu','Marine Destruction',0.95,'PCG Marine Environmental Protection','neo4j',9.0,NULL,'ai_service',now()-interval '8 hours',now()-interval '8 hours'),
('d1000001-0000-0000-0000-000000000004','Illegal logging in Sierra Madre watershed','Large mahogany logs transported by truck at dawn.','investigating',false,16.3989,120.5897,false,'San Nicolas, Pangasinan','Deforestation',0.87,'DENR Forest Management Bureau','neo4j',8.0,NULL,'ai_service',now()-interval '1 day',now()-interval '12 hours'),
('d1000001-0000-0000-0000-000000000005','Industrial effluent in Marikina River','Foamy yellow discharge from textile factory pipe.','investigating',false,14.6213,121.0895,false,'Barangay San Roque, Marikina','Water Pollution',0.92,'DENR Water Resources Division','neo4j',8.8,NULL,'ai_service',now()-interval '1 day',now()-interval '18 hours'),
('d1000001-0000-0000-0000-000000000006','Open burning of agricultural waste Pampanga','Rice straw burning across multiple fields.','monitoring',false,14.9965,120.6880,false,'Minalin, Pampanga','Air Pollution',0.75,'DENR-EMB Regional Office','postgresql_fallback',5.5,NULL,'direct_fallback',now()-interval '3 days',now()-interval '2 days'),
('d1000001-0000-0000-0000-000000000007','Sewage overflow in Manila Bay','Raw sewage flowing from outdated treatment pipe.','resolved',false,14.5547,120.9822,false,'CCP Complex, Manila Bay','Water Pollution',0.89,'DENR-EMB Water Quality Division','neo4j',7.5,NULL,'ai_service',now()-interval '5 days',now()-interval '3 days'),
('d1000001-0000-0000-0000-000000000008','Plastic waste in Boracay beachfront','Single-use plastics washing ashore. Tourism affected.','resolved',false,11.9674,121.9248,false,'White Beach, Boracay','Illegal Dumping',0.82,'LGU Environment Office','postgresql_fallback',6.5,NULL,'direct_fallback',now()-interval '7 days',now()-interval '5 days'),
('d1000001-0000-0000-0000-000000000009','Hazardous waste dumping in Cavite','Drums of chemical waste abandoned near a creek.','verified',false,14.3297,120.9155,false,'General Trias, Cavite','Hazardous Waste',0.93,'DENR-EMB Hazardous Waste Division','neo4j',9.2,NULL,'ai_service',now()-interval '10 days',now()-interval '8 days'),
('d1000001-0000-0000-0000-000000000010','Vehicle smoke belching on EDSA','Bus emitting thick black smoke near Cubao.','closed',false,14.6197,121.0465,false,'Cubao, Quezon City','Air Pollution',0.78,'Land Transportation Office','postgresql_fallback',5.0,NULL,'direct_fallback',now()-interval '14 days',now()-interval '12 days'),
('d1000001-0000-0000-0000-000000000011','Chemical spill near Batangas port','Orange liquid flowing toward port area.','open',true,13.7565,121.0583,true,'Batangas International Port','Hazardous Waste',0.90,'DENR-EMB Emergency Response','neo4j',9.5,NULL,'ai_service',now()-interval '1 hour',now()-interval '1 hour'),
('d1000001-0000-0000-0000-000000000012','Illegal quarrying in Rizal mountainside','Heavy equipment on hillside. Muddy runoff.','investigating',true,14.5500,121.1700,true,'Tanay, Rizal','Deforestation',0.84,'DENR Mines and Geosciences Bureau','neo4j',7.8,NULL,'ai_service',now()-interval '6 hours',now()-interval '3 hours'),
('d1000001-0000-0000-0000-000000000013','Night construction noise pollution','Heavy machinery past 10 PM in residential zone.','pending_review',false,14.5853,121.0182,false,'BGC, Taguig','Noise Pollution',0.65,'LGU Environment Office','postgresql_fallback',4.0,NULL,'direct_fallback',now()-interval '4 days',now()-interval '2 days'),
('d1000001-0000-0000-0000-000000000014','Illegal fish pens in Laguna de Bay','Unauthorized fish pens blocking waterway.','open',false,14.3800,121.2000,false,'Santa Rosa, Laguna','Water Pollution',0.72,'BFAR Regional Office','postgresql_fallback',5.5,NULL,'direct_fallback',now()-interval '12 hours',now()-interval '12 hours'),
('d1000001-0000-0000-0000-000000000015','Wetland destruction for resort construction','Mangrove area being cleared. Birds displaced.','investigating',false,9.7900,118.7400,false,'Puerto Princesa, Palawan','Deforestation',0.88,'DENR-EMB Protected Areas Division','neo4j',8.2,NULL,'ai_service',now()-interval '2 days',now()-interval '1 day')
ON CONFLICT DO NOTHING;

-- 4. Timeline entries showing realistic status progression
INSERT INTO ticket_timeline (id,ticket_id,actor_id,actor_type,from_status,to_status,note,created_at)
VALUES
('a1000001-0000-0000-0000-000000000001','d1000001-0000-0000-0000-000000000004',NULL,'system',NULL,'open','Report submitted by citizen',now()-interval '1 day'),
('a1000001-0000-0000-0000-000000000002','d1000001-0000-0000-0000-000000000004',NULL,'analyst','open','investigating','Dispatched field team to verify deforestation',now()-interval '18 hours'),
('a1000001-0000-0000-0000-000000000003','d1000001-0000-0000-0000-000000000005',NULL,'system',NULL,'open','Report submitted by citizen',now()-interval '1 day'),
('a1000001-0000-0000-0000-000000000004','d1000001-0000-0000-0000-000000000005',NULL,'analyst','open','investigating','Water sampling scheduled with DENR-EMB',now()-interval '12 hours'),
('a1000001-0000-0000-0000-000000000005','d1000001-0000-0000-0000-000000000007',NULL,'system',NULL,'open','Report submitted by citizen',now()-interval '5 days'),
('a1000001-0000-0000-0000-000000000006','d1000001-0000-0000-0000-000000000007',NULL,'analyst','open','investigating','Inspection team dispatched to CCP Complex',now()-interval '4 days'),
('a1000001-0000-0000-0000-000000000007','d1000001-0000-0000-0000-000000000007',NULL,'analyst','investigating','monitoring','Temporary containment in place',now()-interval '3 days'),
('a1000001-0000-0000-0000-000000000008','d1000001-0000-0000-0000-000000000007',NULL,'analyst','monitoring','resolved','Sewage pipe repaired by MWSS',now()-interval '2 days'),
('a1000001-0000-0000-0000-000000000009','d1000001-0000-0000-0000-000000000009',NULL,'system',NULL,'open','Report submitted by citizen',now()-interval '10 days'),
('a1000001-0000-0000-0000-000000000010','d1000001-0000-0000-0000-000000000009',NULL,'analyst','open','investigating','Hazmat team deployed for drum containment',now()-interval '9 days'),
('a1000001-0000-0000-0000-000000000011','d1000001-0000-0000-0000-000000000009',NULL,'analyst','investigating','resolved','All drums collected and disposed',now()-interval '8 days'),
('a1000001-0000-0000-0000-000000000012','d1000001-0000-0000-0000-000000000009',NULL,'super_admin','resolved','verified','Site remediation confirmed',now()-interval '7 days'),
('a1000001-0000-0000-0000-000000000013','d1000001-0000-0000-0000-000000000010',NULL,'system',NULL,'open','Report submitted by citizen',now()-interval '14 days'),
('a1000001-0000-0000-0000-000000000014','d1000001-0000-0000-0000-000000000010',NULL,'analyst','open','investigating','LTO notified with plate number evidence',now()-interval '13 days'),
('a1000001-0000-0000-0000-000000000015','d1000001-0000-0000-0000-000000000010',NULL,'analyst','investigating','resolved','Bus operator issued citation',now()-interval '12 days'),
('a1000001-0000-0000-0000-000000000016','d1000001-0000-0000-0000-000000000010',NULL,'super_admin','resolved','verified','Follow-up inspection passed',now()-interval '11 days'),
('a1000001-0000-0000-0000-000000000017','d1000001-0000-0000-0000-000000000010',NULL,'super_admin','verified','closed','Case closed. Enforcement completed.',now()-interval '10 days')
ON CONFLICT DO NOTHING;
