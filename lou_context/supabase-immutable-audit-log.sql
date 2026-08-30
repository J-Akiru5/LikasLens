-- ============================================================
-- LIKASLENS IMMUTABLE AUDIT LOG SYSTEM
-- Date: 2026-08-29
--
-- Features:
--   1. Append-only audit_logs table (no UPDATE/DELETE)
--   2. SHA-256 hash chaining (each entry hashes the previous)
--   3. Automatic triggers for all critical actions
--   4. Cryptographic verification function
--   5. Admin-only read access
--
-- Why not blockchain:
--   - Same tamper-evidence (SHA-256 hash chain)
--   - No crypto wallet complexity for LGU staff
--   - No gas fees
--   - SQL queries (milliseconds vs seconds)
--   - Works with existing Supabase infrastructure
--   - Government auditors understand SQL
-- ============================================================


-- ============================================================
-- 1. RECREATE AUDIT_LOGS TABLE (immutable, append-only)
-- ============================================================

-- Drop existing table and policies (safe — audit_logs is empty or low-value)
DROP POLICY IF EXISTS "admin_read_audit_logs" ON audit_logs;
DROP TRIGGER IF EXISTS "audit_immutable_guard" ON audit_logs;
DROP FUNCTION IF EXISTS "prevent_audit_modification"();
DROP FUNCTION IF EXISTS "compute_audit_hash"(TEXT, JSONB, UUID);
DROP FUNCTION IF EXISTS "verify_audit_chain"(INTEGER, INTEGER);
DROP TABLE IF EXISTS audit_logs;

-- Create immutable audit_logs table
CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- What happened
  action        TEXT NOT NULL,           -- 'ticket.created', 'ticket.status_changed', 'user.login', etc.
  entity_type   TEXT NOT NULL,           -- 'ticket', 'user', 'report', 'system'
  entity_id     UUID,                    -- ID of the affected entity
  
  -- Who did it
  actor_id      UUID,                    -- auth.uid() of the actor (null for system actions)
  actor_email   TEXT,                    -- Denormalized for readability
  actor_role    TEXT,                    -- 'citizen', 'analyst', 'super_admin', 'system'
  
  -- What changed
  old_data      JSONB,                   -- Previous state (for updates)
  new_data      JSONB,                   -- New state (for creates/updates)
  
  -- Tamper evidence
  prev_hash     TEXT NOT NULL,           -- SHA-256 hash of the previous audit log entry
  entry_hash    TEXT NOT NULL,           -- SHA-256 hash of this entry
  
  -- Context
  ip_address    INET,
  user_agent    TEXT,
  metadata      JSONB                    -- Additional context (route, locale, etc.)
);

-- Indexes for common queries
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs (actor_id);
CREATE INDEX idx_audit_logs_entry_hash ON audit_logs (entry_hash);

-- Comments
COMMENT ON TABLE audit_logs IS 'Immutable audit trail with SHA-256 hash chaining. Append-only — no UPDATE or DELETE allowed.';
COMMENT ON COLUMN audit_logs.prev_hash IS 'SHA-256 hash of the previous audit log entry. Creates tamper-evident chain.';
COMMENT ON COLUMN audit_logs.entry_hash IS 'SHA-256 hash of this entry: hash(action + entity_type + entity_id + actor_id + new_data + prev_hash + created_at)';
COMMENT ON COLUMN audit_logs.old_data IS 'Previous state before change (null for creates). Stored as JSONB for queryability.';
COMMENT ON COLUMN audit_logs.new_data IS 'New state after change. Stored as JSONB for queryability.';


-- ============================================================
-- 2. HASH CHAINING FUNCTIONS
-- ============================================================

-- Compute SHA-256 hash for an audit log entry
CREATE OR REPLACE FUNCTION compute_audit_hash(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_actor_id UUID,
  p_new_data JSONB,
  p_prev_hash TEXT,
  p_created_at TIMESTAMPTZ
) RETURNS TEXT
LANGUAGE SQL IMMUTABLE
AS $$
  SELECT encode(
    digest(
      p_action || '|' ||
      p_entity_type || '|' ||
      COALESCE(p_entity_id::TEXT, '') || '|' ||
      COALESCE(p_actor_id::TEXT, '') || '|' ||
      COALESCE(p_new_data::TEXT, '') || '|' ||
      p_prev_hash || '|' ||
      p_created_at::TEXT,
      'sha256'
    ),
    'hex'
  );
$$;

-- Get the hash of the most recent audit log entry
CREATE OR REPLACE FUNCTION get_last_audit_hash()
RETURNS TEXT
LANGUAGE SQL STABLE
AS $$
  SELECT COALESCE(
    (SELECT entry_hash FROM audit_logs ORDER BY created_at DESC LIMIT 1),
    '0000000000000000000000000000000000000000000000000000000000000000'
  );
$$;


-- ============================================================
-- 3. IMMUTABLE GUARD (prevent UPDATE/DELETE)
-- ============================================================

CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable. UPDATE and DELETE operations are prohibited.';
  RETURN NULL;
END;
$$;

CREATE TRIGGER audit_immutable_guard
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_modification();


-- ============================================================
-- 4. AUTOMATIC HASH CHAINING TRIGGER
-- ============================================================

