"""Pure-function tests for the Postgres knowledge store.

These do not touch a database: they pin the normalisation and relevance rules
that decide which rows the SQL looks for. The SQL itself is exercised against the
live database during seeding (see supabase/fix-pgvector-law-embeddings.sql).
"""

import pytest

from graph_store import (
    EDGE_LABELS,
    FOCUS_BY_HAZARD,
    VERTEX_LABELS,
    focus_for_hazard,
    jurisdiction_to_scope,
    normalize_hazard_code,
    topology,
)


@pytest.mark.parametrize(
    "raw, expected",
    [
        ("illegal_dumping", "ILLEGAL-DUMPING"),
        ("SWM-ILLEGAL-DUMPING", "SWM-ILLEGAL-DUMPING"),
        ("open-burning", "OPEN-BURNING"),
        ("  Coral_Reef_Damage  ", "CORAL-REEF-DAMAGE"),
        (None, ""),
        ("", ""),
    ],
)
def test_normalize_hazard_code(raw, expected):
    assert normalize_hazard_code(raw) == expected


def test_normalize_is_idempotent():
    once = normalize_hazard_code("illegal_logging")
    assert normalize_hazard_code(once) == once


@pytest.mark.parametrize(
    "jurisdiction, expected",
    [
        ("PH-NATIONAL", "national"),
        ("ID-NATIONAL", "national"),
        ("national", "national"),
        (None, None),
        ("", None),
    ],
)
def test_jurisdiction_to_scope(jurisdiction, expected):
    assert jurisdiction_to_scope(jurisdiction) == expected


def test_focus_accepts_legacy_and_modern_codes():
    assert focus_for_hazard("illegal_dumping") == focus_for_hazard("SWM-ILLEGAL-DUMPING")
    assert focus_for_hazard("SWM-ILLEGAL-DUMPING") == ("Solid Waste",)


def test_focus_is_empty_for_unknown_hazard():
    assert focus_for_hazard("something_new") == ()
    assert focus_for_hazard(None) == ()


def test_every_focus_value_is_a_real_focus_area():
    allowed = {
        "Reforestation",
        "Coastal Cleanup",
        "Solid Waste",
        "Wildlife Protection",
    }
    for code, focuses in FOCUS_BY_HAZARD.items():
        assert focuses, f"{code} maps to nothing"
        for focus in focuses:
            assert focus in allowed, f"{code} references unknown focus_area {focus}"


def test_topology_contract_is_stable():
    topo = topology()
    assert topo["vertex_labels"] == VERTEX_LABELS
    assert topo["edge_labels"] == EDGE_LABELS
    assert topo["backend"] == "postgres+pgvector"
    assert "Law" in topo["vertex_labels"]
    assert "VIOLATES" in topo["edge_labels"]


def test_no_neo4j_naming_leaks_into_the_contract():
    blob = repr(topology()).lower()
    assert "neo4j" not in blob
