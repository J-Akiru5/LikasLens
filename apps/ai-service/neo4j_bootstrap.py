"""
Neo4j bootstrap query generation (idempotent Cypher MERGE upserts).
Replaces the former Gremlin bootstrap module.
"""

from __future__ import annotations

from typing import Any


def build_vertex_merge_query(label: str, match_props: dict[str, Any], set_props: dict[str, Any] | None = None) -> str:
    """Build a Cypher MERGE query for a vertex/node.

    Args:
        label: Neo4j node label (e.g., 'Law', 'HazardType')
        match_props: Properties used to match the node (e.g., {'code': 'RA-9003'})
        set_props: Additional properties to set on create (optional)
    """
    match_clause = ", ".join(
        f"n.{k} = ${k}" for k in match_props
    )
    on_create_sets = ""
    if set_props:
        on_create_sets = " ON CREATE SET " + ", ".join(
            f"n.{k} = ${k}" for k in set_props
        )

    return f"MERGE (n:{label} {{ {match_clause} }}){on_create_sets} RETURN n"


def build_edge_merge_query(
    from_label: str,
    from_match: dict[str, Any],
    to_label: str,
    to_match: dict[str, Any],
    edge_label: str,
    edge_props: dict[str, Any] | None = None,
) -> str:
    """Build a Cypher MERGE query for a relationship/edge.

    Args:
        from_label: Source node label
        from_match: Source node match properties
        to_label: Target node label
        to_match: Target node match properties
        edge_label: Relationship type (e.g., 'VIOLATES', 'ENFORCED_BY')
        edge_props: Properties to set on the relationship (optional)
    """
    from_clause = ", ".join(
        f"a.{k} = ${'from_' + k}" for k in from_match
    )
    to_clause = ", ".join(
        f"b.{k} = ${'to_' + k}" for k in to_match
    )

    on_create_sets = ""
    if edge_props:
        on_create_sets = " ON CREATE SET " + ", ".join(
            f"r.{k} = ${'edge_' + k}" for k in edge_props
        )

    # Build flat parameter dict key lists for documentation
    return (
        f"MATCH (a:{from_label} {{ {from_clause} }}), "
        f"(b:{to_label} {{ {to_clause} }}) "
        f"MERGE (a)-[r:{edge_label}]->(b)"
        f"{on_create_sets} "
        f"RETURN a, r, b"
    )


def build_bootstrap_queries(
    vertices: list[dict[str, Any]],
    edges: list[dict[str, Any]],
) -> dict[str, list[dict[str, Any]]]:
    """Build all bootstrap Cypher queries from vertex and edge definitions.

    Each vertex dict should have:
        - label: str
        - match: dict (properties to MERGE on)
        - props: dict (additional properties to SET on create)

    Each edge dict should have:
        - from_label: str
        - from_match: dict
        - to_label: str
        - to_match: dict
        - label: str (edge type)
        - props: dict (edge properties)
    """
    vertex_queries = [
        {
            "description": f"Merge {v['label']}: {v.get('match', {})}",
            "query": build_vertex_merge_query(
                v["label"],
                v.get("match", {}),
                v.get("props"),
            ),
            "params": {**v.get("match", {}), **(v.get("props") or {})},
        }
        for v in vertices
    ]

    edge_queries = [
        {
            "description": f"Merge {e['from_label']} -[:{e['label']}]-> {e['to_label']}",
            "query": build_edge_merge_query(
                e["from_label"],
                e["from_match"],
                e["to_label"],
                e["to_match"],
                e["label"],
                e.get("props"),
            ),
            "params": {
                **{f"from_{k}": v for k, v in e["from_match"].items()},
                **{f"to_{k}": v for k, v in e["to_match"].items()},
                **{f"edge_{k}": v for k, v in (e.get("props") or {}).items()},
            },
        }
        for e in edges
    ]

    return {
        "vertices": vertex_queries,
        "edges": edge_queries,
    }
