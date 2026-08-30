"""
SRT 2026 Demo Data Seeder — Phase 1 Analytics Foundation
Generates ~200 realistic tickets over 90 days in Iloilo / Western Visayas.
Deliberate patterns built in for analytics to detect.

Run: python seed_demo.py
Idempotent: clears prior demo rows (marked with demo_seed marker) before inserting.
"""

import asyncio
import json
import random
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select

from db.connection import AsyncSessionLocal
from db.models import Ticket, TicketTimeline
from services.ghost_mode import fuzz_location

# ── Configuration ────────────────────────────────────────────────────────
TOTAL_TICKETS = 200
HISTORY_DAYS = 90
DEMO_MARKER = "demo_seed_v2"

# Category vocabulary — matches POSTGRESQL_ROUTING_RULES + triage_service
CATEGORIES = [
    "illegal_dumping", "solid_waste", "water_pollution", "air_pollution",
    "deforestation", "illegal_burning", "sewage_discharge", "chemical_spill",
    "noise_pollution",
]

# Severity levels (derived from image_analysis.py indicator map)
SEVERITIES = ["low", "medium", "high", "critical"]

# Category → typical severity distribution (weighted random)
CATEGORY_SEVERITY_WEIGHTS = {
    "illegal_dumping":  {"low": 10, "medium": 50, "high": 30, "critical": 10},
    "solid_waste":      {"low": 20, "medium": 50, "high": 25, "critical": 5},
    "water_pollution":  {"low": 5,  "medium": 30, "high": 40, "critical": 25},
    "air_pollution":    {"low": 10, "medium": 40, "high": 35, "critical": 15},
    "deforestation":    {"low": 5,  "medium": 20, "high": 40, "critical": 35},
    "illegal_burning":  {"low": 10, "medium": 30, "high": 40, "critical": 20},
    "sewage_discharge": {"low": 10, "medium": 40, "high": 35, "critical": 15},
    "chemical_spill":   {"low": 5,  "medium": 15, "high": 35, "critical": 45},
    "noise_pollution":  {"low": 30, "medium": 50, "high": 15, "critical": 5},
}

# Allowed transitions — mirrors db/models.py ALLOWED_TRANSITIONS
ALLOWED_TRANSITIONS = {
    "open":           ["investigating", "closed"],
    "investigating":  ["monitoring", "resolved", "closed"],
    "monitoring":     ["resolved", "investigating", "closed"],
    "resolved":       ["verified", "closed"],
    "pending_review": ["open", "investigating", "closed"],
    "verified":       ["closed"],
    "closed":         [],
}

# Status target distribution (for final status)
STATUS_DISTRIBUTION = {
    "open": 12,
    "investigating": 15,
    "monitoring": 8,
    "resolved": 30,
    "verified": 20,
    "closed": 15,
}

# ── Iloilo / Western Visayas locations ──────────────────────────────────
# (name, lat, lon, address_text)
LOCATIONS = [
    ("Dingle, Iloilo", 10.6958, 122.5923, "Dingle, Iloilo, Western Visayas"),
    ("Pototan, Iloilo", 10.7370, 122.6373, "Pototan, Iloilo, Western Visayas"),
    ("Passi City, Iloilo", 10.9167, 122.6333, "Passi City, Iloilo, Western Visayas"),
    ("Iloilo City Proper", 10.7202, 122.5621, "Iloilo City Proper, Iloilo"),
    ("Molo, Iloilo City", 10.6958, 122.5438, "Molo, Iloilo City, Iloilo"),
    ("Jaro, Iloilo City", 10.7110, 122.5580, "Jaro, Iloilo City, Iloilo"),
    ("Lapuz, Iloilo City", 10.6917, 122.5920, "Lapuz, Iloilo City, Iloilo"),
    ("Leganes, Iloilo", 10.7517, 122.5117, "Leganes, Iloilo, Western Visayas"),
    ("Santa Barbara, Iloilo", 10.8228, 122.5378, "Santa Barbara, Iloilo, Western Visayas"),
    ("Calinog, Iloilo", 10.9667, 122.4833, "Calinog, Iloilo, Western Visayas"),
    ("Bingawan, Iloilo", 10.9500, 122.5000, "Bingawan, Iloilo, Western Visayas"),
    ("Cabatuan, Iloilo", 10.7917, 122.5667, "Cabatuan, Iloilo, Western Visayas"),
    ("Tara, Iloilo", 10.7750, 122.5500, "Tara, Iloilo, Western Visayas"),
    ("Janiuay, Iloilo", 10.7500, 122.5833, "Janiuay, Iloilo, Western Visayas"),
    ("Badiangan, Iloilo", 10.7667, 122.5167, "Badiangan, Iloilo, Western Visayas"),
]

