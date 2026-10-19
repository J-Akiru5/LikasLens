-- ============================================================
-- violation_law_links — many-to-many statute mapping with provenance
-- APPLIED to the live project on 2026-10-20.
-- ============================================================
--
-- WHY
-- ---
-- `violation_types.law_id` is a single foreign key. In practice one violation
-- can breach several statutes (illegal logging breaches PD 705 and often
-- RA 7586 inside a protected area), and a mapping needs to say where it came
-- from and whether a human has reviewed it.
--
-- `law_id` stays as the primary pointer for backward compatibility. This table
-- carries the full set plus provenance. Readers UNION both, preferring
-- `is_primary`.
--
-- PROVENANCE FIELDS
-- -----------------
--   source        machine-readable origin, e.g. "existing-law_id",
--                 "research-2026-10-20"
--   citation_url  authoritative page for the provision
--   review_status "verified" (citation retrieved and checked) or "pending"
--                 (plausible, awaiting human legal review)
--
-- The two pre-existing mappings are backfilled as `pending`, because no one has
-- recorded a citation for them yet. That is deliberate: they were not verified.
--
-- Safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.violation_law_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  violation_type_id uuid NOT NULL REFERENCES public.violation_types(id) ON DELETE CASCADE,
  law_id uuid NOT NULL REFERENCES public.environmental_laws_ph(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  source text NOT NULL,
  citation_url text,
  review_status text NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('verified', 'pending')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (violation_type_id, law_id)
);

CREATE INDEX IF NOT EXISTS violation_law_links_violation_idx
  ON public.violation_law_links (violation_type_id);

-- Backfill the two existing single-FK mappings as primary, pending review.
INSERT INTO public.violation_law_links
  (violation_type_id, law_id, is_primary, source, review_status)
SELECT v.id, v.law_id, true, 'existing-law_id', 'pending'
FROM public.violation_types v
WHERE v.law_id IS NOT NULL
ON CONFLICT (violation_type_id, law_id) DO NOTHING;

-- Public knowledge, read-only. The AI service uses the service role and bypasses
-- RLS; these policies exist so the data is consistent with the other public
-- knowledge tables and cannot be written by a client.
ALTER TABLE public.violation_law_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "violation_law_links_public_read" ON public.violation_law_links;
CREATE POLICY "violation_law_links_public_read"
  ON public.violation_law_links
  FOR SELECT
  TO public
  USING (true);

-- VERIFICATION
-- ------------
--   SELECT count(*) FROM public.violation_law_links;
--   SELECT v.code, l.law_code, k.is_primary, k.source, k.review_status
--     FROM public.violation_law_links k
--     JOIN public.violation_types v ON v.id = k.violation_type_id
--     JOIN public.environmental_laws_ph l ON l.id = k.law_id
--    ORDER BY v.code;
