"""Integration tests for the Postgres knowledge store.

These exercise the real SQL — the `distinct on (code)` union between the legacy
`violation_types.law_id` path and `violation_law_links`, the jurisdiction filter,
and the provenance columns. Unit tests cannot catch a broken join.

They are skipped automatically when DATABASE_URL is unset, which is the case in
CI. Run them locally by opting in with a dedicated variable, so no other test
module or fixture can accidentally point them at the wrong database:

    $env:LIKASLENS_TEST_DATABASE_URL = '<the same URL as DATABASE_URL>'
    python -m pytest tests/test_graph_store_integration.py -q
"""

from __future__ import annotations

import asyncio
import os

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

# A dedicated opt-in variable, not DATABASE_URL. Two things make DATABASE_URL
# unreliable here: the suite-wide conftest fixture rewrites it to a localhost
# placeholder, and test_e2e_migration.py calls os.environ.setdefault on it at
# import time. Either would make these tests run against the wrong database.
REAL_DATABASE_URL = os.environ.get("LIKASLENS_TEST_DATABASE_URL")

pytestmark = pytest.mark.skipif(
    not REAL_DATABASE_URL,
    reason="LIKASLENS_TEST_DATABASE_URL not set - skipping database integration tests",
)


@pytest.fixture(autouse=True)
def _bind_real_database(monkeypatch):
    """Point graph_store at the real database for this module only.

    NullPool avoids binding pooled connections to a test's event loop, so each
    `asyncio.run` can create and close its own connection safely.
    """
    import graph_store

    engine = create_async_engine(REAL_DATABASE_URL, poolclass=NullPool)
    maker = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    monkeypatch.setattr(graph_store, "AsyncSessionLocal", maker)
    yield


def _run(coro):
    return asyncio.run(coro)


def test_all_violation_types_are_linked():
    import graph_store

    hazards = _run(graph_store.list_hazards())

    assert len(hazards) == 11
    assert all(h["linked"] for h in hazards), [
        h["code"] for h in hazards if not h["linked"]
    ]
    for hazard in hazards:
        for law in hazard["laws"]:
            assert law["code"], hazard["code"]
            assert law["title"], hazard["code"]
            assert law["review_status"] in ("verified", "pending")


def test_dumping_maps_to_solid_waste_act():
    import graph_store

    laws = _run(graph_store.laws_for_hazard("SWM-ILLEGAL-DUMPING"))
    codes = {law["code"] for law in laws}

    assert "RA-9003" in codes
    primary = [law for law in laws if law["is_primary"]]
    assert len(primary) == 1
    assert primary[0]["code"] == "RA-9003"


def test_mangrove_mapping_was_corrected():
    """The old RA-7611 link was rejected: Palawan-only, no penal section."""
    import graph_store

    laws = _run(graph_store.laws_for_hazard("MANGROVE-DESTRUCTION"))
    codes = {law["code"] for law in laws}

    assert "RA-7611" not in codes, "the rejected Palawan framework link came back"
    assert "RA-10654" in codes

    primary = [law for law in laws if law["is_primary"]]
    assert len(primary) == 1
    assert primary[0]["code"] == "RA-10654"
    assert primary[0]["review_status"] == "verified"

    secondary = [law for law in laws if not law["is_primary"]]
    assert [law["code"] for law in secondary] == ["PD-705"]
    assert secondary[0]["review_status"] == "pending"


def test_coral_damage_uses_fisheries_code():
    import graph_store

    laws = _run(graph_store.laws_for_hazard("CORAL-REEF-DAMAGE"))

    assert [law["code"] for law in laws] == ["RA-10654"]


def test_every_link_has_provenance():
    import graph_store

    async def fetch():
        async with graph_store.AsyncSessionLocal() as session:
            result = await session.execute(
                text(
                    "select v.code, l.law_code, k.source, k.citation_url, k.review_status "
                    "from public.violation_law_links k "
                    "join public.violation_types v on v.id = k.violation_type_id "
                    "join public.environmental_laws_ph l on l.id = k.law_id"
                )
            )
            return [dict(row) for row in result.mappings().all()]

    rows = _run(fetch())
    assert rows, "no links found"

    for row in rows:
        assert row["source"], row
        assert row["review_status"] in ("verified", "pending"), row
        # A link must be traceable. `pending` still needs a citation, otherwise
        # a reviewer has nothing to check.
        assert row["citation_url"], row