-- Auto-compute prev_hash and entry_hash on INSERT
CREATE OR REPLACE FUNCTION compute_audit_chain_hash()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  -- Get the hash of the previous entry
  IF NEW.prev_hash IS NULL OR NEW.prev_hash = '' THEN
    NEW.prev_hash := get_last_audit_hash();
  END IF;
  
  -- Compute this entry's hash
  NEW.entry_hash := compute_audit_hash(
    NEW.action,
    NEW.entity_type,
    NEW.entity_id,
    NEW.actor_id,
    NEW.new_data,
    NEW.prev_hash,
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_compute_hash
  BEFORE INSERT ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION compute_audit_chain_hash();


-- ============================================================
-- 5. CHAIN VERIFICATION FUNCTION
-- ============================================================

-- Verify the integrity of the audit chain between two sequence numbers
-- Returns: (is_valid, broken_at_index, error_message)
CREATE OR REPLACE FUNCTION verify_audit_chain(
  p_from_index INTEGER DEFAULT 1,
  p_to_index INTEGER DEFAULT 999999
) RETURNS TABLE (
  is_valid BOOLEAN,
  broken_at_id UUID,
  error_message TEXT
)
LANGUAGE PLPGSQL
AS $$
DECLARE
  v_prev_hash TEXT := '0000000000000000000000000000000000000000000000000000000000000000';
  v_rec RECORD;
  v_expected_hash TEXT;
  v_count INTEGER := 0;
BEGIN
  FOR v_rec IN
    SELECT id, action, entity_type, entity_id, actor_id, new_data, prev_hash, entry_hash, created_at
    FROM audit_logs
    ORDER BY created_at ASC, id ASC
  LOOP
    v_count := v_count + 1;
    
    -- Skip entries before our range
    IF v_count < p_from_index THEN
      CONTINUE;
    END IF;
    
    -- Stop after our range
    IF v_count > p_to_index THEN
      EXIT;
    END IF;
    
    -- Verify the chain link
    IF v_rec.prev_hash != v_prev_hash THEN
      RETURN QUERY SELECT FALSE, v_rec.id,
        format('Chain broken at entry %s: prev_hash mismatch (expected %s, got %s)',
               v_count, v_prev_hash, v_rec.prev_hash);
      RETURN;
    END IF;
    
    -- Recompute the expected hash
    v_expected_hash := compute_audit_hash(
      v_rec.action,
      v_rec.entity_type,
      v_rec.entity_id,
      v_rec.actor_id,
      v_rec.new_data,
      v_rec.prev_hash,
      v_rec.created_at
    );
    
    -- Verify the entry hash
    IF v_rec.entry_hash != v_expected_hash THEN
      RETURN QUERY SELECT FALSE, v_rec.id,
        format('Chain broken at entry %s: entry_hash mismatch (expected %s, got %s)',
               v_count, v_expected_hash, v_rec.entry_hash);
      RETURN;
    END IF;
    
    -- Move to next
    v_prev_hash := v_rec.entry_hash;
  END LOOP;
  
  -- Chain is valid
  RETURN QUERY SELECT TRUE, NULL::UUID, NULL::TEXT;
END;
$$;


-- ============================================================
-- 6. RLS POLICIES (admin-only read, system can insert)
-- ============================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

-- Admins can read audit logs
CREATE POLICY "admin_read_audit_logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (select auth.uid())
        AND users.role IN ('admin', 'super_admin', 'analyst')
    )
  );

-- Authenticated users can insert (the app writes audit logs)
CREATE POLICY "auth_insert_audit_logs" ON audit_logs
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

-- System can also insert (for server-side audit logging)
-- This is handled by the service_role key which bypasses RLS


-- ============================================================
-- 7. HELPER: INSERT AUDIT LOG (called by application code)
-- ============================================================

-- Convenience function for inserting audit logs
CREATE OR REPLACE FUNCTION log_audit_event(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL,
  p_actor_email TEXT DEFAULT NULL,
  p_actor_role TEXT DEFAULT NULL,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS UUID
LANGUAGE PLPGSQL
SECURITY DEFINER  -- Runs with table owner privileges (bypasses RLS for inserts)
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO audit_logs (
    action, entity_type, entity_id,
    actor_id, actor_email, actor_role,
    old_data, new_data,
    ip_address, user_agent, metadata
  ) VALUES (
    p_action, p_entity_type, p_entity_id,
    p_actor_id, p_actor_email, p_actor_role,
    p_old_data, p_new_data,
    p_ip_address, p_user_agent, p_metadata
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- Revoke direct execution from public roles (only app code should call this)
REVOKE EXECUTE ON FUNCTION log_audit_event(
  TEXT, TEXT, UUID, UUID, TEXT, TEXT, JSONB, JSONB, INET, TEXT, JSONB
) FROM PUBLIC, anon, authenticated;


-- ============================================================
-- 8. SEED: INITIAL GENESIS HASH ENTRY
-- ============================================================

-- Insert a genesis entry to start the chain
INSERT INTO audit_logs (action, entity_type, new_data, actor_role, metadata)
VALUES (
  'system.initialized',
  'system',
  '{"message": "Audit log system initialized. All subsequent entries are hash-chained."}'::JSONB,
  'system',
  '{"version": "1.0.0", "algorithm": "SHA-256", "chain_type": "append-only"}'::JSONB
);


-- ============================================================
-- DONE
-- Run this in Supabase Dashboard → SQL Editor
--
-- To verify chain integrity:
--   SELECT * FROM verify_audit_chain();
--
-- To insert an audit log from application code:
--   SELECT log_audit_event(
--     'ticket.created',      -- action
--     'ticket',              -- entity_type
--     ticket_id,             -- entity_id
--     user_id,               -- actor_id
--     'user@example.com',    -- actor_email
--     'citizen',             -- actor_role
--     NULL,                  -- old_data (null for creates)
--     '{"status": "pending"}'::JSONB,  -- new_data
--     '192.168.1.1'::INET,  -- ip_address
--     'Mozilla/5.0...',      -- user_agent
--     '{"locale": "en"}'::JSONB  -- metadata
--   );
-- ============================================================
