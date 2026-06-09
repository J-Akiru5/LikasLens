"""
LikasLens AI Service
Neuro-symbolic processing microservice using FastAPI, YOLOv8, and Google Generative AI
"""

import asyncio
import logging
import os
import time
import uuid
from contextlib import asynccontextmanager
from datetime import UTC, datetime

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from gremlin_bootstrap import build_bootstrap_queries
from graph_topology import build_seed_edges, build_seed_vertices, get_topology_config

load_dotenv()

logger = logging.getLogger(__name__)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)

MAX_UPLOAD_BYTES = 20 * 1024 * 1024  # 20 MB

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown events."""
    logger.info("LikasLens AI Service starting...")

    try:
        from image_analysis import load_model
        await asyncio.to_thread(load_model)
        logger.info("YOLO model preloaded")
    except Exception as exc:
        logger.warning("YOLO model preload failed (will load on first request): %s", exc)

    yield

    from gremlin_client import reset_client
    reset_client()
    logger.info("LikasLens AI Service shut down")


app = FastAPI(
    title="LikasLens AI Service",
    description="Neuro-symbolic civic reporting AI microservice",
    version="0.2.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# Global exception handler — consistent JSON error responses
# ---------------------------------------------------------------------------

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all handler returning consistent JSON error format."""
    logger.error("Unhandled exception on %s %s: %s", request.method, request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "detail": str(exc) if os.getenv("APP_DEBUG", "").lower() == "true" else None,
        },
    )


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError) -> JSONResponse:
    return JSONResponse(
        status_code=400,
        content={"success": False, "error": str(exc)},
    )


@app.exception_handler(RuntimeError)
async def runtime_error_handler(request: Request, exc: RuntimeError) -> JSONResponse:
    return JSONResponse(
        status_code=502,
        content={"success": False, "error": str(exc)},
    )


# ---------------------------------------------------------------------------
# CORS — environment-driven
# ---------------------------------------------------------------------------

def _parse_cors_origins() -> list[str]:
    """Parse CORS origins from env var, falling back to localhost defaults."""
    env_origins = os.getenv("CORS_ORIGINS", "")
    if env_origins:
        return [o.strip() for o in env_origins.split(",") if o.strip()]
    return [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:8000",
    ]