def test_legacy_single_fk_agrees_with_the_primary_link():
    """`violation_types.law_id` is kept in step so both read paths agree."""
    import graph_store

    async def fetch():
        async with graph_store.AsyncSessionLocal() as session:
            result = await session.execute(
                text(
                    """
                    select v.code, legacy.law_code as legacy_code, primary_link.law_code as link_code
                    from public.violation_types v
                    left join public.environmental_laws_ph legacy on legacy.id = v.law_id
                    left join lateral (
                      select l.law_code
                      from public.violation_law_links k
                      join public.environmental_laws_ph l on l.id = k.law_id
                      where k.violation_type_id = v.id and k.is_primary
                      limit 1
                    ) primary_link on true
                    """
                )
            )
            return [dict(row) for row in result.mappings().all()]

    rows = _run(fetch())
    mismatched = [
        row
        for row in rows
        if row["legacy_code"] is not None
        and row["link_code"] is not None
        and row["legacy_code"] != row["link_code"]
    ]
    assert not mismatched, mismatched


def test_knowledge_for_hazard_is_relational():
    import graph_store

    result = _run(graph_store.knowledge_for_hazard("HAZWASTE-HANDLING"))

    assert result["method"] == "relational"
    assert [law["code"] for law in result["laws"]] == ["RA-6969"]
    assert result["name"]


def test_unknown_hazard_returns_empty_not_an_error():
    import graph_store

    laws = _run(graph_store.laws_for_hazard("NOT-A-REAL-CODE"))
    assert laws == []

    result = _run(graph_store.knowledge_for_hazard("NOT-A-REAL-CODE"))
    assert result["method"] == "none"
    assert result["laws"] == []


def test_agencies_are_scoped_by_location():
    import graph_store

    nationwide = _run(graph_store.agencies_for_hazard("SWM-ILLEGAL-DUMPING"))
    assert nationwide, "expected agencies for a mapped focus area"
    assert all(a["focus_area"] == "Solid Waste" for a in nationwide)

    manila = _run(graph_store.agencies_for_hazard("SWM-ILLEGAL-DUMPING", location="Manila"))
    # A location filter must not invent agencies outside that location.
    for agency in manila:
        haystack = " ".join(
            filter(
                None,
                [agency.get("city_municipality"), agency.get("province"), agency.get("region")],
            )
        ).lower()
        assert "manila" in haystack, agency


def test_all_active_laws_are_embedded():
    import graph_store

    embedded = _run(graph_store.count_embedded_laws())
    assert embedded >= 16


def _citation_for(violation_code: str) -> str:
    import graph_store

    async def fetch():
        async with graph_store.AsyncSessionLocal() as session:
            result = await session.execute(
                text(
                    "select k.citation from public.violation_law_links k "
                    "join public.violation_types v on v.id = k.violation_type_id "
                    "where v.code = :code"
                ),
                {"code": violation_code},
            )
            return [row[0] or "" for row in result.all()]

    return " | ".join(_run(fetch()))


def test_dumping_uses_the_open_dumping_tier_not_littering():
    """A legal review found the first mapping pointed at the littering tier.

    RA 9003 §48(1)/§49(a) is littering (P300-1,000 or community service). Open
    dumping is §48(9)/§49(d): P500,000 plus 5-10% of net annual income. Citing
    the wrong tier understates the offence by three orders of magnitude.
    """
    citation = _citation_for("SWM-ILLEGAL-DUMPING")

    assert "48(9)" in citation, citation
    assert "49(d)" in citation, citation
    assert "48(1)" not in citation, f"littering tier came back: {citation}"


def test_hazardous_waste_cites_the_criminal_penalty():
    """§15 is administrative fines only; §14(b) carries the criminal penalty."""
    citation = _citation_for("HAZWASTE-HANDLING")

    assert "13(d)" in citation, citation
    assert "14(b)" in citation, citation


def test_protected_area_mapping_is_marked_medium_confidence():
    """Occupancy (§20(n)) and construction (§20(o)) carry different penalties."""
    import graph_store

    async def fetch():
        async with graph_store.AsyncSessionLocal() as session:
            result = await session.execute(
                text(
                    "select k.confidence from public.violation_law_links k "
                    "join public.violation_types v on v.id = k.violation_type_id "
                    "where v.code = 'PROTECTED-AREA-INTRUSION'"
                )
            )
            return [row[0] for row in result.all()]

    assert _run(fetch()) == ["medium"]
