"""
Gremlin bootstrap query generation for Cosmos DB (idempotent upserts).
"""

from __future__ import annotations

from typing import Any


def _quote(value: Any) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    if value is None:
        return "null"
    if isinstance(value, (int, float)):
        return str(value)

    text = str(value).replace("\\", "\\\\").replace("'", "\\'")
    return f"'{text}'"


def build_vertex_upsert_query(vertex_id: str, label: str, props: dict[str, Any]) -> str:
    prop_chain = "".join(
        f".property('{key}', {_quote(value)})"
        for key, value in props.items()
    )

    return (
        f"g.V('{vertex_id}').fold().coalesce(unfold(), "
        f"addV('{label}').property('id','{vertex_id}'){prop_chain})"
    )


def build_edge_upsert_query(
    from_vertex_id: str,
    to_vertex_id: str,
    edge_label: str,
    props: dict[str, Any],
) -> str:
    prop_chain = "".join(
        f".property('{key}', {_quote(value)})"
        for key, value in props.items()
    )

    return (
        f"g.V('{from_vertex_id}').as('a').V('{to_vertex_id}').as('b')"
        f".coalesce(__.select('a').outE('{edge_label}').where(inV().as('b')),"
        f"__.addE('{edge_label}').from('a').to('b'){prop_chain})"
    )


def build_bootstrap_queries(vertices: list[dict[str, Any]], edges: list[dict[str, Any]]) -> dict[str, list[str]]:
    vertex_queries = [
        build_vertex_upsert_query(v['id'], v['label'], v.get('props', {}))
        for v in vertices
    ]

    edge_queries = [
        build_edge_upsert_query(e['from'], e['to'], e['label'], e.get('props', {}))
        for e in edges
    ]

    return {
        'vertices': vertex_queries,
        'edges': edge_queries,
    }