# ── Location weights — Dingle cluster for rising illegal_dumping ────────
# Dingle gets ~25% of all tickets (the rising hotspot)
LOCATION_WEIGHTS = [25, 8, 7, 10, 6, 6, 5, 5, 5, 4, 4, 4, 3, 3, 5]

# ── Category weights per location — Dingle gets heavy illegal_dumping ───
# Default weights for most locations
DEFAULT_CATEGORY_WEIGHTS = {
    "illegal_dumping": 20, "solid_waste": 18, "water_pollution": 12,
    "air_pollution": 12, "deforestation": 10, "illegal_burning": 8,
    "sewage_discharge": 7, "chemical_spill": 6, "noise_pollution": 7,
}

# Dingle-specific: heavy illegal_dumping, rising over time
DINGLE_CATEGORY_WEIGHTS = {
    "illegal_dumping": 40, "solid_waste": 15, "water_pollution": 10,
    "air_pollution": 8, "deforestation": 8, "illegal_burning": 7,
    "sewage_discharge": 5, "chemical_spill": 3, "noise_pollution": 4,
}

# ── Title / description templates per category ──────────────────────────
TEMPLATES = {
    "illegal_dumping": [
        ("Illegal waste dumping near {location}", "Piles of household and construction waste dumped on the roadside. Visible from the main road."),
        ("Unauthorized garbage disposal — {location}", "Mixed waste including plastics and diapers dumped in an open lot."),
        ("Open dumping of industrial waste — {location}", "Suspicious barrels and bags of waste found near the riverbank."),
    ],
    "solid_waste": [
        ("Uncollected garbage — {location}", "Residential garbage has not been collected for over a week. Overflowing bins."),
        ("Waste accumulation on roadside — {location}", "Non-biodegradable waste piling up along the highway shoulder."),
    ],
    "water_pollution": [
        ("Water discoloration in creek — {location}", "Creek water turned brownish. Possible discharge from upstream facility."),
        ("Suspicious discharge in waterway — {location}", "Foamy, discolored water flowing into the river from a drainage pipe."),
        ("Oil sheen on water surface — {location}", "Rainbow-colored film visible on stagnant water near the market area."),
    ],
    "air_pollution": [
        ("Smoke emission from facility — {location}", "Thick gray smoke visible from a processing plant. Strong chemical smell."),
        ("Burning of waste materials — {location}", "Open burning of plastic and rubber waste producing black smoke."),
    ],
    "deforestation": [
        ("Unauthorized tree clearing — {location}", "Multiple mature trees cut down on hillslope. No visible permit."),
        ("Illegal logging activity — {location}", "Freshly cut logs stacked near a makeshift access road."),
    ],
    "illegal_burning": [
        ("Open burning of agricultural waste — {location}", "Rice straw burning producing heavy smoke across the road."),
        ("Waste burning near residential area — {location}", "Burning of mixed waste including plastics close to houses."),
    ],
    "sewage_discharge": [
        ("Untreated sewage discharge — {location}", "Raw sewage flowing directly into the creek from a drainage outfall."),
        ("Septic overflow — {location}", "Overflowing septic discharge contaminating nearby waterway."),
    ],
    "chemical_spill": [
        ("Chemical spill near road — {location}", "Strong-smelling liquid pooled on the roadside after a truck passed."),
        ("Suspected chemical dumping — {location}", "Chemical drums found leaking near the rice fields."),
    ],
    "noise_pollution": [
        ("Excessive construction noise — {location}", "Heavy machinery operating past 10 PM. Residents unable to sleep."),
        ("Industrial noise disturbance — {location}", "Continuous loud machinery noise from the processing facility."),
    ],
}


