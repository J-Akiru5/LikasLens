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
# Structured Law Reference Table
# Enriched view: each law paired with its mapped hazard types.
# Source of truth: BASELINE_LAWS × HAZARD_LAW_EDGES
# ---------------------------------------------------------------------------

LAW_REFERENCE: dict[str, dict[str, Any]] = {
    "RA-9729": {
        "code": "RA-9729",
        "title": "Climate Change Act of 2009",
        "issuing_agency": "Climate Change Commission",
        "jurisdictionCode": "PH-NATIONAL",
        "hazard_types": [],
    },
    "RA-10121": {
        "code": "RA-10121",
        "title": "Disaster Risk Reduction and Management Act of 2010",
        "issuing_agency": "NDRRMC",
        "jurisdictionCode": "PH-NATIONAL",
        "hazard_types": [],
    },
    "RA-9003": {
        "code": "RA-9003",
        "title": "Ecological Solid Waste Management Act of 2000",
        "issuing_agency": "NSWMC",
        "jurisdictionCode": "PH-NATIONAL",
        "hazard_types": ["illegal_dumping"],
    },
    "RA-8749": {
        "code": "RA-8749",
        "title": "Philippine Clean Air Act of 1999",
        "issuing_agency": "DENR-EMB",
        "jurisdictionCode": "PH-NATIONAL",
        "hazard_types": [
            "open_burning",
            "air_pollution",
            "peatland_fire",
            "transboundary_haze",
        ],
    },
    "RA-9275": {
        "code": "RA-9275",
        "title": "Philippine Clean Water Act of 2004",
        "issuing_agency": "DENR-EMB",
        "jurisdictionCode": "PH-NATIONAL",
        "hazard_types": ["water_pollution", "coastal_erosion"],
    },
    "RA-6969": {
        "code": "RA-6969",
        "title": "Toxic Substances and Hazardous Wastes Control Act",
        "issuing_agency": "DENR-EMB",
        "jurisdictionCode": "PH-NATIONAL",
        "hazard_types": ["chemical_spill"],
    },
    "PD-1586": {
        "code": "PD-1586",
        "title": "Environmental Impact Statement System",
        "issuing_agency": "DENR",
        "jurisdictionCode": "PH-NATIONAL",
        "hazard_types": ["hydropower_displacement"],
    },
    "PD-1151": {
        "code": "PD-1151",
        "title": "Philippine Environmental Policy",
        "issuing_agency": "DENR",
        "jurisdictionCode": "PH-NATIONAL",
        "hazard_types": [],
    },
    "PD-979": {
        "code": "PD-979",
        "title": "Marine Pollution Decree of 1976",
        "issuing_agency": "Philippine Coast Guard",
        "jurisdictionCode": "PH-NATIONAL",
        "hazard_types": ["oil_spill"],
    },
    "PD-1067": {
        "code": "PD-1067",
        "title": "Water Code of the Philippines",
        "issuing_agency": "NWRB",
        "jurisdictionCode": "PH-NATIONAL",
        "hazard_types": ["sand_mining", "sand_dredging"],
    },
    "PD-856": {
        "code": "PD-856",
        "title": "Code on Sanitation",
        "issuing_agency": "DOH",
        "jurisdictionCode": "PH-NATIONAL",
        "hazard_types": [],
    },
    "RA-7611": {
        "code": "RA-7611",
        "title": "Strategic Environmental Plan for Palawan",
        "issuing_agency": "PCSD",
        "jurisdictionCode": "PH-NATIONAL",
        "hazard_types": ["mangrove_clearing", "mangrove_conversion_aquaculture"],
    },
    "AM-09-6-8-SC": {
        "code": "AM-09-6-8-SC",
        "title": "Rules of Procedure for Environmental Cases (Writ of Kalikasan)",
        "issuing_agency": "Supreme Court",
        "jurisdictionCode": "PH-NATIONAL",
        "hazard_types": [],
    },
    "PD-705": {
        "code": "PD-705",
        "title": "Revised Forestry Code of the Philippines",
        "issuing_agency": "DENR",
        "jurisdictionCode": "PH-NATIONAL",
        "hazard_types": ["illegal_logging", "rubber_plantation_encroachment"],
    },
    "RA-9147": {
        "code": "RA-9147",
        "title": "Wildlife Resources Conservation and Protection Act",
        "issuing_agency": "DENR",
        "jurisdictionCode": "PH-NATIONAL",
        "hazard_types": ["wildlife_trafficking", "coral_reef_damage"],
    },
    "RA-7586": {
        "code": "RA-7586",
        "title": "National Integrated Protected Areas System Act (NIPAS)",
        "issuing_agency": "DENR",
        "jurisdictionCode": "PH-NATIONAL",
        "hazard_types": [],
    },
}

