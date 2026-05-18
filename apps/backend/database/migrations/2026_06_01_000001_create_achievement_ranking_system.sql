-- ============================================================================
-- LIKASLENS ACHIEVEMENT & RANKING SYSTEM
-- Execute this entire script in the Supabase SQL Editor.
-- ============================================================================

-- 1. ACHIEVEMENTS MASTER TABLE
-----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS achievements (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon_url    VARCHAR(512) NOT NULL,           -- asset reference for badge icon
    category    VARCHAR(50) NOT NULL DEFAULT 'reports',  -- reports | trust | xp | community
    threshold_type    VARCHAR(50) NOT NULL,      -- verified_reports | trust_score | total_xp
    threshold_value   INTEGER NOT NULL CHECK (threshold_value > 0),
    tier_level        SMALLINT NOT NULL DEFAULT 1 CHECK (tier_level BETWEEN 1 AND 3),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE achievements IS 'Master list of all achievement milestones';
COMMENT ON COLUMN achievements.threshold_type IS 'The stat column to check: verified_reports, trust_score, total_xp';
COMMENT ON COLUMN achievements.tier_level IS '1=Novice, 2=Eco-Guardian, 3=Environmental Champion';

CREATE INDEX idx_achievements_tier ON achievements (tier_level);
CREATE INDEX idx_achievements_threshold ON achievements (threshold_type, threshold_value);


-- 2. CITIZEN ACHIEVEMENTS JUNCTION TABLE
-----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS citizen_achievements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id  UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_citizen_achievement UNIQUE (user_id, achievement_id)
);

COMMENT ON TABLE citizen_achievements IS 'Tracks which achievements each citizen has unlocked';

CREATE INDEX idx_citizen_achievements_user ON citizen_achievements (user_id);
CREATE INDEX idx_citizen_achievements_achievement ON citizen_achievements (achievement_id);


-- 3. EXTEND CITIZEN PROFILE WITH RANKING COLUMNS
-----------------------------------------------------------------------------
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS total_verified_reports INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_xp             INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ranking_tier         SMALLINT NOT NULL DEFAULT 1
        CHECK (ranking_tier BETWEEN 1 AND 3);

COMMENT ON COLUMN users.total_verified_reports IS 'Lifetime count of user reports that reached Verified status';
COMMENT ON COLUMN users.total_xp IS 'Cumulative experience points earned through civic participation';
COMMENT ON COLUMN users.ranking_tier IS '1=Novice, 2=Eco-Guardian, 3=Environmental Champion';


-- 4. SEED ACHIEVEMENT DATA
-----------------------------------------------------------------------------
INSERT INTO achievements (title, description, icon_url, category, threshold_type, threshold_value, tier_level) VALUES
-- Tier 1: Novice (rank 1)
('First Steps',       'Submit your first verified hazard report',                     '/badges/first-steps.svg',       'reports', 'verified_reports', 1,   1),
('Eco-Enthusiast',    'Reach 5 verified hazard reports',                              '/badges/eco-enthusiast.svg',    'reports', 'verified_reports', 5,   1),
('Trusted Voice',     'Earn a trust score of 25',                                     '/badges/trusted-voice.svg',     'trust',   'trust_score',      25,  1),

-- Tier 2: Eco-Guardian (rank 2)
('Guardian in Training', 'Submit 25 verified hazard reports',                         '/badges/guardian-training.svg', 'reports', 'verified_reports', 25,  2),
('Community Sentinel',   'Earn a trust score of 50',                                  '/badges/community-sentinel.svg','trust',   'trust_score',      50,  2),
('Century Starter',      'Accumulate 100 total XP',                                   '/badges/century-starter.svg',   'xp',      'total_xp',         100, 2),

-- Tier 3: Environmental Champion (rank 3)
('Hazard Hunter',     'Submit 100 verified hazard reports',                           '/badges/hazard-hunter.svg',     'reports', 'verified_reports', 100, 3),
('Paragon of Trust',  'Earn a trust score of 80',                                     '/badges/paragon-trust.svg',     'trust',   'trust_score',      80,  3),
('Legendary Guardian','Accumulate 500 total XP',                                      '/badges/legendary-guardian.svg','xp',      'total_xp',         500, 3)
ON CONFLICT DO NOTHING;


-- 5. HELPER: TIER-TO-LEVEL MAPPING
-----------------------------------------------------------------------------
-- Determines ranking_tier from total_verified_reports.
-- Thresholds are inclusive: reaching the count promotes the citizen.
CREATE OR REPLACE FUNCTION calculate_ranking_tier(p_verified_reports INTEGER)
RETURNS SMALLINT
LANGUAGE SQL IMMUTABLE
AS $$
    SELECT CASE
        WHEN p_verified_reports >= 100 THEN 3   -- Environmental Champion
        WHEN p_verified_reports >= 25  THEN 2   -- Eco-Guardian
        ELSE 1                                    -- Novice
    END::SMALLINT;
$$;


