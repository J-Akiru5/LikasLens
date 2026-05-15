"""
LikasLens AI Service
Neuro-symbolic processing microservice using FastAPI, YOLOv8, and Google Generative AI
"""

import os
from contextlib import asynccontextmanager
from datetime import datetime

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from gremlin_bootstrap import build_bootstrap_queries
from graph_topology import build_seed_edges, build_seed_vertices, get_topology_config

# Load environment variables
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown events."""
    # Startup
    print("[startup] LikasLens AI Service starting...")
    yield
    # Shutdown
    print("[shutdown] LikasLens AI Service shutting down...")


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
        "partition_key": topology.partition_key,
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


@app.post("/analyze")
async def analyze_image_upload(file: UploadFile = File(...), confidence: float = Form(0.25)):
    """Run YOLOv8 inference on an uploaded image and return detections."""
    from image_analysis import analyze_image

    image_bytes = await file.read()
    result = analyze_image(image_bytes, confidence)
    return {"success": True, "filename": file.filename, "analysis": result}


@app.post("/analyze/base64")
async def analyze_base64_image(payload: dict):
    """Run YOLOv8 inference on a base64-encoded image."""
    from image_analysis import analyze_base64

    base64_string = payload.get("image")
    confidence = payload.get("confidence", 0.25)
    if not base64_string:
        return {"success": False, "error": "Missing 'image' field"}

    result = analyze_base64(base64_string, confidence)
    return {"success": True, "analysis": result}


@app.get("/analyze/model")
async def analyze_model_status():
    """Return the currently loaded YOLO model info."""
    from image_analysis import ENVIRONMENTAL_KEYWORDS, _MODEL_NAME, get_model_path

    return {
        "model": _MODEL_NAME or "not loaded",
        "model_path": get_model_path(),
        "known_classes": len(ENVIRONMENTAL_KEYWORDS),
    }


@app.get("/routing/status")
async def routing_status():
    """Check Cosmos Gremlin routing service status."""
    from gremlin_client import get_connection_params, is_configured

    params = get_connection_params()
    return {
        "configured": is_configured(),
        "endpoint_set": bool(params["endpoint"]),
        "database": params["database"],
        "graph": params["graph"],
    }


@app.post("/routing/incident")
async def route_incident(payload: dict):
    """Route an incident through the graph: Citizen -> Incident -> ViolationType -> NGO."""
    from gremlin_client import route_incident

    citizen_id = payload.get("citizen_id")
    incident_id = payload.get("incident_id")
    violation_code = payload.get("violation_code")
    ngo_id = payload.get("ngo_id")

    if not all([citizen_id, incident_id, violation_code]):
        return {"success": False, "error": "citizen_id, incident_id, and violation_code are required"}

    result = await route_incident(citizen_id, incident_id, violation_code, ngo_id)
    return {"success": result["success"], "routing": result}


@app.get("/routing/traversal")
async def routing_traversal(citizen_id: str, incident_id: str, violation_code: str, ngo_id: str = ""):
    """Preview the Gremlin traversal strings without executing them."""
    from gremlin_client import build_incident_routing_traversal

    queries = build_incident_routing_traversal(
        citizen_id, incident_id, violation_code, ngo_id or None
    )
    return {"queries": queries}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("AI_SERVICE_PORT", 8001)),
        reload=True,
    )
