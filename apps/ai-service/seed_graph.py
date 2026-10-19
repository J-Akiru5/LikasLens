"""
Populate `environmental_laws_ph.embedding` with Gemini embeddings.

This is the pgvector replacement for the old Neo4j `law_embeddings` vector
index. Run it once after the schema migration, and again whenever a law is added
or a title changes.

    python seed_graph.py            # embed only rows with a NULL embedding
    python seed_graph.py --force    # re-embed every active law

It is safe to re-run. Requires GOOGLE_API_KEY (Gemini) and DATABASE_URL.
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import sys

from sqlalchemy import text

from db.connection import AsyncSessionLocal
from graph_rag import embed_text

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger("seed_graph")


def _vector_literal(values: list[float]) -> str:
    return "[" + ",".join(f"{v:.8f}" for v in values) + "]"


async def _laws(force: bool) -> list[dict]:
    if AsyncSessionLocal is None:
        raise SystemExit("DATABASE_URL not set")

    where = "deleted_at is null and coalesce(is_active, true)"
    if not force:
        where += " and embedding is null"

    async with AsyncSessionLocal() as session:
        rows = await session.execute(
            text(
                f"select id, law_code, title, summary from public.environmental_laws_ph "
                f"where {where} order by law_code"
            )
        )
        return [dict(r) for r in rows.mappings().all()]


async def _store(law_id, embedding: list[float]) -> None:
    async with AsyncSessionLocal() as session:
        await session.execute(
            text(
                "update public.environmental_laws_ph "
                "set embedding = cast(:vec as halfvec), updated_at = now() "
                "where id = :id"
            ),
            {"vec": _vector_literal(embedding), "id": law_id},
        )
        await session.commit()


def _document(law: dict) -> str:
    parts = [str(law.get("law_code") or ""), str(law.get("title") or "")]
    summary = law.get("summary")
    if summary:
        parts.append(str(summary))
    return ": ".join(p for p in parts if p)


async def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="re-embed every active law")
    args = parser.parse_args()

    laws = await _laws(args.force)
    if not laws:
        logger.info("Nothing to embed. Use --force to re-embed existing rows.")
        return 0

    logger.info("Embedding %d law(s)", len(laws))
    ok = 0
    failed = 0

    for law in laws:
        document = _document(law)
        try:
            embedding = await embed_text(document)
        except Exception as exc:
            failed += 1
            logger.warning("Failed to embed %s: %s", law.get("law_code"), exc)
            continue

        if len(embedding) != 3072:
            failed += 1
            logger.warning(
                "Unexpected embedding size for %s: %d (expected 3072)",
                law.get("law_code"),
                len(embedding),
            )
            continue

        await _store(law["id"], embedding)
        ok += 1
        logger.info("Embedded %s", law.get("law_code"))

    logger.info("Done: %d embedded, %d failed", ok, failed)
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