def _pick_severity(category: str) -> str:
    """Pick severity based on category-specific weights."""
    weights = CATEGORY_SEVERITY_WEIGHTS[category]
    return random.choices(
        list(weights.keys()),
        weights=list(weights.values()),
        k=1,
    )[0]


def _build_ai_analysis_raw(category: str, severity: str, confidence: float) -> dict:
    """Build a structurally realistic ai_analysis_raw JSONB blob."""
    # Map category to a plausible COCO/env class label
    label_map = {
        "illegal_dumping": "Trash / Garbage",
        "solid_waste": "Plastic Waste",
        "water_pollution": "Polluted Water",
        "air_pollution": "Smoke",
        "deforestation": "Cleared Land",
        "illegal_burning": "Fire",
        "sewage_discharge": "Sanitation Issue",
        "chemical_spill": "Oil Spill",
        "noise_pollution": "Infrastructure",
    }
    label = label_map.get(category, "Unknown")

    return {
        "detection_count": random.randint(1, 8),
        "composite_confidence": confidence,
        "environmental_assessment": {
            "has_environmental_concern": True,
            "indicators": [
                {
                    "label": label,
                    "type": category,
                    "severity": severity,
                    "hazard_id": category,
                    "matched_objects": [label.split()[0].lower()],
                    "source": random.choice(["coco", "env_model"]),
                    "confidence": confidence,
                }
            ],
            "hazard_ids": [category],
            "total_objects_detected": random.randint(1, 12),
        },
    }


def _generate_timeline(final_status: str, created_at: datetime, ghost: bool) -> list[str]:
    """Generate a valid status progression ending at final_status."""
    if final_status == "open":
        return ["open"]

    # Build path from open → final_status
    paths = {
        "investigating": ["open", "investigating"],
        "monitoring": ["open", "investigating", "monitoring"],
        "resolved": ["open", "investigating", "resolved"],
        "verified": ["open", "investigating", "monitoring", "resolved", "verified"],
        "closed": ["open", "investigating", "resolved", "closed"],
    }
    return paths.get(final_status, ["open"])


