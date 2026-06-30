# Cosmos Gremlin Setup Guide

This guide covers the Cosmos DB Gremlin setup that backs the ReD automated routing work in `apps/ai-service`.

## What Already Exists

The AI service already exposes the graph shape and bootstrap payloads:

- `GET /graph/topology` returns the canonical labels and partition key.
- `GET /graph/bootstrap-payload` returns deterministic seed vertices and edges.
- `GET /graph/bootstrap-queries` returns idempotent Gremlin upsert traversals.

The topology and seed data live in:

- `apps/ai-service/graph_topology.py`
- `apps/ai-service/gremlin_bootstrap.py`
- `apps/ai-service/main.py`

## Azure Resources To Create

1. Create or reuse an Azure Cosmos DB account with the Gremlin API enabled.
2. Create a database for LikasLens, for example `likaslens`.
3. Create a graph container, for example `routing_graph`.
4. Choose a partition key strategy before adding production data. The current seed graph uses `likaslens-routing-seed` for smoke tests.

## Recommended Environment Variables

Add these values to `apps/ai-service/.env` when wiring the service to a real Cosmos account:

```env
AI_SERVICE_PORT=8001
COSMOS_GREMLIN_ENDPOINT=wss://<account>.gremlin.cosmos.azure.com:443/
COSMOS_GREMLIN_KEY=<cosmos-key>
COSMOS_GREMLIN_DATABASE=likaslens
COSMOS_GREMLIN_GRAPH=routing_graph
COSMOS_GREMLIN_PARTITION_KEY=likaslens-routing-seed
```

## Setup Flow

1. Start by confirming the graph contract:

```bash
cd apps/ai-service
python -m uvicorn main:app --reload --port 8001
```

2. Open `http://localhost:8001/graph/topology` and confirm the vertex labels, edge labels, and partition key.
3. Open `http://localhost:8001/graph/bootstrap-payload` to inspect the seed graph.
4. Open `http://localhost:8001/graph/bootstrap-queries` to copy the Gremlin upserts into your Cosmos migration or admin tool.
5. Apply the vertex upserts first, then the edge upserts.

## Seed Data Rules

- Keep the seed vertices and edges on the same partition key while you are validating the graph.
- Use idempotent upserts only. The helper in `gremlin_bootstrap.py` is designed to avoid duplicate writes.
- Preserve `isActive` and `source` metadata so future routing and soft-delete logic can inspect it.

## Routing Notes

- `Citizen -> Incident` uses `REPORTED`.
- `Incident -> ViolationType` uses `CLASSIFIED_AS`.
- `Incident -> NGO` uses `ASSIGNED_TO`.

Those are the baseline relationships the ReD routing logic should traverse first.

## Next Implementation Step

After the graph is reachable, add the actual automated routing logic as a FastAPI or Azure Function integration that consumes the bootstrap topology and writes graph changes with the same partition key.
