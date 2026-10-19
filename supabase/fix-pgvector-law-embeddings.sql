-- ============================================================
-- FIX: replace the Neo4j graph + vector index with Postgres + pgvector
-- APPLIED to the live project on 2026-10-20.
-- ============================================================
--
-- WHY
-- ---
-- The AI service used Neo4j AuraDB for two things:
--
--   1. a fixed hazard -> law -> agency lookup, and
--   2. a vector index over Gemini embeddings of the laws.
--
-- The AuraDB instance was deleted (its host no longer resolves), so every graph
-- call failed and `hazard_analyzer` returned no legal context at all.
--
-- None of that needed a graph database. The entities already live here:
--
--   violation_types.law_id  ->  environmental_laws_ph
--   ngo_groups                  (agencies: region / province / city, focus_area)
--
-- and pgvector can hold the same 3072-dimension Gemini embeddings that the Neo4j
-- vector index held.
--
-- WHAT THIS DOES
-- --------------
--   * enables the `vector` extension
--   * adds `environmental_laws_ph.embedding halfvec(3072)`
--   * adds an HNSW cosine index
--
-- `halfvec` rather than `vector`: pgvector's HNSW index supports up to 2000
-- dimensions for `vector` but 4000 for `halfvec`, and Gemini's embedding model
-- produces 3072. Verified on the live project: pgvector 0.8.0.
--
-- The column is nullable and additive. Nothing reads it until `seed_graph.py`
-- has populated it.
--
-- SEEDING
-- -------
--   python apps/ai-service/seed_graph.py --force
--
-- Verified after applying: 16/16 active laws embedded, and cosine search returns
-- the expected statute for each probe query:
--
--   "illegal dumping of household garbage in a vacant lot" -> RA-9003
--   "factory discharging untreated wastewater into a river" -> RA-9275 / PD-979
--   "cutting trees in a protected forest without a permit"  -> PD-705
--   "burning of trash in an open pit"                       -> RA-8749
--
-- Safe to re-run.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE public.environmental_laws_ph
  ADD COLUMN IF NOT EXISTS embedding halfvec(3072);

CREATE INDEX IF NOT EXISTS environmental_laws_ph_embedding_hnsw
  ON public.environmental_laws_ph
  USING hnsw (embedding halfvec_cosine_ops);

COMMENT ON COLUMN public.environmental_laws_ph.embedding IS
  'Gemini text embedding (3072d) for pgvector cosine search. Populate with seed_graph.py.';

-- VERIFICATION
-- ------------
--   SELECT extversion FROM pg_extension WHERE extname = 'vector';
--
--   SELECT count(*) FILTER (WHERE embedding IS NOT NULL) AS embedded,
--          count(*) AS total
--     FROM public.environmental_laws_ph
--    WHERE deleted_at IS NULL;
--
--   -- cosine search (replace the vector with a real query embedding):
--   SELECT law_code, title,
--          1 - (embedding <=> cast(:query_vec AS halfvec)) AS similarity
--     FROM public.environmental_laws_ph
--    WHERE embedding IS NOT NULL
--    ORDER BY embedding <=> cast(:query_vec AS halfvec)
--    LIMIT 5;
