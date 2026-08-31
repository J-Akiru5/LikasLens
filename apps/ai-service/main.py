"""
LikasLens AI Service
Neuro-symbolic processing microservice using FastAPI, YOLOv8, and Google Generative AI
"""

import asyncio
import logging
import time
import uuid
from contextlib import asynccontextmanager
from datetime import UTC, datetime

from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from neo4j_bootstrap import build_bootstrap_queries
from graph_topology import build_seed_edges, build_seed_vertices, get_topology_config

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

    settings.log_config_summary()

    try:
        from image_analysis import load_coco_model, load_env_model
        await asyncio.to_thread(load_coco_model)
        await asyncio.to_thread(load_env_model)
        logger.info("YOLO models preloaded")
    except Exception as exc:
        logger.warning("YOLO model preload failed (will load on first request): %s", exc)

    yield

    from neo4j_client import reset_driver
    await reset_driver()
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
            "detail": str(exc),
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# API key authentication dependency
# ---------------------------------------------------------------------------

def verify_api_key(request: Request):
    """Validate X-API-Key header against the configured API key.

    - If AI_SERVICE_API_KEY is not set, all requests are allowed (development mode).
    - If set, requests must include a matching X-API-Key header or receive 401.
    """
    if not settings.ai_service_api_key:
        return  # dev mode — no key configured, allow all

    provided_key = request.headers.get("X-API-Key")
    if provided_key != settings.ai_service_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid API key. Provide a valid X-API-Key header.",
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
    if path in ("/analyze", "/analyze/base64", "/analyze/similarity", "/api/v1/chat", "/api/v1/analyze-hazard"):
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
# Roboflow integration
# ---------------------------------------------------------------------------

@app.get("/roboflow/health", dependencies=[Depends(verify_api_key)])
async def roboflow_health():
    """Check Roboflow Serverless API connectivity."""
    from roboflow_client import health_check
    return health_check()


# ---------------------------------------------------------------------------
# Image analysis
# ---------------------------------------------------------------------------

@app.post("/analyze", dependencies=[Depends(verify_api_key)])
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


@app.post("/analyze/base64", dependencies=[Depends(verify_api_key)])
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


@app.get("/analyze/model", dependencies=[Depends(verify_api_key)])
async def analyze_model_status():
    from image_analysis import ENVIRONMENTAL_KEYWORDS, _COCO_MODEL_NAME, _ENV_MODEL_NAME, get_coco_model_path, get_env_model_path

    return {
        "coco_model": _COCO_MODEL_NAME or "not loaded",
        "coco_model_path": get_coco_model_path(),
        "env_model": _ENV_MODEL_NAME or "not loaded",
        "env_model_path": get_env_model_path(),
        "known_classes": len(ENVIRONMENTAL_KEYWORDS),
    }


