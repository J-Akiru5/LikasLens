"""
LikasLens AI Service
Neuro-symbolic processing microservice using FastAPI and Google Generative AI
"""

import os
from contextlib import asynccontextmanager
from datetime import datetime

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from gremlin_bootstrap import build_bootstrap_queries
from graph_topology import build_seed_edges, build_seed_vertices, get_topology_config

# Load environment variables
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown events."""
    # Startup
    print("🚀 LikasLens AI Service starting...")
    yield
    # Shutdown
    print("👋 LikasLens AI Service shutting down...")


app = FastAPI(
    title="LikasLens AI Service",
    description="Neuro-symbolic civic reporting AI microservice",
    version="0.1.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js frontend
        "http://localhost:8000",  # Laravel backend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint for service monitoring."""
    return {
        "status": "ok",
        "service": "likaslens-ai-service",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "version": "0.1.0",
    }


@app.get("/")
async def root():
    """Root endpoint with service information."""
    return {
        "name": "LikasLens AI Service",
        "description": "Neuro-symbolic civic reporting AI microservice",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/graph/topology")
async def graph_topology():
    """Return the canonical Gremlin graph topology used by LikasLens."""
    topology = get_topology_config()
    return {
        "vertex_labels": topology.vertex_labels,
        "edge_labels": topology.edge_labels,
        "edge_properties": topology.edge_properties,
    }


@app.get("/graph/bootstrap-payload")
async def graph_bootstrap_payload():
    """Return deterministic seed payloads that can be upserted into Cosmos Gremlin."""
    return {
        "vertices": build_seed_vertices(),
        "edges": build_seed_edges(),
    }


@app.get("/graph/bootstrap-queries")
async def graph_bootstrap_queries():
    """Return idempotent Gremlin upsert traversals for the seed graph."""
    vertices = build_seed_vertices()
    edges = build_seed_edges()
    return build_bootstrap_queries(vertices, edges)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("AI_SERVICE_PORT", 8001)),
        reload=True,
    )