-- 6. HELPER: ECO-CREDIT TIER MULTIPLIER
-----------------------------------------------------------------------------
-- Each tier gives a progressively higher baseline payout multiplier.
CREATE OR REPLACE FUNCTION eco_credit_tier_multiplier(p_tier SMALLINT)
RETURNS NUMERIC(5,2)
LANGUAGE SQL IMMUTABLE
AS $$
    SELECT CASE p_tier
        WHEN 1 THEN 1.0    -- Novice: base rate
        WHEN 2 THEN 1.5    -- Eco-Guardian: 50% bonus
        WHEN 3 THEN 2.5    -- Environmental Champion: 150% bonus
        ELSE 1.0
    END;
$$;


-- 7. TRIGGER FUNCTION: AUTO-RANK ON VERIFICATION
-----------------------------------------------------------------------------
-- Automatically:
--   1. Increments the reporter's verified count & XP
--   2. Recalculates ranking_tier based on new verified count
--   3. Awards any newly unlocked achievements
--   4. Dispatches eco-credit bonus via the reward_point_ledger
--
-- Fires on UPDATE of tickets.status when it changes TO 'Verified'.
CREATE OR REPLACE FUNCTION process_verified_ticket()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
DECLARE
    v_user_id         UUID;
    v_new_tier        SMALLINT;
    v_old_tier        SMALLINT;
    v_multiplier      NUMERIC(5,2);
    v_xp_awarded      INTEGER := 10;   -- base XP per verified report
    v_credit_award    BIGINT;
    v_rec             RECORD;
    v_current_xp      INTEGER;
    v_current_trust   INTEGER;
BEGIN
    -- Only act when status transitions *to* Verified
    IF NEW.status IS DISTINCT FROM 'Verified'
        OR OLD.status = 'Verified'
    THEN
        RETURN NEW;
    END IF;

    v_user_id := NEW.reporter_user_id;

    -- ----------------------------------------------------------
    -- A) Increment stats on the reporter's profile
    -- ----------------------------------------------------------
    UPDATE users
    SET
        total_verified_reports = total_verified_reports + 1,
        total_xp              = total_xp + v_xp_awarded
    WHERE id = v_user_id
    RETURNING
        total_verified_reports,
        total_xp,
        trust_score,
        ranking_tier
    INTO
        v_rec.total_verified_reports,
        v_rec.total_xp,
        v_rec.trust_score,
        v_rec.ranking_tier;

    -- If the user row somehow vanished, skip
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    -- ----------------------------------------------------------
    -- B) Recalculate ranking tier
    -- ----------------------------------------------------------
    v_new_tier := calculate_ranking_tier(v_rec.total_verified_reports);
    v_old_tier := v_rec.ranking_tier;

    IF v_new_tier != v_old_tier THEN
        UPDATE users SET ranking_tier = v_new_tier WHERE id = v_user_id;
    END IF;

    -- ----------------------------------------------------------
    -- C) Award newly unlocked achievements
    -- ----------------------------------------------------------
    -- Check achievements whose threshold the user now meets
    -- but has not yet been awarded.
    FOR v_rec IN
        SELECT a.id, a.title
        FROM achievements a
        WHERE
            NOT EXISTS (
                SELECT 1 FROM citizen_achievements ca
                WHERE ca.user_id = v_user_id AND ca.achievement_id = a.id
            )
            AND (
                (a.threshold_type = 'verified_reports' AND v_rec.total_verified_reports >= a.threshold_value)
                OR (a.threshold_type = 'total_xp'       AND v_rec.total_xp             >= a.threshold_value)
                OR (a.threshold_type = 'trust_score'    AND v_rec.trust_score          >= a.threshold_value)
            )
    LOOP
        INSERT INTO citizen_achievements (user_id, achievement_id)
        VALUES (v_user_id, v_rec.id);

        -- Bonus XP for unlocking an achievement
        UPDATE users SET total_xp = total_xp + 25 WHERE id = v_user_id;
    END LOOP;

    -- ----------------------------------------------------------
    -- D) Scale eco-credit payout based on current tier
    -- ----------------------------------------------------------
    v_multiplier   := eco_credit_tier_multiplier(v_new_tier);
    v_credit_award := (10 * v_multiplier)::BIGINT;  -- base 10 credits * multiplier

    UPDATE citizen_wallets
    SET
        available_credits = available_credits + v_credit_award,
        lifetime_earned   = lifetime_earned   + v_credit_award
    WHERE user_id = v_user_id;

    RETURN NEW;
END;
$$;


-- 8. TRIGGER: WIRE THE FUNCTION TO THE TICKETS TABLE
-----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_ticket_verified ON tickets;
CREATE TRIGGER trg_ticket_verified
    AFTER UPDATE OF status ON tickets
    FOR EACH ROW
    WHEN (NEW.status = 'Verified' AND (OLD.status IS DISTINCT FROM 'Verified'))
    EXECUTE FUNCTION process_verified_ticket();


-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