# ---------------------------------------------------------------------------
# Structured Hazard→Law Reference Table
# Inverse of LAW_REFERENCE: keyed by hazard code, each entry lists the
# single law that hazard violates (per HAZARD_LAW_EDGES).
# ---------------------------------------------------------------------------

HAZARD_LAW_REFERENCE: dict[str, dict[str, Any]] = {
    "illegal_logging": {
        "code": "illegal_logging",
        "name": "Illegal Logging",
        "law_code": "PD-705",
        "law_title": "Revised Forestry Code of the Philippines",
        "issuing_agency": "DENR",
    },
    "open_burning": {
        "code": "open_burning",
        "name": "Open Burning",
        "law_code": "RA-8749",
        "law_title": "Philippine Clean Air Act of 1999",
        "issuing_agency": "DENR-EMB",
    },
    "mangrove_clearing": {
        "code": "mangrove_clearing",
        "name": "Mangrove Clearing",
        "law_code": "RA-7611",
        "law_title": "Strategic Environmental Plan for Palawan",
        "issuing_agency": "PCSD",
    },
    "oil_spill": {
        "code": "oil_spill",
        "name": "Oil Spill",
        "law_code": "PD-979",
        "law_title": "Marine Pollution Decree of 1976",
        "issuing_agency": "Philippine Coast Guard",
    },
    "wildlife_trafficking": {
        "code": "wildlife_trafficking",
        "name": "Wildlife Trafficking",
        "law_code": "RA-9147",
        "law_title": "Wildlife Resources Conservation and Protection Act",
        "issuing_agency": "DENR",
    },
    "coral_reef_damage": {
        "code": "coral_reef_damage",
        "name": "Coral Reef Damage",
        "law_code": "RA-9147",
        "law_title": "Wildlife Resources Conservation and Protection Act",
        "issuing_agency": "DENR",
    },
    "illegal_dumping": {
        "code": "illegal_dumping",
        "name": "Illegal Dumping",
        "law_code": "RA-9003",
        "law_title": "Ecological Solid Waste Management Act of 2000",
        "issuing_agency": "NSWMC",
    },
    "chemical_spill": {
        "code": "chemical_spill",
        "name": "Chemical Spill",
        "law_code": "RA-6969",
        "law_title": "Toxic Substances and Hazardous Wastes Control Act",
        "issuing_agency": "DENR-EMB",
    },
    "sand_mining": {
        "code": "sand_mining",
        "name": "Sand Mining",
        "law_code": "PD-1067",
        "law_title": "Water Code of the Philippines",
        "issuing_agency": "NWRB",
    },
    "water_pollution": {
        "code": "water_pollution",
        "name": "Water Pollution",
        "law_code": "RA-9275",
        "law_title": "Philippine Clean Water Act of 2004",
        "issuing_agency": "DENR-EMB",
    },
    "air_pollution": {
        "code": "air_pollution",
        "name": "Air Pollution",
        "law_code": "RA-8749",
        "law_title": "Philippine Clean Air Act of 1999",
        "issuing_agency": "DENR-EMB",
    },
    "coastal_erosion": {
        "code": "coastal_erosion",
        "name": "Coastal Erosion",
        "law_code": "RA-9275",
        "law_title": "Philippine Clean Water Act of 2004",
        "issuing_agency": "DENR-EMB",
    },
    "peatland_fire": {
        "code": "peatland_fire",
        "name": "Peatland Fire",
        "law_code": "RA-8749",
        "law_title": "Philippine Clean Air Act of 1999",
        "issuing_agency": "DENR-EMB",
    },
    "transboundary_haze": {
        "code": "transboundary_haze",
        "name": "Transboundary Haze",
        "law_code": "RA-8749",
        "law_title": "Philippine Clean Air Act of 1999",
        "issuing_agency": "DENR-EMB",
    },
    "rubber_plantation_encroachment": {
        "code": "rubber_plantation_encroachment",
        "name": "Rubber Plantation Encroachment",
        "law_code": "PD-705",
        "law_title": "Revised Forestry Code of the Philippines",
        "issuing_agency": "DENR",
    },
    "hydropower_displacement": {
        "code": "hydropower_displacement",
        "name": "Hydropower Displacement",
        "law_code": "PD-1586",
        "law_title": "Environmental Impact Statement System",
        "issuing_agency": "DENR",
    },
    "sand_dredging": {
        "code": "sand_dredging",
        "name": "Sand Dredging",
        "law_code": "PD-1067",
        "law_title": "Water Code of the Philippines",
        "issuing_agency": "NWRB",
    },
    "mangrove_conversion_aquaculture": {
        "code": "mangrove_conversion_aquaculture",
        "name": "Mangrove to Aquaculture Conversion",
        "law_code": "RA-7611",
        "law_title": "Strategic Environmental Plan for Palawan",
        "issuing_agency": "PCSD",
    },
}

