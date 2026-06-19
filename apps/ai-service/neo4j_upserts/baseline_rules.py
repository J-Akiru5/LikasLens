"""
Baseline rule upserts for Neo4j.
Seeds the graph with Philippine environmental laws, violation types,
hazard types, locations (Iloilo proof of concept), and their relationships
for the neuro-symbolic routing pipeline.

Replaces the former Cosmos DB Gremlin baseline_rules.py.
"""

from __future__ import annotations

from typing import Any

from neo4j_bootstrap import build_edge_merge_query, build_vertex_merge_query

# ---------------------------------------------------------------------------
# Philippine Environmental Laws (all 16)
# ---------------------------------------------------------------------------

BASELINE_LAWS: list[dict[str, Any]] = [
    {
        "code": "RA-9729",
        "title": "Climate Change Act of 2009",
        "issuing_agency": "Climate Change Commission",
        "jurisdictionCode": "PH-NATIONAL",
    },
    {
        "code": "RA-10121",
        "title": "Disaster Risk Reduction and Management Act of 2010",
        "issuing_agency": "NDRRMC",
        "jurisdictionCode": "PH-NATIONAL",
    },
    {
        "code": "RA-9003",
        "title": "Ecological Solid Waste Management Act of 2000",
        "issuing_agency": "NSWMC",
        "jurisdictionCode": "PH-NATIONAL",
    },
    {
        "code": "RA-8749",
        "title": "Philippine Clean Air Act of 1999",
        "issuing_agency": "DENR-EMB",
        "jurisdictionCode": "PH-NATIONAL",
    },
    {
        "code": "RA-9275",
        "title": "Philippine Clean Water Act of 2004",
        "issuing_agency": "DENR-EMB",
        "jurisdictionCode": "PH-NATIONAL",
    },
    {
        "code": "RA-6969",
        "title": "Toxic Substances and Hazardous Wastes Control Act",
        "issuing_agency": "DENR-EMB",
        "jurisdictionCode": "PH-NATIONAL",
    },
    {
        "code": "PD-1586",
        "title": "Environmental Impact Statement System",
        "issuing_agency": "DENR",
        "jurisdictionCode": "PH-NATIONAL",
    },
    {
        "code": "PD-1151",
        "title": "Philippine Environmental Policy",
        "issuing_agency": "DENR",
        "jurisdictionCode": "PH-NATIONAL",
    },
    {
        "code": "PD-979",
        "title": "Marine Pollution Decree of 1976",
        "issuing_agency": "Philippine Coast Guard",
        "jurisdictionCode": "PH-NATIONAL",
    },
    {
        "code": "PD-1067",
        "title": "Water Code of the Philippines",
        "issuing_agency": "NWRB",
        "jurisdictionCode": "PH-NATIONAL",
    },
    {
        "code": "PD-856",
        "title": "Code on Sanitation",
        "issuing_agency": "DOH",
        "jurisdictionCode": "PH-NATIONAL",
    },
    {
        "code": "RA-7611",
        "title": "Strategic Environmental Plan for Palawan",
        "issuing_agency": "PCSD",
        "jurisdictionCode": "PH-NATIONAL",
    },
    {
        "code": "AM-09-6-8-SC",
        "title": "Rules of Procedure for Environmental Cases (Writ of Kalikasan)",
        "issuing_agency": "Supreme Court",
        "jurisdictionCode": "PH-NATIONAL",
    },
    {
        "code": "PD-705",
        "title": "Revised Forestry Code of the Philippines",
        "issuing_agency": "DENR",
        "jurisdictionCode": "PH-NATIONAL",
    },
    {
        "code": "RA-9147",
        "title": "Wildlife Resources Conservation and Protection Act",
        "issuing_agency": "DENR",
        "jurisdictionCode": "PH-NATIONAL",
    },
    {
        "code": "RA-7586",
        "title": "National Integrated Protected Areas System Act (NIPAS)",
        "issuing_agency": "DENR",
        "jurisdictionCode": "PH-NATIONAL",
    },
]

# ---------------------------------------------------------------------------
# Enforcement Agencies (NGOs)
# ---------------------------------------------------------------------------

BASELINE_AGENCIES: list[dict[str, Any]] = [
    {
        "id": "ngo-green-dingle-initiative",
        "name": "Green Dingle Initiative",
        "focus": "solid-waste",
        "country": "PH",
        "region": "Western Visayas",
    },
    {
        "id": "ngo-bantay-kalikasan",
        "name": "Bantay Kalikasan",
        "focus": "environmental-protection",
        "country": "PH",
        "region": "National",
    },
    {
        "id": "ngo-coastal-guardians-ph",
        "name": "Coastal Guardians PH",
        "focus": "marine-protection",
        "country": "PH",
        "region": "Western Visayas",
    },
    {
        "id": "ngo-forest-watch-negros",
        "name": "Forest Watch Negros",
        "focus": "forestry",
        "country": "PH",
        "region": "Negros Occidental",
    },
    {
        "id": "ngo-panay-eco-warriors",
        "name": "Panay Eco Warriors",
        "focus": "wildlife-protection",
        "country": "PH",
        "region": "Western Visayas",
    },
]

