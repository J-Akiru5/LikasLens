"""
Graph migration runner for baseline Laws, NGOs, and Jurisdictions.
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import os
import sys
from dataclasses import dataclass
from typing import Iterable

from gremlin_python.driver.client import Client
from gremlin_python.driver.serializer import GraphSONSerializersV2d0
from gremlin_python.driver.aiohttp.transport import AiohttpTransport

from gremlin_upserts.baseline_rules import build_baseline_rule_queries


@dataclass(frozen=True)
class CosmosGremlinConfig:
    endpoint: str
    account_key: str
    database: str
    graph: str


def parse_connection_string(value: str) -> CosmosGremlinConfig:
    parts = [part for part in value.split(";") if part]
    pairs = dict(
        part.split("=", 1) for part in parts if "=" in part
    )

    endpoint = pairs.get("AccountEndpoint")
    account_key = pairs.get("AccountKey")
    database = pairs.get("Database")
    graph = pairs.get("Graph")

    missing = [
        key for key, val in {
            "AccountEndpoint": endpoint,
            "AccountKey": account_key,
            "Database": database,
            "Graph": graph,
        }.items()
        if not val
    ]

    if missing:
        raise ValueError(
            "COSMOS_GREMLIN_CONNECTION_STRING missing keys: " + ", ".join(missing)
        )

    return CosmosGremlinConfig(
        endpoint=endpoint,
        account_key=account_key,
        database=database,
        graph=graph,
    )


def build_client(config: CosmosGremlinConfig) -> Client:
    graph_path = f"/dbs/{config.database}/colls/{config.graph}"
    return Client(
        f"{config.endpoint}dbs/{config.database}/colls/{config.graph}",
        "g",
        username=graph_path,
        password=config.account_key,
        message_serializer=GraphSONSerializersV2d0(),
        transport_factory=AiohttpTransport,
    )


async def _submit(client: Client, query: str) -> None:
    result_set = await asyncio.wrap_future(client.submitAsync(query))
    result_set.all().result()


async def up(client: Client, dry_run: bool) -> None:
    queries = build_baseline_rule_queries()

    for query in queries:
        if dry_run:
            logging.info("[dry-run] %s", query)
            continue

        await _submit(client, query)
        logging.info("Applied query")


async def down(client: Client, dry_run: bool) -> None:
    logging.warning(
        "Rollback for baseline rules is intentionally non-destructive. "
        "If you need to deactivate vertices, implement a soft-delete traversal here."
    )

    if dry_run:
        logging.info("[dry-run] No rollback executed")


async def run_migration(dry_run: bool, rollback: bool) -> int:
    connection_string = os.getenv("COSMOS_GREMLIN_CONNECTION_STRING", "")
    if not connection_string:
        logging.error("COSMOS_GREMLIN_CONNECTION_STRING is not set.")
        return 2

    try:
        config = parse_connection_string(connection_string)
    except ValueError as exc:
        logging.error("%s", exc)
        return 2

    client = build_client(config)

    try:
        if rollback:
            await down(client, dry_run)
        else:
            await up(client, dry_run)
    except Exception:
        logging.exception("Migration failed")
        return 1
    finally:
        client.close()

    return 0


def build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Baseline rule graph migration")
    parser.add_argument("--dry-run", action="store_true", help="Print queries only")
    parser.add_argument("--rollback", action="store_true", help="Run down() instead of up()")
    return parser


def configure_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(message)s",
    )


def main() -> int:
    configure_logging()
    parser = build_argument_parser()
    args = parser.parse_args()

    return asyncio.run(run_migration(args.dry_run, args.rollback))


if __name__ == "__main__":
    raise SystemExit(main())

# Checklist:
# 1) Dry-run: python migrations/2026_05_13_baseline_rules.py --dry-run
# 2) Production: python migrations/2026_05_13_baseline_rules.py