# ---------------------------------------------------------------------------
# Structured Law→Agency Reference Table
# Enforcement assignments: which NGO enforces which law.
# Source of truth: LAW_AGENCY_EDGES × BASELINE_AGENCIES
# ---------------------------------------------------------------------------

LAW_AGENCY_REFERENCE: dict[str, dict[str, Any]] = {
    "RA-9003": {
        "law_code": "RA-9003",
        "law_title": "Ecological Solid Waste Management Act of 2000",
        "agency_id": "ngo-green-dingle-initiative",
        "agency_name": "Green Dingle Initiative",
        "focus": "solid-waste",
        "region": "Western Visayas",
    },
    "RA-8749": {
        "law_code": "RA-8749",
        "law_title": "Philippine Clean Air Act of 1999",
        "agency_id": "ngo-bantay-kalikasan",
        "agency_name": "Bantay Kalikasan",
        "focus": "environmental-protection",
        "region": "National",
    },
    "RA-9275": {
        "law_code": "RA-9275",
        "law_title": "Philippine Clean Water Act of 2004",
        "agency_id": "ngo-coastal-guardians-ph",
        "agency_name": "Coastal Guardians PH",
        "focus": "marine-protection",
        "region": "Western Visayas",
    },
    "PD-705": {
        "law_code": "PD-705",
        "law_title": "Revised Forestry Code of the Philippines",
        "agency_id": "ngo-forest-watch-negros",
        "agency_name": "Forest Watch Negros",
        "focus": "forestry",
        "region": "Negros Occidental",
    },
    "RA-9147": {
        "law_code": "RA-9147",
        "law_title": "Wildlife Resources Conservation and Protection Act",
        "agency_id": "ngo-panay-eco-warriors",
        "agency_name": "Panay Eco Warriors",
        "focus": "wildlife-protection",
        "region": "Western Visayas",
    },
    "RA-7611": {
        "law_code": "RA-7611",
        "law_title": "Strategic Environmental Plan for Palawan",
        "agency_id": "ngo-coastal-guardians-ph",
        "agency_name": "Coastal Guardians PH",
        "focus": "marine-protection",
        "region": "Western Visayas",
    },
    "PD-979": {
        "law_code": "PD-979",
        "law_title": "Marine Pollution Decree of 1976",
        "agency_id": "ngo-coastal-guardians-ph",
        "agency_name": "Coastal Guardians PH",
        "focus": "marine-protection",
        "region": "Western Visayas",
    },
    "RA-6969": {
        "law_code": "RA-6969",
        "law_title": "Toxic Substances and Hazardous Wastes Control Act",
        "agency_id": "ngo-bantay-kalikasan",
        "agency_name": "Bantay Kalikasan",
        "focus": "environmental-protection",
        "region": "National",
    },
    "RA-9729": {
        "law_code": "RA-9729",
        "law_title": "Climate Change Act of 2009",
        "agency_id": "ngo-bantay-kalikasan",
        "agency_name": "Bantay Kalikasan",
        "focus": "environmental-protection",
        "region": "National",
    },
    "RA-10121": {
        "law_code": "RA-10121",
        "law_title": "Disaster Risk Reduction and Management Act of 2010",
        "agency_id": "ngo-bantay-kalikasan",
        "agency_name": "Bantay Kalikasan",
        "focus": "environmental-protection",
        "region": "National",
    },
}

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


