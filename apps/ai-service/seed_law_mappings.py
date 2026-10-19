"""
Apply the researched violation -> statute mappings.

Source of truth: data/law_mappings_2026-10-20.json, produced by a dedicated
research pass that retrieved each provision from lawphil.net. Every link carries
a specific citation, a source URL, a confidence and a review status.

    python seed_law_mappings.py --dry-run   # executes, then rolls back
    python seed_law_mappings.py             # commits

Idempotent: links upsert on (violation_type_id, law_id); new laws are inserted
only if absent. `violation_types.law_id` is set to the primary link so the legacy
single-FK path agrees with the link table.

Requires DATABASE_URL.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import sys
from pathlib import Path

from sqlalchemy import text

from db.connection import AsyncSessionLocal

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger("seed_law_mappings")

DATA = Path(__file__).parent / "data" / "law_mappings_2026-10-20.json"


async def _law_id(session, code: str):
    return (
        await session.execute(
            text("select id from public.environmental_laws_ph where law_code = :c limit 1"),
            {"c": code},
        )
    ).scalar()


async def _violation_id(session, code: str):
    return (
        await session.execute(
            text(
                "select id from public.violation_types "
                "where upper(replace(code, '_', '-')) = :c limit 1"
            ),
            {"c": code.upper().replace("_", "-")},
        )
    ).scalar()


async def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if AsyncSessionLocal is None:
        raise SystemExit("DATABASE_URL not set")

    data = json.loads(DATA.read_text(encoding="utf-8"))
    problems: list[str] = []

    async with AsyncSessionLocal() as session:
        # 1. New statutes
        for law in data.get("new_laws", []):
            if await _law_id(session, law["law_code"]):
                logger.info("law exists: %s", law["law_code"])
                continue
            logger.info("adding law: %s", law["law_code"])
            await session.execute(
                text(
                    "insert into public.environmental_laws_ph "
                    "(id, law_code, title, summary, issuing_agency, jurisdiction_scope, "
                    " source_url, is_active, created_at, updated_at) "
                    "values (gen_random_uuid(), :code, :title, :summary, :agency, :scope, "
                    "        :url, :active, now(), now())"
                ),
                {
                    "code": law["law_code"],
                    "title": law["title"],
                    "summary": law.get("summary"),
                    "agency": law.get("issuing_agency"),
                    "scope": law.get("jurisdiction_scope", "national"),
                    "url": law.get("source_url"),
                    "active": law.get("is_active", True),
                },
            )
            await session.flush()

        # 2. Statute corrections. An amendment can make the stored title wrong,
        #    and a summary may be filled in from the retrieved text.
        for update in data.get("law_updates", []):
            params: dict[str, str] = {"c": update["law_code"]}
            assignments: list[str] = []
            if update.get("title"):
                assignments.append("title = :t")
                params["t"] = update["title"]
            if update.get("summary"):
                assignments.append("summary = :s")
                params["s"] = update["summary"]
            if not assignments:
                continue
            logger.info("law update: %s", update["law_code"])
            await session.execute(
                text(
                    "update public.environmental_laws_ph set "
                    + ", ".join(assignments)
                    + ", updated_at = now() where law_code = :c"
                ),
                params,
            )

        # 3. Rejected links
        for removal in data.get("remove_links", []):
            vid = await _violation_id(session, removal["violation_code"])
            lid = await _law_id(session, removal["law_code"])
            if not vid or not lid:
                continue
            logger.info(
                "removing link: %s -> %s",
                removal["violation_code"],
                removal["law_code"],
            )
            await session.execute(
                text(
                    "delete from public.violation_law_links "
                    "where violation_type_id = :v and law_id = :l"
                ),
                {"v": vid, "l": lid},
            )
            # The legacy single-FK pointer must not resurrect a rejected link.
            await session.execute(
                text(
                    "update public.violation_types set law_id = null "
                    "where id = :v and law_id = :l"
                ),
                {"v": vid, "l": lid},
            )

        # 4. Links
        applied = 0
        for link in data["links"]:
            vid = await _violation_id(session, link["violation_code"])
            lid = await _law_id(session, link["law_code"])
            if not vid:
                problems.append(f"unknown violation: {link['violation_code']}")
                continue
            if not lid:
                problems.append(f"unknown law: {link['law_code']}")
                continue
            if link["review_status"] not in ("verified", "pending"):
                problems.append(f"bad review_status on {link['violation_code']}")
                continue

            logger.info(
                "link: %-30s -> %-10s primary=%-5s %s",
                link["violation_code"],
                link["law_code"],
                link["is_primary"],
                link["review_status"],
            )
            if link["is_primary"]:
                # The partial unique index allows only one primary per violation.
                await session.execute(
                    text(
                        "update public.violation_law_links set is_primary = false "
                        "where violation_type_id = :v and law_id <> :l and is_primary"
                    ),
                    {"v": vid, "l": lid},
                )

            await session.execute(
                text(
                    "insert into public.violation_law_links "
                    "(violation_type_id, law_id, is_primary, source, citation, "
                    " citation_url, confidence, review_status, note) "
                    "values (:v, :l, :p, :src, :cit, :url, :conf, :status, :note) "
                    "on conflict (violation_type_id, law_id) do update set "
                    "  is_primary = excluded.is_primary,"
                    "  source = excluded.source,"
                    "  citation = excluded.citation,"
                    "  citation_url = excluded.citation_url,"
                    "  confidence = excluded.confidence,"
                    "  review_status = excluded.review_status,"
                    "  note = excluded.note"
                ),
                {
                    "v": vid,
                    "l": lid,
                    "p": link["is_primary"],
                    "src": "research-2026-10-20",
                    "cit": link.get("citation"),
                    "url": link.get("citation_url"),
                    "conf": link.get("confidence"),
                    "status": link["review_status"],
                    "note": link.get("note"),
                },
            )

            if link["is_primary"]:
                # Keep the legacy single-FK path in agreement.
                await session.execute(
                    text("update public.violation_types set law_id = :l where id = :v"),
                    {"l": lid, "v": vid},
                )
            applied += 1

        # 5. Embed new statutes. Without this a newly added law is invisible to
        #    the vector half until someone remembers to run seed_graph.py.
        for law in data.get("new_laws", []):
            lid = await _law_id(session, law["law_code"])
            if not lid:
                continue
            has_embedding = (
                await session.execute(
                    text(
                        "select embedding is not null from public.environmental_laws_ph "
                        "where id = :i"
                    ),
                    {"i": lid},
                )
            ).scalar()
            if has_embedding:
                continue
            try:
                from graph_rag import embed_text

                document = f"{law['law_code']}: {law['title']}. {law.get('summary') or ''}"
                vector = await embed_text(document)
                await session.execute(
                    text(
                        "update public.environmental_laws_ph "
                        "set embedding = cast(:v as halfvec), updated_at = now() "
                        "where id = :i"
                    ),
                    {"v": "[" + ",".join(f"{x:.8f}" for x in vector) + "]", "i": lid},
                )
                logger.info("embedded new law: %s", law["law_code"])
            except Exception as exc:
                problems.append(f"embedding failed for {law['law_code']}: {type(exc).__name__}")

        # 4/6. Never leave a half-applied mapping set behind.
        if problems:
            await session.rollback()
            logger.error("problems, rolled back: %s", "; ".join(problems))
            return 2

        if args.dry_run:
            await session.rollback()
            logger.info("dry run: %d link(s) executed, then rolled back", applied)
        else:
            await session.commit()
            logger.info("applied %d link(s)", applied)

    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