# ---------------------------------------------------------------------------
# Violation Types (11)
# ---------------------------------------------------------------------------

BASELINE_VIOLATIONS: list[dict[str, Any]] = [
    {"code": "SWM-ILLEGAL-DUMPING", "name": "Illegal Dumping of Solid Waste"},
    {"code": "AIR-EMISSION-VIOLATION", "name": "Air Emission Violation"},
    {"code": "WATER-UNAUTHORIZED-DISCHARGE", "name": "Unauthorized Wastewater Discharge"},
    {"code": "HAZWASTE-HANDLING", "name": "Hazardous Waste Handling Violation"},
    {"code": "ILLEGAL-LOGGING", "name": "Illegal Logging / Deforestation"},
    {"code": "WILDLIFE-TRAFFICKING", "name": "Wildlife Trafficking"},
    {"code": "MARINE-POLLUTION", "name": "Marine Pollution"},
    {"code": "OPEN-BURNING", "name": "Open Burning"},
    {"code": "MANGROVE-DESTRUCTION", "name": "Mangrove Clearing"},
    {"code": "CORAL-REEF-DAMAGE", "name": "Coral Reef Destruction"},
    {"code": "PROTECTED-AREA-INTRUSION", "name": "Protected Area Violation"},
]

# ---------------------------------------------------------------------------
# Hazard Types (18 — what YOLOv8 can detect)
# ---------------------------------------------------------------------------

BASELINE_HAZARDS: list[dict[str, Any]] = [
    {"code": "illegal_logging", "name": "Illegal Logging"},
    {"code": "open_burning", "name": "Open Burning"},
    {"code": "mangrove_clearing", "name": "Mangrove Clearing"},
    {"code": "oil_spill", "name": "Oil Spill"},
    {"code": "wildlife_trafficking", "name": "Wildlife Trafficking"},
    {"code": "coral_reef_damage", "name": "Coral Reef Damage"},
    {"code": "illegal_dumping", "name": "Illegal Dumping"},
    {"code": "chemical_spill", "name": "Chemical Spill"},
    {"code": "sand_mining", "name": "Sand Mining"},
    {"code": "water_pollution", "name": "Water Pollution"},
    {"code": "air_pollution", "name": "Air Pollution"},
    {"code": "coastal_erosion", "name": "Coastal Erosion"},
    {"code": "peatland_fire", "name": "Peatland Fire"},
    {"code": "transboundary_haze", "name": "Transboundary Haze"},
    {"code": "rubber_plantation_encroachment", "name": "Rubber Plantation Encroachment"},
    {"code": "hydropower_displacement", "name": "Hydropower Displacement"},
    {"code": "sand_dredging", "name": "Sand Dredging"},
    {"code": "mangrove_conversion_aquaculture", "name": "Mangrove to Aquaculture Conversion"},
]

# ---------------------------------------------------------------------------
# Locations (Iloilo proof of concept)
# ---------------------------------------------------------------------------

BASELINE_LOCATIONS: list[dict[str, Any]] = [
    {
        "name": "Iloilo City",
        "region": "Western Visayas",
        "country": "PH",
        "description": "Highly urbanized city in Western Visayas, Philippines",
    },
    {
        "name": "Iloilo Province",
        "region": "Western Visayas",
        "country": "PH",
        "description": "Province surrounding Iloilo City in Western Visayas",
    },
    {
        "name": "Western Visayas",
        "region": "Region VI",
        "country": "PH",
        "description": "Administrative region in the Philippines (Region VI)",
    },
]

# ---------------------------------------------------------------------------
# Edges: Location -[:GOVERNED_BY]-> Law
# Iloilo is governed by all 16 national PH laws
# ---------------------------------------------------------------------------