# ===========================================================================
# INDONESIA COMPARISON LAYER
# Overlapping hazard types (illegal_dumping, open_burning, peatland_fire)
# to enable PH vs ID cross-jurisdiction analysis.
# ===========================================================================

# ---------------------------------------------------------------------------
# Indonesian Environmental Laws (3 — overlapping hazard coverage)
# ---------------------------------------------------------------------------

INDONESIA_LAWS: list[dict[str, Any]] = [
    {
        "code": "UU-18-2008",
        "title": "Waste Management (Pengelolaan Sampah)",
        "issuing_agency": "KLHK",
        "jurisdictionCode": "ID-NATIONAL",
    },
    {
        "code": "UU-32-2009",
        "title": "Environmental Protection and Management (PPLH)",
        "issuing_agency": "KLHK",
        "jurisdictionCode": "ID-NATIONAL",
    },
    {
        "code": "PP-71-2014",
        "title": "Peatland Ecosystem Protection and Management",
        "issuing_agency": "KLHK",
        "jurisdictionCode": "ID-NATIONAL",
    },
]

# ---------------------------------------------------------------------------
# Indonesian Enforcement Agencies
# ---------------------------------------------------------------------------

INDONESIA_AGENCIES: list[dict[str, Any]] = [
    {
        "id": "klhk",
        "name": "Kementerian Lingkungan Hidup dan Kehutanan",
        "focus": "environmental-protection",
        "country": "ID",
        "region": "National",
    },
    {
        "id": "dlhk-dki-jakarta",
        "name": "Dinas Lingkungan Hidup DKI Jakarta",
        "focus": "waste-management",
        "country": "ID",
        "region": "DKI Jakarta",
    },
]

# ---------------------------------------------------------------------------
# Edges: HazardType -[:VIOLATES]-> Law (Indonesia)
# ---------------------------------------------------------------------------

ID_HAZARD_LAW_EDGES: list[tuple[str, str]] = [
    ("illegal_dumping", "UU-18-2008"),
    ("open_burning", "UU-32-2009"),
    ("peatland_fire", "PP-71-2014"),
]

# ---------------------------------------------------------------------------
# Edges: Law -[:ENFORCED_BY]-> Agency (Indonesia)
# ---------------------------------------------------------------------------

ID_LAW_AGENCY_EDGES: list[tuple[str, str]] = [
    ("UU-18-2008", "dlhk-dki-jakarta"),
    ("UU-32-2009", "klhk"),
    ("PP-71-2014", "klhk"),
]

# ---------------------------------------------------------------------------
# Structured Indonesia Law→Hazard Reference Table
# ---------------------------------------------------------------------------

ID_LAW_REFERENCE: dict[str, dict[str, Any]] = {
    "UU-18-2008": {
        "code": "UU-18-2008",
        "title": "Waste Management (Pengelolaan Sampah)",
        "issuing_agency": "KLHK",
        "jurisdictionCode": "ID-NATIONAL",
        "hazard_types": ["illegal_dumping"],
    },
    "UU-32-2009": {
        "code": "UU-32-2009",
        "title": "Environmental Protection and Management (PPLH)",
        "issuing_agency": "KLHK",
        "jurisdictionCode": "ID-NATIONAL",
        "hazard_types": ["open_burning"],
    },
    "PP-71-2014": {
        "code": "PP-71-2014",
        "title": "Peatland Ecosystem Protection and Management",
        "issuing_agency": "KLHK",
        "jurisdictionCode": "ID-NATIONAL",
        "hazard_types": ["peatland_fire"],
    },
}

# ---------------------------------------------------------------------------
# Structured Indonesia Hazard→Law Reference Table
# ---------------------------------------------------------------------------