def _build_tickets() -> list[dict]:
    """Build the full list of demo tickets with deliberate patterns."""
    random.seed(42)  # Reproducible
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=HISTORY_DAYS)
    tickets = []

    # Pick final statuses based on distribution
    status_pool = []
    for status, count in STATUS_DISTRIBUTION.items():
        status_pool.extend([status] * count)
    # Pad or trim to TOTAL_TICKETS
    while len(status_pool) < TOTAL_TICKETS:
        status_pool.append("open")
    random.shuffle(status_pool)

    for i in range(TOTAL_TICKETS):
        # Pick location (weighted — Dingle gets more)
        loc_idx = random.choices(range(len(LOCATIONS)), weights=LOCATION_WEIGHTS, k=1)[0]
        loc_name, base_lat, base_lon, address = LOCATIONS[loc_idx]

        # Pick category (Dingle gets heavy illegal_dumping)
        if loc_idx == 0:  # Dingle
            cat_weights = DINGLE_CATEGORY_WEIGHTS
        else:
            cat_weights = DEFAULT_CATEGORY_WEIGHTS
        category = random.choices(
            list(cat_weights.keys()),
            weights=list(cat_weights.values()),
            k=1,
        )[0]

        # Pattern: illegal_dumping in Dingle rises in last 30 days
        # Earlier tickets: less illegal_dumping; recent tickets: more
        days_ago = random.random() * HISTORY_DAYS
        if loc_idx == 0 and days_ago < 30:
            # Boost illegal_dumping probability for recent Dingle tickets
            if random.random() < 0.6:
                category = "illegal_dumping"

        # Pattern: air_pollution in decline — fewer recent tickets
        if category == "air_pollution" and days_ago < 30:
            if random.random() < 0.5:
                category = random.choice(["solid_waste", "noise_pollution"])

        # Jitter coordinates within ~2km of center
        lat = base_lat + random.uniform(-0.01, 0.01)
        lon = base_lon + random.uniform(-0.01, 0.01)

        # Ghost mode: ~18% of tickets
        ghost = random.random() < 0.18
        if ghost:
            lat, lon = fuzz_location(lat, lon)

        severity = _pick_severity(category)
        confidence = round(random.uniform(0.55, 0.98), 2)
        status = status_pool[i]

        # Create time: spread across 90 days, non-uniform
        # More tickets in recent 30 days (simulates growing adoption)
        if random.random() < 0.55:
            # Recent 30 days: 55% of tickets
            created_at = start + timedelta(days=random.uniform(60, HISTORY_DAYS))
        else:
            # Earlier 60 days: 45% of tickets
            created_at = start + timedelta(days=random.uniform(0, 60))

        # Resolved_at for resolved/verified/closed
        resolved_at = None
        if status in ("resolved", "verified", "closed"):
            resolved_at = created_at + timedelta(hours=random.randint(6, 168))

        # Title / description
        templates = TEMPLATES[category]
        title_tmpl, desc_tmpl = random.choice(templates)
        title = title_tmpl.format(location=loc_name)
        description = desc_tmpl

        ai_summary = f"YOLOv8: {random.randint(1, 6)} detection(s). Category: {category}."
        office_map = {
            "illegal_dumping": "LGU Environment Office",
            "solid_waste": "LGU Environment Office",
            "water_pollution": "DENR Water Resources Division",
            "air_pollution": "LGU Environment Office",
            "deforestation": "DENR - Protected Areas",
            "illegal_burning": "Bureau of Fire Protection / LGU Environment",
            "sewage_discharge": "LWUA / LGU Engineering Office",
            "chemical_spill": "DENR - Emergency Response",
            "noise_pollution": "LGU Environment Office",
        }

        tickets.append({
            "id": uuid.uuid4(),
            "title": title,
            "description": description,
            "status": status,
            "ghost_mode": ghost,
            "latitude": round(lat, 6),
            "longitude": round(lon, 6),
            "location_fuzzed": ghost,
            "address_text": address,
            "ai_triage_summary": ai_summary,
            "ai_confidence": confidence,
            "ai_analysis_raw": _build_ai_analysis_raw(category, severity, confidence),
            "ai_recommended_office": office_map.get(category, "LGU Environment Office"),
            "routing_source": random.choice(["neo4j", "neo4j", "postgresql_fallback"]),
            "category": category,
            "severity": severity,
            "urgency_score": confidence,
            "resolved_at": resolved_at,
            "created_at": created_at,
            "timeline": _generate_timeline(status, created_at, ghost),
            "loc_name": loc_name,
        })

    return tickets