LOCATION_LAW_EDGES: list[tuple[str, str]] = [
    ("Iloilo City", "RA-9729"),
    ("Iloilo City", "RA-10121"),
    ("Iloilo City", "RA-9003"),
    ("Iloilo City", "RA-8749"),
    ("Iloilo City", "RA-9275"),
    ("Iloilo City", "RA-6969"),
    ("Iloilo City", "PD-1586"),
    ("Iloilo City", "PD-1151"),
    ("Iloilo City", "PD-979"),
    ("Iloilo City", "PD-1067"),
    ("Iloilo City", "PD-856"),
    ("Iloilo City", "RA-7611"),
    ("Iloilo City", "AM-09-6-8-SC"),
    ("Iloilo City", "PD-705"),
    ("Iloilo City", "RA-9147"),
    ("Iloilo City", "RA-7586"),
    ("Iloilo Province", "RA-9729"),
    ("Iloilo Province", "RA-10121"),
    ("Iloilo Province", "RA-9003"),
    ("Iloilo Province", "RA-8749"),
    ("Iloilo Province", "RA-9275"),
    ("Iloilo Province", "RA-6969"),
    ("Iloilo Province", "PD-1586"),
    ("Iloilo Province", "PD-1151"),
    ("Iloilo Province", "PD-979"),
    ("Iloilo Province", "PD-1067"),
    ("Iloilo Province", "PD-856"),
    ("Iloilo Province", "RA-7611"),
    ("Iloilo Province", "AM-09-6-8-SC"),
    ("Iloilo Province", "PD-705"),
    ("Iloilo Province", "RA-9147"),
    ("Iloilo Province", "RA-7586"),
]

# ---------------------------------------------------------------------------
# Edges: HazardType -[:VIOLATES]-> Law
# ---------------------------------------------------------------------------

HAZARD_LAW_EDGES: list[tuple[str, str]] = [
    ("illegal_logging", "PD-705"),
    ("open_burning", "RA-8749"),
    ("mangrove_clearing", "RA-7611"),
    ("oil_spill", "PD-979"),
    ("wildlife_trafficking", "RA-9147"),
    ("coral_reef_damage", "RA-9147"),
    ("illegal_dumping", "RA-9003"),
    ("chemical_spill", "RA-6969"),
    ("sand_mining", "PD-1067"),
    ("water_pollution", "RA-9275"),
    ("air_pollution", "RA-8749"),
    ("coastal_erosion", "RA-9275"),
    ("peatland_fire", "RA-8749"),
    ("transboundary_haze", "RA-8749"),
    ("rubber_plantation_encroachment", "PD-705"),
    ("hydropower_displacement", "PD-1586"),
    ("sand_dredging", "PD-1067"),
    ("mangrove_conversion_aquaculture", "RA-7611"),
]

# ---------------------------------------------------------------------------
# Edges: Law -[:ENFORCED_BY]-> Agency
# ---------------------------------------------------------------------------

LAW_AGENCY_EDGES: list[tuple[str, str]] = [
    ("RA-9003", "ngo-green-dingle-initiative"),
    ("RA-8749", "ngo-bantay-kalikasan"),
    ("RA-9275", "ngo-coastal-guardians-ph"),
    ("PD-705", "ngo-forest-watch-negros"),
    ("RA-9147", "ngo-panay-eco-warriors"),
    ("RA-7611", "ngo-coastal-guardians-ph"),
    ("PD-979", "ngo-coastal-guardians-ph"),
    ("RA-6969", "ngo-bantay-kalikasan"),
    ("RA-9729", "ngo-bantay-kalikasan"),
    ("RA-10121", "ngo-bantay-kalikasan"),
]

# ---------------------------------------------------------------------------
# Edges: HazardType -[:CLASSIFIED_AS]-> ViolationType
# ---------------------------------------------------------------------------

HAZARD_VIOLATION_EDGES: list[tuple[str, str]] = [
    ("illegal_dumping", "SWM-ILLEGAL-DUMPING"),
    ("air_pollution", "AIR-EMISSION-VIOLATION"),
    ("open_burning", "AIR-EMISSION-VIOLATION"),
    ("water_pollution", "WATER-UNAUTHORIZED-DISCHARGE"),
    ("chemical_spill", "HAZWASTE-HANDLING"),
    ("illegal_logging", "ILLEGAL-LOGGING"),
    ("wildlife_trafficking", "WILDLIFE-TRAFFICKING"),
    ("oil_spill", "MARINE-POLLUTION"),
    ("open_burning", "OPEN-BURNING"),
    ("mangrove_clearing", "MANGROVE-DESTRUCTION"),
    ("coral_reef_damage", "CORAL-REEF-DAMAGE"),
    ("illegal_logging", "PROTECTED-AREA-INTRUSION"),
]


# ---------------------------------------------------------------------------
# Build vertex definitions
# ---------------------------------------------------------------------------