ID_HAZARD_LAW_REFERENCE: dict[str, dict[str, Any]] = {
    "illegal_dumping": {
        "code": "illegal_dumping",
        "name": "Illegal Dumping",
        "law_code": "UU-18-2008",
        "law_title": "Waste Management (Pengelolaan Sampah)",
        "issuing_agency": "KLHK",
    },
    "open_burning": {
        "code": "open_burning",
        "name": "Open Burning",
        "law_code": "UU-32-2009",
        "law_title": "Environmental Protection and Management (PPLH)",
        "issuing_agency": "KLHK",
    },
    "peatland_fire": {
        "code": "peatland_fire",
        "name": "Peatland Fire",
        "law_code": "PP-71-2014",
        "law_title": "Peatland Ecosystem Protection and Management",
        "issuing_agency": "KLHK",
    },
}

# ---------------------------------------------------------------------------
# Structured Indonesia Law→Agency Reference Table
# ---------------------------------------------------------------------------

ID_LAW_AGENCY_REFERENCE: dict[str, dict[str, Any]] = {
    "UU-18-2008": {
        "law_code": "UU-18-2008",
        "law_title": "Waste Management (Pengelolaan Sampah)",
        "agency_id": "dlhk-dki-jakarta",
        "agency_name": "Dinas Lingkungan Hidup DKI Jakarta",
        "focus": "waste-management",
        "region": "DKI Jakarta",
    },
    "UU-32-2009": {
        "law_code": "UU-32-2009",
        "law_title": "Environmental Protection and Management (PPLH)",
        "agency_id": "klhk",
        "agency_name": "Kementerian Lingkungan Hidup dan Kehutanan",
        "focus": "environmental-protection",
        "region": "National",
    },
    "PP-71-2014": {
        "law_code": "PP-71-2014",
        "law_title": "Peatland Ecosystem Protection and Management",
        "agency_id": "klhk",
        "agency_name": "Kementerian Lingkungan Hidup dan Kehutanan",
        "focus": "environmental-protection",
        "region": "National",
    },
}

# ---------------------------------------------------------------------------
# PH vs ID Comparison Table
# Same hazard type → different jurisdiction, law, and enforcement
# ---------------------------------------------------------------------------

HAZARD_COMPARISON: list[dict[str, Any]] = [
    {
        "hazard_type": "illegal_dumping",
        "hazard_name": "Illegal Dumping",
        "philippines": {
            "law_code": "RA-9003",
            "law_title": "Ecological Solid Waste Management Act of 2000",
            "issuing_agency": "NSWMC",
            "enforcement_agency": "Green Dingle Initiative",
            "enforcement_region": "Western Visayas",
        },
        "indonesia": {
            "law_code": "UU-18-2008",
            "law_title": "Waste Management (Pengelolaan Sampah)",
            "issuing_agency": "KLHK",
            "enforcement_agency": "Dinas Lingkungan Hidup DKI Jakarta",
            "enforcement_region": "DKI Jakarta",
        },
    },
    {
        "hazard_type": "open_burning",
        "hazard_name": "Open Burning",
        "philippines": {
            "law_code": "RA-8749",
            "law_title": "Philippine Clean Air Act of 1999",
            "issuing_agency": "DENR-EMB",
            "enforcement_agency": "Bantay Kalikasan",
            "enforcement_region": "National",
        },
        "indonesia": {
            "law_code": "UU-32-2009",
            "law_title": "Environmental Protection and Management (PPLH)",
            "issuing_agency": "KLHK",
            "enforcement_agency": "Kementerian Lingkungan Hidup dan Kehutanan",
            "enforcement_region": "National",
        },
    },
    {
        "hazard_type": "peatland_fire",
        "hazard_name": "Peatland Fire",
        "philippines": {
            "law_code": "RA-8749",
            "law_title": "Philippine Clean Air Act of 1999",
            "issuing_agency": "DENR-EMB",
            "enforcement_agency": "Bantay Kalikasan",
            "enforcement_region": "National",
        },
        "indonesia": {
            "law_code": "PP-71-2014",
            "law_title": "Peatland Ecosystem Protection and Management",
            "issuing_agency": "KLHK",
            "enforcement_agency": "Kementerian Lingkungan Hidup dan Kehutanan",
            "enforcement_region": "National",
        },
    },
]
