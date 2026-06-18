"""
Seed script for Neo4j AuraDB.
Populates the graph with Philippine environmental laws, hazard types,
agencies, violation types, and locations (Iloilo proof of concept).

Usage:
    python seed_neo4j.py          # Seed the database
    python seed_neo4j.py --drop   # Drop all data first, then seed

Environment variables:
    NEO4J_URI       - Neo4j connection URI (e.g., neo4j+s://xxxx.databases.neo4j.io)
    NEO4J_USER      - Neo4j username (default: neo4j)
    NEO4J_PASSWORD  - Neo4j password
    GOOGLE_API_KEY  - (Optional) Gemini API key for vector embeddings
"""

from __future__ import annotations

import asyncio
import os
import sys
import time

from dotenv import load_dotenv

load_dotenv()


# ---------------------------------------------------------------------------
# Constraints
# ---------------------------------------------------------------------------

CONSTRAINTS = [
    "CREATE CONSTRAINT IF NOT EXISTS FOR (l:Law) REQUIRE l.code IS UNIQUE",
    "CREATE CONSTRAINT IF NOT EXISTS FOR (h:HazardType) REQUIRE h.code IS UNIQUE",
    "CREATE CONSTRAINT IF NOT EXISTS FOR (a:Agency) REQUIRE a.id IS UNIQUE",
    "CREATE CONSTRAINT IF NOT EXISTS FOR (v:ViolationType) REQUIRE v.code IS UNIQUE",
    "CREATE CONSTRAINT IF NOT EXISTS FOR (loc:Location) REQUIRE loc.name IS UNIQUE",
    "CREATE CONSTRAINT IF NOT EXISTS FOR (i:Incident) REQUIRE i.id IS UNIQUE",
    "CREATE CONSTRAINT IF NOT EXISTS FOR (c:Citizen) REQUIRE c.id IS UNIQUE",
]


# ---------------------------------------------------------------------------
# Main seed logic
# ---------------------------------------------------------------------------

async def run_seed(drop: bool = False) -> None:
    """Execute the full seed process."""
    uri = os.getenv("NEO4J_URI")
    user = os.getenv("NEO4J_USER", "neo4j")
    password = os.getenv("NEO4J_PASSWORD")

    if not uri or not password:
        print("ERROR: NEO4J_URI and NEO4J_PASSWORD must be set.")
        print("Set them in your .env file or export them as environment variables.")
        sys.exit(1)

    from neo4j import AsyncGraphDatabase

    driver = AsyncGraphDatabase.driver(uri, auth=(user, password))

    try:
        async with driver.session() as session:
            # -- Drop if requested --
            if drop:
                print("Dropping all existing data...")
                await session.run("MATCH (n) DETACH DELETE n")
                print("  Database cleared.")

            # -- Create constraints --
            print("\nCreating constraints...")
            for constraint in CONSTRAINTS:
                await session.run(constraint)
                print(f"  {constraint.split('REQUIRE')[1].strip()}")

            # -- Seed vertices --
            from neo4j_upserts.baseline_rules import get_all_vertex_queries, get_all_edge_queries

            vertex_queries = get_all_vertex_queries()
            print(f"\nSeeding {len(vertex_queries)} vertex nodes...")
            for item in vertex_queries:
                await session.run(item["query"], item["params"])
                print(f"  {item['description']}")

            # -- Seed edges --
            edge_queries = get_all_edge_queries()
            print(f"\nSeeding {len(edge_queries)} edges...")
            for item in edge_queries:
                await session.run(item["query"], item["params"])
                print(f"  {item['description']}")

            # -- Vector embeddings (optional) --
            api_key = os.getenv("GOOGLE_API_KEY")
            if api_key:
                print("\nCreating vector index and embedding laws...")
                try:
                    await _embed_laws(session, api_key)
                    print("  Vector embeddings complete.")
                except Exception as exc:
                    print(f"  WARNING: Embedding failed ({exc}). Skipping vectors.")
                    print("  Graph traversal will still work — vector search is optional.")
            else:
                print("\nNo GOOGLE_API_KEY found — skipping vector embeddings.")
                print("  Graph traversal will still work. Add GOOGLE_API_KEY later for GraphRAG.")

            # -- Print summary --
            print("\n" + "=" * 50)
            print("SEED COMPLETE — Summary:")
            print("=" * 50)
            result = await session.run(
                "MATCH (n) RETURN labels(n)[0] AS label, count(n) AS count ORDER BY count DESC"
            )
            records = await result.data()
            for r in records:
                print(f"  {r['label']:20s} {r['count']} nodes")

            result = await session.run(
                "MATCH ()-[r]->() RETURN type(r) AS type, count(r) AS count ORDER BY count DESC"
            )
            records = await result.data()
            for r in records:
                print(f"  {r['type']:20s} {r['count']} edges")

    finally:
        await driver.close()
        print("\nDone.")


async def _embed_laws(session, api_key: str) -> None:
    """Create vector index and embed all Law nodes."""
    import google.generativeai as genai

    genai.configure(api_key=api_key)

    # Create vector index
    await session.run("""
        CREATE VECTOR INDEX law_embeddings IF NOT EXISTS
        FOR (l:Law)
        ON (l.embedding)
        OPTIONS {
            indexConfig: {
                `vector.dimensions`: 768,
                `vector.similarity_function`: 'cosine'
            }
        }
    """)

    # Get all laws
    result = await session.run("MATCH (l:Law) RETURN l.code AS code, l.title AS title")
    laws = await result.data()

    print(f"  Embedding {len(laws)} law nodes...")

    for law in laws:
        text = f"{law['code']}: {law['title']}"
        try:
            embed_result = await asyncio.to_thread(
                genai.embed_content,
                model="text-embedding-004",
                content=text,
                task_type="RETRIEVAL_DOCUMENT",
            )
            embedding = embed_result["embedding"]

            await session.run(
                "MATCH (l:Law {code: $code}) SET l.embedding = $embedding",
                {"code": law["code"], "embedding": embedding},
            )
            print(f"    {law['code']}")
        except Exception as exc:
            print(f"    {law['code']} — FAILED: {exc}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    drop_flag = "--drop" in sys.argv
    if drop_flag:
        print("WARNING: --drop flag detected. All existing data will be deleted.")
        confirm = input("Type 'yes' to confirm: ")
        if confirm.lower() != "yes":
            print("Aborted.")
            sys.exit(0)

    start = time.time()
    asyncio.run(run_seed(drop=drop_flag))
    elapsed = time.time() - start
    print(f"\nTotal time: {elapsed:.1f}s")
