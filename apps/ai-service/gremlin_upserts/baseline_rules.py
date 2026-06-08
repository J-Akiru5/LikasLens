"""
Baseline rule upserts for Cosmos DB Gremlin.
Seeds the graph with Philippine environmental laws, violation types,
hazard types, and their relationships for the neuro-symbolic routing pipeline.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from gremlin_bootstrap import build_edge_upsert_query, build_vertex_upsert_query

# ---------------------------------------------------------------------------
# Philippine Environmental Laws (all 16)
# ---------------------------------------------------------------------------

BASELINE_LAWS: list[dict[str, Any]] = [
    {
        "id": "law-ra-9729",
        "code": "RA-9729",
        "title": "Climate Change Act of 2009",
        "issuing_agency": "Climate Change Commission",
        "jurisdictionCode": "PH-NATIONAL",
        "status": "active",
    },
    {
        "id": "law-ra-10121",
        "code": "RA-10121",
        "title": "Disaster Risk Reduction and Management Act of 2010",
        "issuing_agency": "NDRRMC",
        "jurisdictionCode": "PH-NATIONAL",
        "status": "active",
    },
    {
        "id": "law-ra-9003",
        "code": "RA-9003",
        "title": "Ecological Solid Waste Management Act of 2000",
        "issuing_agency": "NSWMC",
        "jurisdictionCode": "PH-NATIONAL",
        "status": "active",
    },
    {
        "id": "law-ra-8749",
        "code": "RA-8749",
        "title": "Philippine Clean Air Act of 1999",
        "issuing_agency": "DENR-EMB",
        "jurisdictionCode": "PH-NATIONAL",
        "status": "active",
    },
    {
        "id": "law-ra-9275",
        "code": "RA-9275",
        "title": "Philippine Clean Water Act of 2004",
        "issuing_agency": "DENR-EMB",
        "jurisdictionCode": "PH-NATIONAL",
        "status": "active",
    },
    {
        "id": "law-ra-6969",
        "code": "RA-6969",
        "title": "Toxic Substances and Hazardous Wastes Control Act",
        "issuing_agency": "DENR-EMB",
        "jurisdictionCode": "PH-NATIONAL",
        "status": "active",
    },
    {
        "id": "law-pd-1586",
        "code": "PD-1586",
        "title": "Environmental Impact Statement System",
        "issuing_agency": "DENR",
        "jurisdictionCode": "PH-NATIONAL",
        "status": "active",
    },
    {
        "id": "law-pd-1151",
        "code": "PD-1151",
        "title": "Philippine Environmental Policy",
        "issuing_agency": "DENR",
        "jurisdictionCode": "PH-NATIONAL",
        "status": "active",
    },
    {
        "id": "law-pd-979",
        "code": "PD-979",
        "title": "Marine Pollution Decree of 1976",
        "issuing_agency": "Philippine Coast Guard",
        "jurisdictionCode": "PH-NATIONAL",
        "status": "active",
    },
    {
        "id": "law-pd-1067",
        "code": "PD-1067",
        "title": "Water Code of the Philippines",
        "issuing_agency": "NWRB",
        "jurisdictionCode": "PH-NATIONAL",
        "status": "active",
    },
    {
        "id": "law-pd-856",
        "code": "PD-856",
        "title": "Code on Sanitation",
        "issuing_agency": "DOH",
        "jurisdictionCode": "PH-NATIONAL",
        "status": "active",
    },
    {
        "id": "law-ra-7611",
        "code": "RA-7611",
        "title": "Strategic Environmental Plan for Palawan",
        "issuing_agency": "PCSD",
        "jurisdictionCode": "PH-NATIONAL",
        "status": "active",
    },
    {
        "id": "law-am-09-6-8-sc",
        "code": "AM-09-6-8-SC",
        "title": "Rules of Procedure for Environmental Cases (Writ of Kalikasan)",
        "issuing_agency": "Supreme Court",
        "jurisdictionCode": "PH-NATIONAL",
        "status": "active",
    },
    {
        "id": "law-pd-705",
        "code": "PD-705",
        "title": "Revised Forestry Code of the Philippines",
        "issuing_agency": "DENR",
        "jurisdictionCode": "PH-NATIONAL",
        "status": "active",
    },
    {
        "id": "law-ra-9147",
        "code": "RA-9147",
        "title": "Wildlife Resources Conservation and Protection Act",
        "issuing_agency": "DENR",
        "jurisdictionCode": "PH-NATIONAL",
        "status": "active",
    },
    {
        "id": "law-ra-7586",
        "code": "RA-7586",
        "title": "National Integrated Protected Areas System Act (NIPAS)",
        "issuing_agency": "DENR",
        "jurisdictionCode": "PH-NATIONAL",
        "status": "active",
    },
]

# ---------------------------------------------------------------------------
# NGOs (expanded with focus areas matching violation types)
# ---------------------------------------------------------------------------

BASELINE_NGOS: list[dict[str, Any]] = [
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
# Jurisdictions
# ---------------------------------------------------------------------------

BASELINE_JURISDICTIONS: list[dict[str, Any]] = [
    {
        "id": "jur-ph-national",
        "code": "PH-NATIONAL",
        "name": "Philippines (National)",
        "level": "national",
        "country": "PH",
    },
    {
        "id": "jur-ph-negros-occidental",
        "code": "PH-NGOCC",
        "name": "Negros Occidental",
        "level": "province",
        "country": "PH",
    },
    {
        "id": "jur-ph-western-visayas",
        "code": "PH-RVI",
        "name": "Western Visayas (Region VI)",
        "level": "region",
        "country": "PH",
    },
    # ASEAN jurisdictions (placeholder for regional expansion)
    {
        "id": "jur-id-national",
        "code": "ID-NATIONAL",
        "name": "Indonesia (National)",
        "level": "national",
        "country": "ID",
    },
    {
        "id": "jur-th-national",
        "code": "TH-NATIONAL",
        "name": "Thailand (National)",
        "level": "national",
        "country": "TH",
    },
    {
        "id": "jur-vn-national",
        "code": "VN-NATIONAL",
        "name": "Vietnam (National)",
        "level": "national",
        "country": "VN",
    },
    {
        "id": "jur-my-national",
        "code": "MY-NATIONAL",
        "name": "Malaysia (National)",
        "level": "national",
        "country": "MY",
    },
    {
        "id": "jur-sg-national",
        "code": "SG-NATIONAL",
        "name": "Singapore (National)",
        "level": "national",
        "country": "SG",
    },
]

# ---------------------------------------------------------------------------
# Violation Types (11 total: 4 existing + 7 new)
# ---------------------------------------------------------------------------

BASELINE_VIOLATIONS: list[dict[str, Any]] = [
    # Existing (from backend seeder)
    {"id": "SWM-ILLEGAL-DUMPING", "code": "SWM-ILLEGAL-DUMPING", "name": "Illegal Dumping of Solid Waste"},
    {"id": "AIR-EMISSION-VIOLATION", "code": "AIR-EMISSION-VIOLATION", "name": "Air Emission Violation"},
    {"id": "WATER-UNAUTHORIZED-DISCHARGE", "code": "WATER-UNAUTHORIZED-DISCHARGE", "name": "Unauthorized Wastewater Discharge"},
    {"id": "HAZWASTE-HANDLING", "code": "HAZWASTE-HANDLING", "name": "Hazardous Waste Handling Violation"},
    # New violation types
    {"id": "ILLEGAL-LOGGING", "code": "ILLEGAL-LOGGING", "name": "Illegal Logging / Deforestation"},
    {"id": "WILDLIFE-TRAFFICKING", "code": "WILDLIFE-TRAFFICKING", "name": "Wildlife Trafficking"},
    {"id": "MARINE-POLLUTION", "code": "MARINE-POLLUTION", "name": "Marine Pollution"},
    {"id": "OPEN-BURNING", "code": "OPEN-BURNING", "name": "Open Burning"},
    {"id": "MANGROVE-DESTRUCTION", "code": "MANGROVE-DESTRUCTION", "name": "Mangrove Clearing"},
    {"id": "CORAL-REEF-DAMAGE", "code": "CORAL-REEF-DAMAGE", "name": "Coral Reef Destruction"},
    {"id": "PROTECTED-AREA-INTRUSION", "code": "PROTECTED-AREA-INTRUSION", "name": "Protected Area Violation"},
]

# ---------------------------------------------------------------------------
# Hazard Types (what YOLOv8 / citizen reports can identify)
# ---------------------------------------------------------------------------

BASELINE_HAZARDS: list[dict[str, Any]] = [
    # PH hazards
    {"id": "illegal_logging", "name": "Illegal Logging", "region": "PH"},
    {"id": "open_burning", "name": "Open Burning", "region": "PH"},
    {"id": "mangrove_clearing", "name": "Mangrove Clearing", "region": "PH"},
    {"id": "oil_spill", "name": "Oil Spill", "region": "PH"},
    {"id": "wildlife_trafficking", "name": "Wildlife Trafficking", "region": "PH"},
    {"id": "coral_reef_damage", "name": "Coral Reef Damage", "region": "PH"},
    {"id": "illegal_dumping", "name": "Illegal Dumping", "region": "PH"},
    {"id": "chemical_spill", "name": "Chemical Spill", "region": "PH"},
    {"id": "sand_mining", "name": "Sand Mining", "region": "PH"},
    {"id": "water_pollution", "name": "Water Pollution", "region": "PH"},
    {"id": "air_pollution", "name": "Air Pollution", "region": "PH"},
    {"id": "coastal_erosion", "name": "Coastal Erosion", "region": "PH"},
    # ASEAN-specific hazards
    {"id": "peatland_fire", "name": "Peatland Fire", "region": "ID, MY"},
    {"id": "transboundary_haze", "name": "Transboundary Haze", "region": "ID, MY, SG"},
    {"id": "rubber_plantation_encroachment", "name": "Rubber Plantation Encroachment", "region": "TH, KH"},
    {"id": "hydropower_displacement", "name": "Hydropower Displacement", "region": "LA, VN"},
    {"id": "sand_dredging", "name": "Sand Dredging", "region": "KH, VN"},
    {"id": "mangrove_conversion_aquaculture", "name": "Mangrove to Aquaculture Conversion", "region": "VN, TH"},
]

# ---------------------------------------------------------------------------
# Edges: HazardType -> violates -> Law
# ---------------------------------------------------------------------------

HAZARD_LAW_EDGES: list[tuple[str, str]] = [
    # PH hazards -> PH laws
    ("illegal_logging", "law-pd-705"),
    ("open_burning", "law-ra-8749"),
    ("mangrove_clearing", "law-ra-7611"),
    ("oil_spill", "law-pd-979"),
    ("wildlife_trafficking", "law-ra-9147"),
    ("coral_reef_damage", "law-ra-9147"),
    ("illegal_dumping", "law-ra-9003"),
    ("chemical_spill", "law-ra-6969"),
    ("sand_mining", "law-pd-1067"),
    ("water_pollution", "law-ra-9275"),
    ("air_pollution", "law-ra-8749"),
    ("coastal_erosion", "law-ra-9275"),
    # ASEAN hazards -> closest PH law equivalent
    ("peatland_fire", "law-ra-8749"),
    ("transboundary_haze", "law-ra-8749"),
    ("rubber_plantation_encroachment", "law-pd-705"),
    ("hydropower_displacement", "law-pd-1586"),
    ("sand_dredging", "law-pd-1067"),
    ("mangrove_conversion_aquaculture", "law-ra-7611"),
]

# ---------------------------------------------------------------------------
# Edges: Law -> enforced_by -> NGO (using NGO focus areas)
# ---------------------------------------------------------------------------

LAW_NGO_EDGES: list[tuple[str, str]] = [
    ("law-ra-9003", "ngo-green-dingle-initiative"),
    ("law-ra-8749", "ngo-bantay-kalikasan"),
    ("law-ra-9275", "ngo-coastal-guardians-ph"),
    ("law-pd-705", "ngo-forest-watch-negros"),
    ("law-ra-9147", "ngo-panay-eco-warriors"),
    ("law-ra-7611", "ngo-coastal-guardians-ph"),
    ("law-pd-979", "ngo-coastal-guardians-ph"),
    ("law-ra-6969", "ngo-bantay-kalikasan"),
    ("law-ra-9729", "ngo-bantay-kalikasan"),
    ("law-ra-10121", "ngo-bantay-kalikasan"),
]

# ---------------------------------------------------------------------------
# Edges: ViolationType -> classified_from -> HazardType
# ---------------------------------------------------------------------------

VIOLATION_HAZARD_EDGES: list[tuple[str, str]] = [
    ("SWM-ILLEGAL-DUMPING", "illegal_dumping"),
    ("AIR-EMISSION-VIOLATION", "air_pollution"),
    ("AIR-EMISSION-VIOLATION", "open_burning"),
    ("WATER-UNAUTHORIZED-DISCHARGE", "water_pollution"),
    ("HAZWASTE-HANDLING", "chemical_spill"),
    ("ILLEGAL-LOGGING", "illegal_logging"),
    ("WILDLIFE-TRAFFICKING", "wildlife_trafficking"),
    ("MARINE-POLLUTION", "oil_spill"),
    ("OPEN-BURNING", "open_burning"),
    ("MANGROVE-DESTRUCTION", "mangrove_clearing"),
    ("CORAL-REEF-DAMAGE", "coral_reef_damage"),
    ("PROTECTED-AREA-INTRUSION", "illegal_logging"),
]


def _build_vertices() -> list[dict[str, Any]]:
    """Build all vertex definitions for upsert."""
    now = datetime.now(UTC).isoformat()
    vertices: list[dict[str, Any]] = []

    # Laws
    for law in BASELINE_LAWS:
        vertices.append({
            "id": law["id"],
            "label": "Law",
            "props": {
                "code": law["code"],
                "title": law["title"],
                "name": law["title"],  # name for traversal extraction
                "issuing_agency": law.get("issuing_agency", ""),
                "jurisdictionCode": law["jurisdictionCode"],
                "status": law["status"],
                "createdAt": now,
                "source": "migration",
                "isActive": True,
            },
        })

    # NGOs
    for ngo in BASELINE_NGOS:
        vertices.append({
            "id": ngo["id"],
            "label": "NGO",
            "props": {
                "name": ngo["name"],
                "focus": ngo["focus"],
                "country": ngo["country"],
                "region": ngo.get("region", ""),
                "createdAt": now,
                "source": "migration",
                "isActive": True,
            },
        })

    # Jurisdictions
    for jurisdiction in BASELINE_JURISDICTIONS:
        vertices.append({
            "id": jurisdiction["id"],
            "label": "Jurisdiction",
            "props": {
                "code": jurisdiction["code"],
                "name": jurisdiction["name"],
                "level": jurisdiction["level"],
                "country": jurisdiction["country"],
                "createdAt": now,
                "source": "migration",
                "isActive": True,
            },
        })

    # Violation Types
    for violation in BASELINE_VIOLATIONS:
        vertices.append({
            "id": violation["id"],
            "label": "ViolationType",
            "props": {
                "code": violation["code"],
                "name": violation["name"],
                "createdAt": now,
                "source": "migration",
                "isActive": True,
            },
        })

    # Hazard Types
    for hazard in BASELINE_HAZARDS:
        vertices.append({
            "id": hazard["id"],
            "label": "HazardType",
            "props": {
                "name": hazard["name"],
                "region": hazard.get("region", ""),
                "createdAt": now,
                "source": "migration",
                "isActive": True,
            },
        })

    return vertices


def _build_edge_definitions() -> list[dict[str, Any]]:
    """Build all edge definitions for upsert."""
    now = datetime.now(UTC).isoformat()
    edges: list[dict[str, Any]] = []

    # HazardType -> violates -> Law
    for hazard_id, law_id in HAZARD_LAW_EDGES:
        edges.append({
            "from": hazard_id,
            "to": law_id,
            "label": "violates",
            "props": {
                "confidence": 1.0,
                "source": "philippine-law",
                "createdAt": now,
            },
        })

    # Law -> enforced_by -> NGO
    for law_id, ngo_id in LAW_NGO_EDGES:
        edges.append({
            "from": law_id,
            "to": ngo_id,
            "label": "enforced_by",
            "props": {
                "source": "migration",
                "createdAt": now,
            },
        })

    # ViolationType -> classified_from -> HazardType
    for violation_id, hazard_id in VIOLATION_HAZARD_EDGES:
        edges.append({
            "from": violation_id,
            "to": hazard_id,
            "label": "classified_from",
            "props": {
                "source": "migration",
                "createdAt": now,
            },
        })

    return edges


def build_baseline_rule_queries() -> list[str]:
    """Build all vertex upsert queries."""
    vertices = _build_vertices()
    return [
        build_vertex_upsert_query(v["id"], v["label"], v.get("props", {}))
        for v in vertices
    ]


def build_baseline_edge_queries() -> list[str]:
    """Build all edge upsert queries (idempotent)."""
    edges = _build_edge_definitions()
    return [
        build_edge_upsert_query(e["from"], e["to"], e["label"], e.get("props", {}))
        for e in edges
    ]