@app.post("/analyze/similarity", dependencies=[Depends(verify_api_key)])
async def analyze_similarity(payload: dict):
    """Find visually similar reports by comparing image embeddings.

    Request body::

        {
            "image": "<base64-encoded image>",
            "report_id": "abc-123",          // optional
            "violation_type": "solid_waste", // optional
            "threshold": 0.85                // optional, default 0.85
        }

    Response::

        {
            "success": true,
            "similar_reports": [
                {"report_id": "xyz", "similarity": 0.92, "violation_type": "illegal_dumping"}
            ],
            "embedding_stored": true
        }
    """
    import base64

    from image_similarity import (
        extract_features,
        find_similar,
        get_all_embeddings,
        store_embedding,
    )

    base64_string = payload.get("image")
    if not base64_string:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": "Missing 'image' field"},
        )

    # Strip data-URI prefix if present
    if base64_string.startswith("data:"):
        comma_pos = base64_string.find(",")
        if comma_pos != -1:
            base64_string = base64_string[comma_pos + 1 :]

    try:
        image_bytes = base64.b64decode(base64_string, validate=True)
    except Exception as exc:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": f"Invalid base64 encoding: {exc}"},
        )

    if len(image_bytes) > MAX_UPLOAD_BYTES:
        return JSONResponse(
            status_code=413,
            content={"success": False, "error": "Image too large (max 20 MB)"},
        )

    report_id = payload.get("report_id", str(uuid.uuid4()))
    violation_type = payload.get("violation_type", "unknown")
    threshold = float(payload.get("threshold", 0.85))

    try:
        embedding = await asyncio.to_thread(extract_features, image_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    # Compare against existing embeddings
    existing = await asyncio.to_thread(get_all_embeddings)
    similar = await asyncio.to_thread(find_similar, embedding, existing, threshold)

    # Store the new embedding for future comparisons
    stored = await asyncio.to_thread(store_embedding, report_id, embedding, violation_type)

    return {
        "success": True,
        "similar_reports": similar,
        "embedding_stored": stored,
    }


# ---------------------------------------------------------------------------
# Routing
# ---------------------------------------------------------------------------

@app.get("/routing/status", dependencies=[Depends(verify_api_key)])
async def routing_status():
    from neo4j_client import get_connection_params, is_configured

    params = get_connection_params()
    return {
        "configured": is_configured(),
        "uri_set": bool(params["uri"]),
        "user_set": bool(params["user"]),
    }


@app.post("/routing/incident", dependencies=[Depends(verify_api_key)])
async def route_incident_endpoint(payload: dict):
    from neo4j_client import route_incident

    citizen_id = payload.get("citizen_id")
    incident_id = payload.get("incident_id")
    violation_code = payload.get("violation_code")
    ngo_id = payload.get("ngo_id")

    if not all([citizen_id, incident_id, violation_code]):
        return {"success": False, "error": "citizen_id, incident_id, and violation_code are required"}

    result = await route_incident(citizen_id, incident_id, violation_code, ngo_id)
    return {"success": result["success"], "routing": result}


@app.get("/routing/traversal", dependencies=[Depends(verify_api_key)])
async def routing_traversal(citizen_id: str, incident_id: str, violation_code: str, ngo_id: str = ""):
    from neo4j_client import build_incident_routing_queries

    try:
        queries = await build_incident_routing_queries(
            citizen_id, incident_id, violation_code, ngo_id or None
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {"queries": queries}


@app.get("/routing/stats", dependencies=[Depends(verify_api_key)])
async def routing_stats():
    """Return learned routing performance data across all violation types."""
    from routing_learner import get_stats

    return {"success": True, "data": get_stats()}


@app.post("/routing/record-resolution", dependencies=[Depends(verify_api_key)])
async def record_resolution(payload: dict):
    """Feed the learning loop: record how long an LGU took to resolve a ticket.

    Expected body:
        {
            "violation_type": "ILLEGAL_DUMPING",
            "lgu_id": "uuid-of-ngo-group",
            "resolution_hours": 48.5
        }
    """
    from routing_learner import record_resolution

    violation_type = payload.get("violation_type")
    lgu_id = payload.get("lgu_id")
    resolution_hours = payload.get("resolution_hours")

    if not violation_type or not lgu_id or resolution_hours is None:
        raise HTTPException(
            status_code=422,
            detail="violation_type, lgu_id, and resolution_hours are required",
        )

    try:
        resolution_hours = float(resolution_hours)
    except (TypeError, ValueError):
        raise HTTPException(status_code=422, detail="resolution_hours must be a number")

    if resolution_hours < 0:
        raise HTTPException(status_code=422, detail="resolution_hours must be non-negative")

    record_resolution(violation_type, lgu_id, resolution_hours)

    return {
        "success": True,
        "message": "Resolution time recorded for routing learner",
        "data": {
            "violation_type": violation_type,
            "lgu_id": lgu_id,
            "resolution_hours": resolution_hours,
        },
    }


# ---------------------------------------------------------------------------
# Hazard analysis & chat
# ---------------------------------------------------------------------------

@app.post("/api/v1/analyze-hazard", dependencies=[Depends(verify_api_key)])
async def analyze_hazard(payload: dict):
    """Neuro-symbolic hazard analysis: Neo4j GraphRAG + Gemini LLM synthesis."""
    from hazard_analyzer import HazardRequest, HazardResponse, generate_grounded_report, retrieve_legal_context

    try:
        request = HazardRequest(**payload)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid request body: {exc}",
        )

    context = await retrieve_legal_context(request.hazard_id, request.location, request.jurisdiction)
    ai_summary = await generate_grounded_report(
        request.hazard_id,
        request.location,
        context["laws"],
        context["agencies"],
        context["method"],
    )

    return HazardResponse(
        hazard_id=request.hazard_id,
        location=request.location,
        jurisdiction=request.jurisdiction,
        violated_laws=context["laws"],
        enforcing_agencies=context["agencies"],
        retrieval_method=context["method"],
        ai_summary=ai_summary,
    )


@app.post("/api/v1/chat", dependencies=[Depends(verify_api_key)])
async def chat_proxy(payload: dict):
    """Secure chat proxy for the Liksi chatbot."""
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


# ---------------------------------------------------------------------------
# Business API routers (replaces apps/backend Laravel)
# Each router is imported and registered independently so a single broken
# router does not silently prevent all others from loading.
# ---------------------------------------------------------------------------

_router_specs = [
    ("auth",    "routers.auth",    "auth_router"),
    ("admin",   "routers.admin",   "admin_router"),
    ("reports", "routers.reports", "reports_router"),
    ("tickets", "routers.tickets", "tickets_router"),
    ("public",  "routers.public",  "public_router"),
    ("liksi",   "routers.liksi",   "liksi_router"),
]

_loaded_routers: list[str] = []

for _name, _module, _attr in _router_specs:
    try:
        _mod = __import__(_module, fromlist=[_attr])
        _router = getattr(_mod, _attr)
        app.include_router(_router)
        _loaded_routers.append(_name)
    except Exception as exc:
        logger.error(
            "Failed to load router '%s' from %s: %s",
            _name, _module, exc, exc_info=True,
        )

if _loaded_routers:
    logger.info("Business API routers loaded: %s", ", ".join(_loaded_routers))
else:
    logger.error("NO business API routers loaded — all /api/v1/* routes will 404")


@app.get("/health/models")
async def health_models():
    """Check which AI models are loaded and available."""
    from image_analysis import _COCO_MODEL_NAME, _ENV_MODEL_NAME
    return {
        "yolo_coco": bool(_COCO_MODEL_NAME),
        "yolo_env": bool(_ENV_MODEL_NAME),
        "gemini_available": settings.gemini_configured,
    }


@app.get("/health/config")
async def health_config():
    """Return per-integration config status. Never returns secret values."""
    return settings.health_config()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.ai_service_port,
    )
