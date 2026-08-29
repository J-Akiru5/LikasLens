"""
SRT 2026 Demo Data Seeder
Run: python seed_demo.py
Seeds 5 demo tickets across all status stages for the judge demonstration.
"""

import asyncio
import uuid
from datetime import datetime, timedelta, timezone

from db.connection import AsyncSessionLocal
from db.models import Ticket, TicketTimeline


DEMO_TICKETS = [
    {
        "title": "Illegal Waste Disposal — Brgy. Malibay, Pasay",
        "description": "Large pile of industrial waste dumped near residential area. Strong chemical odor.",
        "status": "resolved",
        "ghost_mode": False,
        "latitude": 14.5467,
        "longitude": 120.9931,
        "ai_triage_summary": "Illegal Dumping",
        "ai_confidence": 0.94,
        "ai_recommended_office": "LGU Environment Office",
        "routing_source": "neo4j",
        "urgency_score": 0.94,
        "timeline": ["open", "investigating", "resolved"],
    },
    {
        "title": "Water Contamination — Brgy. Ugong, Pasig",
        "description": "Brown discoloration in local waterway. Possible industrial discharge upstream.",
        "status": "investigating",
        "ghost_mode": True,
        "latitude": 14.5780,
        "longitude": 121.0720,
        "ai_triage_summary": "Water Pollution",
        "ai_confidence": 0.87,
        "ai_recommended_office": "DENR Water Resources Division",
        "routing_source": "neo4j",
        "urgency_score": 0.87,
        "timeline": ["open", "investigating"],
    },
    {
        "title": "Illegal Burning — Quezon City",
        "description": "Open burning of mixed waste including plastics observed at the site.",
        "status": "monitoring",
        "ghost_mode": False,
        "latitude": 14.6760,
        "longitude": 121.0437,
        "ai_triage_summary": "Air Pollution",
        "ai_confidence": 0.78,
        "ai_recommended_office": "Bureau of Fire Protection / LGU Environment",
        "routing_source": "postgresql_fallback",
        "urgency_score": 0.78,
        "timeline": ["open", "investigating", "monitoring"],
    },
    {
        "title": "Deforestation Activity — Antipolo, Rizal",
        "description": "Unauthorized tree clearing spotted on hillside. Multiple trees cut down.",
        "status": "open",
        "ghost_mode": True,
        "latitude": 14.6263,
        "longitude": 121.1753,
        "ai_triage_summary": "Deforestation",
        "ai_confidence": 0.91,
        "ai_recommended_office": "DENR - Protected Areas",
        "routing_source": "neo4j",
        "urgency_score": 0.91,
        "timeline": ["open"],
    },
    {
        "title": "Air Pollution — Industrial Zone, Taguig",
        "description": "Thick black smoke coming from factory chimney. Visible from 2km away.",
        "status": "verified",
        "ghost_mode": False,
        "latitude": 14.5243,
        "longitude": 121.0794,
        "ai_triage_summary": "Air Pollution",
        "ai_confidence": 0.62,
        "ai_recommended_office": "LGU Environment Office",
        "routing_source": "postgresql_fallback",
        "urgency_score": 0.62,
        "timeline": ["open", "investigating", "monitoring", "resolved", "verified"],
    },
]


async def seed():
    async with AsyncSessionLocal() as db:
        for i, data in enumerate(DEMO_TICKETS):
            ticket_id = uuid.uuid4()
            base_time = datetime.now(timezone.utc) - timedelta(days=len(DEMO_TICKETS) - i)

            ticket = Ticket(
                id=ticket_id,
                title=data["title"],
                description=data["description"],
                status=data["status"],
                ghost_mode=data["ghost_mode"],
                latitude=data["latitude"],
                longitude=data["longitude"],
                location_fuzzed=data["ghost_mode"],
                ai_triage_summary=data["ai_triage_summary"],
                ai_confidence=data["ai_confidence"],
                ai_recommended_office=data["ai_recommended_office"],
                routing_source=data["routing_source"],
                urgency_score=data["urgency_score"],
                resolved_at=(
                    base_time + timedelta(hours=24)
                    if data["status"] in ("resolved", "verified", "closed")
                    else None
                ),
                created_at=base_time,
            )
            db.add(ticket)

            prev = None
            for j, status in enumerate(data["timeline"]):
                tl = TicketTimeline(
                    id=uuid.uuid4(),
                    ticket_id=ticket_id,
                    actor_type="ghost" if data["ghost_mode"] else "lgu",
                    from_status=prev,
                    to_status=status,
                    note=f"Demo: {status} stage",
                    created_at=base_time + timedelta(hours=j * 6),
                )
                db.add(tl)
                prev = status

        await db.commit()
        print("✅ 5 demo tickets seeded successfully")


if __name__ == "__main__":
    asyncio.run(seed())