def _build_vertices() -> list[dict[str, Any]]:
    """Build all vertex definitions for Neo4j MERGE upserts."""
    vertices: list[dict[str, Any]] = []

    # Laws (matched by code)
    for law in BASELINE_LAWS:
        vertices.append({
            "label": "Law",
            "match": {"code": law["code"]},
            "props": {
                "title": law["title"],
                "issuing_agency": law.get("issuing_agency", ""),
                "jurisdictionCode": law["jurisdictionCode"],
            },
        })

    # Agencies (matched by id)
    for ngo in BASELINE_AGENCIES:
        vertices.append({
            "label": "Agency",
            "match": {"id": ngo["id"]},
            "props": {
                "name": ngo["name"],
                "focus": ngo["focus"],
                "country": ngo["country"],
                "region": ngo.get("region", ""),
            },
        })

    # Violation Types (matched by code)
    for violation in BASELINE_VIOLATIONS:
        vertices.append({
            "label": "ViolationType",
            "match": {"code": violation["code"]},
            "props": {
                "name": violation["name"],
            },
        })

    # Hazard Types (matched by code)
    for hazard in BASELINE_HAZARDS:
        vertices.append({
            "label": "HazardType",
            "match": {"code": hazard["code"]},
            "props": {
                "name": hazard["name"],
            },
        })

    # Locations (matched by name)
    for location in BASELINE_LOCATIONS:
        vertices.append({
            "label": "Location",
            "match": {"name": location["name"]},
            "props": {
                "region": location["region"],
                "country": location["country"],
                "description": location["description"],
            },
        })

    return vertices


# ---------------------------------------------------------------------------
# Build edge definitions
# ---------------------------------------------------------------------------

def _build_edges() -> list[dict[str, Any]]:
    """Build all edge definitions for Neo4j MERGE upserts."""
    edges: list[dict[str, Any]] = []

    # Location -[:GOVERNED_BY]-> Law
    for location_name, law_code in LOCATION_LAW_EDGES:
        edges.append({
            "from_label": "Location",
            "from_match": {"name": location_name},
            "to_label": "Law",
            "to_match": {"code": law_code},
            "label": "GOVERNED_BY",
            "props": {},
        })

    # HazardType -[:VIOLATES]-> Law
    for hazard_code, law_code in HAZARD_LAW_EDGES:
        edges.append({
            "from_label": "HazardType",
            "from_match": {"code": hazard_code},
            "to_label": "Law",
            "to_match": {"code": law_code},
            "label": "VIOLATES",
            "props": {"confidence": 1.0, "source": "philippine-law"},
        })

    # Law -[:ENFORCED_BY]-> Agency
    for law_code, agency_id in LAW_AGENCY_EDGES:
        edges.append({
            "from_label": "Law",
            "from_match": {"code": law_code},
            "to_label": "Agency",
            "to_match": {"id": agency_id},
            "label": "ENFORCED_BY",
            "props": {"source": "migration"},
        })

    # HazardType -[:CLASSIFIED_AS]-> ViolationType
    for hazard_code, violation_code in HAZARD_VIOLATION_EDGES:
        edges.append({
            "from_label": "HazardType",
            "from_match": {"code": hazard_code},
            "to_label": "ViolationType",
            "to_match": {"code": violation_code},
            "label": "CLASSIFIED_AS",
            "props": {"source": "migration"},
        })

    return edges


def get_all_vertex_queries() -> list[dict[str, Any]]:
    """Return all vertex MERGE queries with parameters."""
    from neo4j_bootstrap import build_vertex_merge_query

    queries = []
    for v in _build_vertices():
        params = {**v["match"], **(v.get("props") or {})}
        queries.append({
            "description": f"Merge {v['label']}: {v['match']}",
            "query": build_vertex_merge_query(v["label"], v["match"], v.get("props")),
            "params": params,
        })
    return queries


def get_all_edge_queries() -> list[dict[str, Any]]:
    """Return all edge MERGE queries with parameters."""
    from neo4j_bootstrap import build_edge_merge_query

    queries = []
    for e in _build_edges():
        params = {
            **{f"from_{k}": v for k, v in e["from_match"].items()},
            **{f"to_{k}": v for k, v in e["to_match"].items()},
            **{f"edge_{k}": v for k, v in (e.get("props") or {}).items()},
        }
        queries.append({
            "description": f"Merge {e['from_label']} -[:{e['label']}]-> {e['to_label']}",
            "query": build_edge_merge_query(
                e["from_label"], e["from_match"],
                e["to_label"], e["to_match"],
                e["label"], e.get("props"),
            ),
            "params": params,
        })
    return queries


def build_all_bootstrap_queries() -> dict[str, list[dict[str, Any]]]:
    """Return all bootstrap queries (vertices + edges)."""
    return {
        "vertices": get_all_vertex_queries(),
        "edges": get_all_edge_queries(),
    }
