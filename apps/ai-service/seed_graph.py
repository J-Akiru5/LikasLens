"""
Gremlin graph seeding script for LikasLens.
Upserts all baseline vertices (laws, violations, hazards, NGOs, jurisdictions)
and edges (violates, enforced_by, classified_from) into Cosmos DB Gremlin.

Usage:
    python seed_graph.py              # Seed all vertices and edges
    python seed_graph.py --dry-run    # Print queries without executing
    python seed_graph.py --stats      # Print graph statistics only
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import os
import sys

from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

# Add parent dir for imports
sys.path.insert(0, os.path.dirname(__file__))

from gremlin_upserts.baseline_rules import (
    BASELINE_HAZARDS,
    BASELINE_JURISDICTIONS,
    BASELINE_LAWS,
    BASELINE_NGOS,
    BASELINE_VIOLATIONS,
    HAZARD_LAW_EDGES,
    LAW_NGO_EDGES,
    VIOLATION_HAZARD_EDGES,
    build_baseline_edge_queries,
    build_baseline_rule_queries,
)


def print_stats() -> None:
    """Print summary statistics of the baseline data."""
    print("\n=== LikasLens Graph Seed Statistics ===")
    print(f"Laws:           {len(BASELINE_LAWS)}")
    print(f"NGOs:           {len(BASELINE_NGOS)}")
    print(f"Jurisdictions:  {len(BASELINE_JURISDICTIONS)}")
    print(f"Violation Types:{len(BASELINE_VIOLATIONS)}")
    print(f"Hazard Types:   {len(BASELINE_HAZARDS)}")
    print(f"Hazard->Law:    {len(HAZARD_LAW_EDGES)}")
    print(f"Law->NGO:       {len(LAW_NGO_EDGES)}")
    print(f"Violation->Hazard: {len(VIOLATION_HAZARD_EDGES)}")

    vertex_queries = build_baseline_rule_queries()
    edge_queries = build_baseline_edge_queries()
    print(f"\nTotal vertex upserts: {len(vertex_queries)}")
    print(f"Total edge upserts:   {len(edge_queries)}")
    print(f"Total queries:        {len(vertex_queries) + len(edge_queries)}")


def dry_run() -> None:
    """Print all queries without executing."""
    vertex_queries = build_baseline_rule_queries()
    edge_queries = build_baseline_edge_queries()

    print("\n=== Vertex Upsert Queries ===")
    for i, q in enumerate(vertex_queries, 1):
        print(f"\n--- Vertex {i} ---")
        print(q)

    print("\n\n=== Edge Upsert Queries ===")
    for i, q in enumerate(edge_queries, 1):
        print(f"\n--- Edge {i} ---")
        print(q)


async def seed_graph() -> None:
    """Execute all upsert queries against Cosmos DB Gremlin."""
    from gremlin_client import get_client, is_configured

    if not is_configured():
        logger.error(
            "Cosmos Gremlin not configured. "
            "Set COSMOS_GREMLIN_ENDPOINT and COSMOS_GREMLIN_KEY in .env"
        )
        sys.exit(1)

    client = get_client()

    vertex_queries = build_baseline_rule_queries()
    edge_queries = build_baseline_edge_queries()
    total = len(vertex_queries) + len(edge_queries)

    logger.info("Seeding %d vertices and %d edges (%d total)...", len(vertex_queries), len(edge_queries), total)

    success = 0
    errors = 0

    # Upsert vertices first (edges reference them)
    for i, query in enumerate(vertex_queries, 1):
        try:
            result_set = client.submit(query)
            list(result_set)  # consume results
            success += 1
            if i % 10 == 0:
                logger.info("  Vertices: %d/%d done", i, len(vertex_queries))
        except Exception as exc:
            errors += 1
            logger.warning("  Vertex %d failed: %s", i, exc)

    # Then upsert edges
    for i, query in enumerate(edge_queries, 1):
        try:
            result_set = client.submit(query)
            list(result_set)  # consume results
            success += 1
        except Exception as exc:
            errors += 1
            logger.warning("  Edge %d failed: %s", i, exc)

    logger.info("Seeding complete: %d succeeded, %d errors", success, errors)

    # Verify by counting vertices
    try:
        for label in ["Law", "ViolationType", "HazardType"]:
            count_query = f"g.V().hasLabel('{label}').count()"
            result = list(client.submit(count_query))
            count = result[0] if result else 0
            logger.info("  %s vertices: %s", label, count)
    except Exception as exc:
        logger.warning("Verification count failed: %s", exc)


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed LikasLens Gremlin graph")
    parser.add_argument("--dry-run", action="store_true", help="Print queries without executing")
    parser.add_argument("--stats", action="store_true", help="Print statistics only")
    args = parser.parse_args()

    if args.stats:
        print_stats()
        return

    if args.dry_run:
        dry_run()
        return

    print_stats()
    asyncio.run(seed_graph())


if __name__ == "__main__":
    main()