app.add_middleware(
    CORSMiddleware,
    allow_origins=_parse_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request logging middleware
# ---------------------------------------------------------------------------

@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    """Log every request with timing, status, and request ID."""
    request_id = str(uuid.uuid4())[:8]
    start = time.monotonic()

    response = await call_next(request)

    elapsed_ms = (time.monotonic() - start) * 1000
    logger.info(
        "%s %s → %d (%.1fms) [%s]",
        request.method,
        request.url.path,
        response.status_code,
        elapsed_ms,
        request_id,
    )

    response.headers["X-Request-ID"] = request_id
    return response


# ---------------------------------------------------------------------------
# Rate limiting (in-memory, per-IP)
# ---------------------------------------------------------------------------

_rate_limits: dict[str, list[float]] = {}
RATE_LIMIT_WINDOW = 60.0  # seconds
RATE_LIMIT_MAX_REQUESTS = 60  # per window
RATE_LIMIT_MAX_REQUESTS_STRICT = 10  # for expensive endpoints


def _check_rate_limit(key: str, max_requests: int) -> bool:
    """Return True if request is allowed, False if rate limited."""
    now = time.monotonic()
    window_start = now - RATE_LIMIT_WINDOW

    if key not in _rate_limits:
        _rate_limits[key] = []

    # Prune old entries
    _rate_limits[key] = [t for t in _rate_limits[key] if t > window_start]

    if len(_rate_limits[key]) >= max_requests:
        return False

    _rate_limits[key].append(now)
    return True


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Apply rate limiting per IP address."""
    client_ip = request.client.host if request.client else "unknown"
    path = request.url.path

    # Strict rate limit for expensive endpoints
    if path in ("/analyze", "/analyze/base64", "/api/v1/chat", "/api/v1/analyze-hazard"):
        limit = RATE_LIMIT_MAX_REQUESTS_STRICT
    else:
        limit = RATE_LIMIT_MAX_REQUESTS

    if not _check_rate_limit(f"{client_ip}:{path}", limit):
        return JSONResponse(
            status_code=429,
            content={"success": False, "error": "Rate limit exceeded. Try again later."},
        )

    return await call_next(request)


# ---------------------------------------------------------------------------
# Health & info
# ---------------------------------------------------------------------------
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "likaslens-ai-service",
        "timestamp": datetime.now(UTC).isoformat(),
        "version": "0.2.0",
    }


@app.get("/")
async def root():
    return {
        "name": "LikasLens AI Service",
        "description": "Neuro-symbolic civic reporting AI microservice",
        "docs": "/docs",
        "health": "/health",
    }


# ---------------------------------------------------------------------------
# Graph topology
# ---------------------------------------------------------------------------

@app.get("/graph/topology")
async def graph_topology():
    topology = get_topology_config()
    return {
        "vertex_labels": topology.vertex_labels,
        "edge_labels": topology.edge_labels,
        "edge_properties": topology.edge_properties,
        "partition_key": topology.partition_key,
    }


@app.get("/graph/bootstrap-payload")
async def graph_bootstrap_payload():
    return {
        "vertices": build_seed_vertices(),
        "edges": build_seed_edges(),
    }


@app.get("/graph/bootstrap-queries")
async def graph_bootstrap_queries():
    vertices = build_seed_vertices()
    edges = build_seed_edges()
    return build_bootstrap_queries(vertices, edges)


# ---------------------------------------------------------------------------
# Image analysis
# ---------------------------------------------------------------------------

@app.post("/analyze")
async def analyze_image_upload(file: UploadFile = File(...), confidence: float = Form(0.25)):
    """Run YOLOv8 inference on an uploaded image."""
    from image_analysis import analyze_image

    image_bytes = await file.read()
    if len(image_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail=f"File too large (max {MAX_UPLOAD_BYTES // (1024*1024)}MB)")

    try:
        result = await asyncio.to_thread(analyze_image, image_bytes, confidence)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return {"success": True, "filename": file.filename, "analysis": result}


@app.post("/analyze/base64")
async def analyze_base64_image(payload: dict):
    """Run YOLOv8 inference on a base64-encoded image."""
    from image_analysis import analyze_base64

    base64_string = payload.get("image")
    confidence = payload.get("confidence", 0.25)
    if not base64_string:
        return {"success": False, "error": "Missing 'image' field"}

    try:
        result = await asyncio.to_thread(analyze_base64, base64_string, confidence)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return {"success": True, "analysis": result}


@app.get("/analyze/model")
async def analyze_model_status():
    from image_analysis import ENVIRONMENTAL_KEYWORDS, _MODEL_NAME, get_model_path

    return {
        "model": _MODEL_NAME or "not loaded",
        "model_path": get_model_path(),
        "known_classes": len(ENVIRONMENTAL_KEYWORDS),
    }


# ---------------------------------------------------------------------------
# Routing
# ---------------------------------------------------------------------------

@app.get("/routing/status")
async def routing_status():
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
    from gremlin_client import build_incident_routing_traversal

    try:
        queries = build_incident_routing_traversal(
            citizen_id, incident_id, violation_code, ngo_id or None
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {"queries": queries}


# ---------------------------------------------------------------------------
# Hazard analysis & chat
# ---------------------------------------------------------------------------

@app.post("/api/v1/analyze-hazard")
async def analyze_hazard(payload: dict):
    """Neuro-symbolic hazard analysis: Gremlin graph traversal + Gemini LLM synthesis."""
    from hazard_analyzer import HazardRequest, HazardResponse, generate_incident_summary, query_hazard_laws_and_agencies

    try:
        request = HazardRequest(**payload)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid request body: {exc}",
        )

    graph_data = await query_hazard_laws_and_agencies(request.hazard_id)
    ai_summary = await generate_incident_summary(
        request.hazard_id,
        graph_data["laws"],
        graph_data["agencies"],
    )

    return HazardResponse(
        hazard_id=request.hazard_id,
        violated_laws=graph_data["laws"],
        enforcing_agencies=graph_data["agencies"],
        ai_summary=ai_summary,
    )


@app.post("/api/v1/chat")
async def chat_proxy(payload: dict):
    """Secure chat proxy for the Likasy chatbot."""
    from chat_proxy import ChatRequest, ChatResponse, generate_chat_reply

    try:
        request = ChatRequest(**payload)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid request body: {exc}",
        )

    reply = await generate_chat_reply(request)
    return ChatResponse(reply=reply)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("AI_SERVICE_PORT", 8001)),
    )