async def seed():
    """Seed demo data. Idempotent: clears prior demo rows first."""
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=HISTORY_DAYS)

    async with AsyncSessionLocal() as db:
        # ── Clear prior demo rows ───────────────────────────────────────
        # Delete timelines for demo tickets
        demo_tickets_result = await db.execute(
            select(Ticket.id).where(
                Ticket.ai_triage_summary.ilike(f"%{DEMO_MARKER}%")
                | Ticket.title.ilike("%Demo:%")
            )
        )
        demo_ids = [row[0] for row in demo_tickets_result.fetchall()]

        if demo_ids:
            await db.execute(
                delete(TicketTimeline).where(TicketTimeline.ticket_id.in_(demo_ids))
            )
            await db.execute(
                delete(Ticket).where(Ticket.id.in_(demo_ids))
            )
            await db.commit()
            print(f"  Cleared {len(demo_ids)} prior demo tickets")

        # ── Insert new demo tickets ─────────────────────────────────────
        tickets = _build_tickets()
        created_count = 0

        for data in tickets:
            ticket = Ticket(
                id=data["id"],
                title=data["title"],
                description=data["description"],
                status=data["status"],
                ghost_mode=data["ghost_mode"],
                latitude=data["latitude"],
                longitude=data["longitude"],
                location_fuzzed=data["location_fuzzed"],
                address_text=data["address_text"],
                ai_triage_summary=data["ai_triage_summary"],
                ai_confidence=data["ai_confidence"],
                ai_analysis_raw=data["ai_analysis_raw"],
                ai_recommended_office=data["ai_recommended_office"],
                routing_source=data["routing_source"],
                category=data["category"],
                severity=data["severity"],
                urgency_score=data["urgency_score"],
                resolved_at=data["resolved_at"],
                created_at=data["created_at"],
            )
            db.add(ticket)

            # Build timeline
            timeline = data["timeline"]
            prev = None
            for j, status in enumerate(timeline):
                tl = TicketTimeline(
                    id=uuid.uuid4(),
                    ticket_id=data["id"],
                    actor_type="ghost" if data["ghost_mode"] else "lgu",
                    from_status=prev,
                    to_status=status,
                    note=f"Demo seed: {status}",
                    created_at=data["created_at"] + timedelta(hours=j * 6),
                )
                db.add(tl)
                prev = status

            created_count += 1

        await db.commit()

        # ── Print summary ───────────────────────────────────────────────
        print(f"\n{'='*60}")
        print(f"  LikasLens Demo Seed — {created_count} tickets")
        print(f"  History: {HISTORY_DAYS} days  |  Window: {start.strftime('%Y-%m-%d')} → {now.strftime('%Y-%m-%d')}")
        print(f"{'='*60}")

        # Status breakdown
        status_counts = {}
        for t in tickets:
            status_counts[t["status"]] = status_counts.get(t["status"], 0) + 1
        print("\n  Status distribution:")
        for s, c in sorted(status_counts.items()):
            print(f"    {s:15s} {c:3d}  ({c*100//created_count}%)")

        # Category breakdown
        cat_counts = {}
        for t in tickets:
            cat_counts[t["category"]] = cat_counts.get(t["category"], 0) + 1
        print("\n  Category distribution:")
        for c, n in sorted(cat_counts.items(), key=lambda x: -x[1]):
            print(f"    {c:20s} {n:3d}  ({n*100//created_count}%)")

        # Ghost mode
        ghost_count = sum(1 for t in tickets if t["ghost_mode"])
        print(f"\n  Ghost mode: {ghost_count} tickets ({ghost_count*100//created_count}%)")

        # Dingle cluster
        dingle_count = sum(1 for t in tickets if t["loc_name"].startswith("Dingle"))
        dingle_dumping = sum(1 for t in tickets if t["loc_name"].startswith("Dingle") and t["category"] == "illegal_dumping")
        print(f"  Dingle cluster: {dingle_count} tickets ({dingle_dumping} illegal_dumping)")

        # Recent 30-day illegal_dumping in Dingle
        recent_cutoff = now - timedelta(days=30)
        recent_dingle_dumping = sum(
            1 for t in tickets
            if t["loc_name"].startswith("Dingle")
            and t["category"] == "illegal_dumping"
            and t["created_at"] >= recent_cutoff
        )
        print(f"  Dingle illegal_dumping (last 30d): {recent_dingle_dumping}")

        print(f"\n{'='*60}")
        print("  Seed complete.")


if __name__ == "__main__":
    asyncio.run(seed())
