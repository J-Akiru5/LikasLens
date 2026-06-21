"""
YOLOv8 image analysis module for LikasLens.
Provides environmental violation detection using pre-trained YOLO models.

Supports dual-model detection:
- COCO model (yolov8n.pt) for general object detection
- Optional environmental model (waste/deforestation/fire) via ENV_MODEL_PATH
"""

from __future__ import annotations

import base64
import json
import logging
import os
import time
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image, UnidentifiedImageError
from ultralytics import YOLO

logger = logging.getLogger(__name__)

_COCO_MODEL: YOLO | None = None
_ENV_MODEL: YOLO | None = None
_COCO_MODEL_NAME: str = ""
_ENV_MODEL_NAME: str = ""
_ENV_MODEL_FAILED: bool = False

MAX_IMAGE_BYTES = 20 * 1024 * 1024  # 20 MB
MAX_PIXELS = 4000 * 4000  # 16 MP

# ---------------------------------------------------------------------------
# COCO class mapping (80 classes)
# ---------------------------------------------------------------------------
ENVIRONMENTAL_KEYWORDS: dict[int, str] = {
    0: "person", 1: "bicycle", 2: "car", 3: "motorcycle", 4: "airplane",
    5: "bus", 6: "train", 7: "truck", 8: "boat", 9: "traffic light",
    10: "fire hydrant", 11: "stop sign", 12: "parking meter", 13: "bench",
    14: "bird", 15: "cat", 16: "dog", 17: "horse", 18: "sheep", 19: "cow",
    20: "elephant", 21: "bear", 22: "zebra", 23: "giraffe", 24: "backpack",
    25: "umbrella", 26: "handbag", 27: "tie", 28: "suitcase", 29: "frisbee",
    30: "skis", 31: "snowboard", 32: "sports ball", 33: "kite",
    34: "baseball bat", 35: "baseball glove", 36: "skateboard",
    37: "surfboard", 38: "tennis racket", 39: "bottle", 40: "wine glass",
    41: "cup", 42: "fork", 43: "knife", 44: "spoon", 45: "bowl",
    46: "banana", 47: "apple", 48: "sandwich", 49: "orange", 50: "broccoli",
    51: "carrot", 52: "hot dog", 53: "pizza", 54: "donut", 55: "cake",
    56: "chair", 57: "couch", 58: "potted plant", 59: "bed", 60: "dining table",
    61: "toilet", 62: "tv", 63: "laptop", 64: "mouse", 65: "remote",
    66: "keyboard", 67: "cell phone", 68: "microwave", 69: "oven",
    70: "toaster", 71: "sink", 72: "refrigerator", 73: "book", 74: "clock",
    75: "vase", 76: "scissors", 77: "teddy bear", 78: "hair drier",
    79: "toothbrush",
}

# ---------------------------------------------------------------------------
# Environmental indicator mapping (COCO-based heuristics)
# Only includes objects that genuinely indicate environmental violations
# ---------------------------------------------------------------------------
ENVIRONMENTAL_INDICATORS: list[dict[str, Any]] = [
    {
        "classes": [39],  # bottle only — removed food items to prevent false positives
        "label": "Bottle (potential litter)",
        "type": "solid_waste",
        "severity": "medium",
        "hazard_id": "illegal_dumping",
    },
    {
        "classes": [1, 2, 3, 5, 6, 7, 8],
        "label": "Vehicle / Traffic",
        "type": "vehicle",
        "severity": "low",
        "hazard_id": None,
    },
    {
        "classes": [61],
        "label": "Sanitation Issue",
        "type": "sanitation",
        "severity": "medium",
        "hazard_id": None,
    },
    {
        "classes": [58],
        "label": "Vegetation / Greenery",
        "type": "vegetation",
        "severity": "low",
        "hazard_id": None,
    },
    {
        "classes": [10, 11, 12],
        "label": "Infrastructure",
        "type": "infrastructure",
        "severity": "low",
        "hazard_id": None,
    },
    {
        "classes": [14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
        "label": "Wildlife Detected",
        "type": "wildlife",
        "severity": "info",
        "hazard_id": None,
    },
]

# Environmental model class mapping (for custom-trained models)
# These map class IDs from community environmental models to our hazard types
ENV_MODEL_CLASS_MAP: dict[str, dict[str, Any]] = {
    # Waste detection models (HrutikAdsare/waste-detection-yolov8 classes)
    "cardboard": {"type": "solid_waste", "severity": "medium", "hazard_id": "illegal_dumping"},
    "e-waste": {"type": "hazardous_waste", "severity": "critical", "hazard_id": "chemical_spill"},
    "glass": {"type": "solid_waste", "severity": "medium", "hazard_id": "illegal_dumping"},
    "medical": {"type": "hazardous_waste", "severity": "critical", "hazard_id": "chemical_spill"},
    "metal": {"type": "solid_waste", "severity": "medium", "hazard_id": "illegal_dumping"},
    "organic": {"type": "solid_waste", "severity": "low", "hazard_id": "illegal_dumping"},
    "paper": {"type": "solid_waste", "severity": "low", "hazard_id": "illegal_dumping"},
    "plastic": {"type": "solid_waste", "severity": "medium", "hazard_id": "illegal_dumping"},
    # Generic waste detection classes
    "trash": {"type": "solid_waste", "severity": "high", "hazard_id": "illegal_dumping"},
    "litter": {"type": "solid_waste", "severity": "medium", "hazard_id": "illegal_dumping"},
    "garbage": {"type": "solid_waste", "severity": "high", "hazard_id": "illegal_dumping"},
    "waste": {"type": "solid_waste", "severity": "high", "hazard_id": "illegal_dumping"},
    "bottle": {"type": "solid_waste", "severity": "low", "hazard_id": "illegal_dumping"},
    "can": {"type": "solid_waste", "severity": "low", "hazard_id": "illegal_dumping"},
    "bag": {"type": "solid_waste", "severity": "low", "hazard_id": "illegal_dumping"},
    # Fire/smoke detection models
    "fire": {"type": "open_burning", "severity": "critical", "hazard_id": "open_burning"},
    "smoke": {"type": "air_pollution", "severity": "high", "hazard_id": "open_burning"},
    "smog": {"type": "air_pollution", "severity": "high", "hazard_id": "open_burning"},
    # Deforestation models
    "deforestation": {"type": "habitat_destruction", "severity": "critical", "hazard_id": "illegal_logging"},
    "cleared_land": {"type": "habitat_destruction", "severity": "high", "hazard_id": "illegal_logging"},
    "burned_area": {"type": "habitat_destruction", "severity": "critical", "hazard_id": "illegal_logging"},
    # Water pollution models
    "oil_spill": {"type": "water_pollution", "severity": "critical", "hazard_id": "oil_spill"},
    "oil": {"type": "water_pollution", "severity": "high", "hazard_id": "oil_spill"},
    "polluted_water": {"type": "water_pollution", "severity": "high", "hazard_id": "oil_spill"},
    "dead_fish": {"type": "water_pollution", "severity": "high", "hazard_id": "oil_spill"},
}


def get_coco_model_path() -> str:
    """Return path to COCO YOLO model."""
    custom = os.getenv("YOLO_MODEL_PATH", "")
    if custom and Path(custom).exists():
        return custom
    return "yolov8n.pt"


def get_env_model_path() -> str | None:
    """Return path to environmental model, or None if not configured."""
    path = os.getenv("ENV_MODEL_PATH", "")
    if path and Path(path).exists():
        return path
    return None


def load_coco_model() -> YOLO:
    """Load (or return cached) COCO YOLO model."""
    global _COCO_MODEL, _COCO_MODEL_NAME
    if _COCO_MODEL is not None:
        return _COCO_MODEL

    model_path = get_coco_model_path()
    logger.info("Loading COCO YOLO model: %s", model_path)
    _COCO_MODEL = YOLO(model_path)
    _COCO_MODEL_NAME = Path(model_path).stem
    logger.info("COCO model loaded: %s", _COCO_MODEL_NAME)
    return _COCO_MODEL


def load_env_model() -> YOLO | None:
    """Load (or return cached) environmental YOLO model. Returns None if unavailable."""
    global _ENV_MODEL, _ENV_MODEL_NAME, _ENV_MODEL_FAILED
    if _ENV_MODEL_FAILED:
        return None
    if _ENV_MODEL is not None:
        return _ENV_MODEL

    model_path = get_env_model_path()
    if not model_path:
        logger.info("No ENV_MODEL_PATH set - using COCO-only detection")
        return None

    try:
        logger.info("Loading environmental YOLO model: %s", model_path)
        _ENV_MODEL = YOLO(model_path)
        _ENV_MODEL_NAME = Path(model_path).stem
        logger.info("Environmental model loaded: %s", _ENV_MODEL_NAME)
        return _ENV_MODEL
    except Exception as exc:
        logger.warning("Failed to load environmental model (%s): %s. Falling back to COCO-only.", model_path, exc)
        _ENV_MODEL_FAILED = True
        return None


def _merge_detections(
    coco_detections: list[dict[str, Any]],
    env_detections: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Merge COCO and environmental model detections, deduplicating overlapping bboxes."""
    if not env_detections:
        return coco_detections

    merged = list(coco_detections)

    for env_det in env_detections:
        is_duplicate = False
        for coco_det in coco_detections:
            if coco_det["label"] == env_det["label"]:
                iou = _compute_iou(coco_det["bbox"], env_det["bbox"])
                if iou > 0.5:
                    is_duplicate = True
                    if env_det["confidence"] > coco_det["confidence"]:
                        merged.remove(coco_det)
                        merged.append(env_det)
                    break

        if not is_duplicate:
            merged.append(env_det)

    return merged


def _compute_iou(bbox1: list[float], bbox2: list[float]) -> float:
    """Compute Intersection over Union for two bounding boxes [x1, y1, x2, y2]."""
    x1 = max(bbox1[0], bbox2[0])
    y1 = max(bbox1[1], bbox2[1])
    x2 = min(bbox1[2], bbox2[2])
    y2 = min(bbox1[3], bbox2[3])

    intersection = max(0, x2 - x1) * max(0, y2 - y1)
    if intersection == 0:
        return 0.0

    area1 = (bbox1[2] - bbox1[0]) * (bbox1[3] - bbox1[1])
    area2 = (bbox2[2] - bbox2[0]) * (bbox2[3] - bbox2[1])
    union = area1 + area2 - intersection

    return intersection / union if union > 0 else 0.0


def classify_environmental_risk(detections: list[dict[str, Any]]) -> dict[str, Any]:
    """Analyze detections for environmental violation indicators."""
    detected_classes = {d["class_id"] for d in detections}
    matched_indicators = []

    # Check COCO-based indicators
    for indicator in ENVIRONMENTAL_INDICATORS:
        overlap = detected_classes & set(indicator["classes"])
        if overlap:
            matched_indicators.append({
                "label": indicator["label"],
                "type": indicator["type"],
                "severity": indicator.get("severity", "medium"),
                "hazard_id": indicator.get("hazard_id"),
                "matched_objects": [
                    ENVIRONMENTAL_KEYWORDS.get(c, f"class_{c}") for c in overlap
                ],
                "source": "coco",
            })

    # Check environmental model detections
    for det in detections:
        if det.get("source") == "env_model":
            label_lower = det["label"].lower().replace(" ", "_")
            if label_lower in ENV_MODEL_CLASS_MAP:
                mapping = ENV_MODEL_CLASS_MAP[label_lower]
                matched_indicators.append({
                    "label": det["label"],
                    "type": mapping["type"],
                    "severity": mapping["severity"],
                    "hazard_id": mapping["hazard_id"],
                    "matched_objects": [det["label"]],
                    "source": "env_model",
                    "confidence": det["confidence"],
                })

    # Determine if there's a genuine environmental concern
    high_severity_types = {"solid_waste", "sanitation", "open_burning", "air_pollution",
                           "water_pollution", "habitat_destruction"}
    has_violation = any(
        ind["type"] in high_severity_types and ind.get("severity") in ("high", "critical")
        for ind in matched_indicators
    )

    # Collect unique hazard IDs for routing
    hazard_ids = list({ind["hazard_id"] for ind in matched_indicators if ind.get("hazard_id")})

    return {
        "has_environmental_concern": has_violation,
        "indicators": matched_indicators,
        "hazard_ids": hazard_ids,
        "total_objects_detected": len(detections),
    }


def compute_composite_score(
    coco_conf: float,
    env_conf: float,
    has_model_agreement: bool,
) -> float:
    """Unified confidence: max(coco_conf, env_conf) * 0.7 + agreement_bonus * 0.3.

    agreement_bonus = 1.0 if both COCO and env model agree on a hazard, else 0.0.
    Returns a score between 0.0 and 1.0.
    """
    base = max(coco_conf, env_conf) * 0.7
    agreement_bonus = 1.0 if has_model_agreement else 0.0
    return round(base + agreement_bonus * 0.3, 4)


def triage_disposition(composite_score: float) -> str:
    """Three-tier gate: >= 0.70 auto_route, 0.40-0.69 pending_review, < 0.40 auto_dismiss."""
    if composite_score >= 0.70:
        return "auto_routed"
    if composite_score >= 0.40:
        return "pending_review"
    return "auto_dismissed"


def analyze_image(image_bytes: bytes, confidence_threshold: float = 0.50) -> dict[str, Any]:
    """Run YOLOv8 inference on image bytes and return structured results."""
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise ValueError(
            f"Image too large: {len(image_bytes)} bytes (max {MAX_IMAGE_BYTES})"
        )

    try:
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
    except UnidentifiedImageError:
        raise ValueError("Invalid image format: unable to decode")
    except Exception as exc:
        raise ValueError(f"Failed to open image: {exc}") from exc

    w, h = image.size
    if w * h > MAX_PIXELS:
        image.thumbnail((4000, 4000), Image.LANCZOS)
        logger.info("Resized image from %dx%d to %dx%d", w, h, *image.size)

    coco_model = load_coco_model()
    env_model = load_env_model()

    # COCO inference
    started = time.perf_counter()
    try:
        coco_results = coco_model(image, conf=confidence_threshold)
    except RuntimeError as exc:
        if "out of memory" in str(exc).lower():
            raise RuntimeError("YOLO inference failed: GPU out of memory") from exc
        raise RuntimeError(f"YOLO inference failed: {exc}") from exc
    except Exception as exc:
        raise RuntimeError(f"YOLO inference failed: {exc}") from exc

    detections = []
    for result in coco_results:
        if result.boxes is None:
            continue
        for box, conf, cls_id in zip(result.boxes.xyxy, result.boxes.conf, result.boxes.cls):
            class_id = int(cls_id.item())
            confidence = float(conf.item())
            x1, y1, x2, y2 = [float(v) for v in box.tolist()]
            detections.append({
                "class_id": class_id,
                "label": ENVIRONMENTAL_KEYWORDS.get(class_id, f"unknown_{class_id}"),
                "confidence": round(confidence, 4),
                "bbox": [round(x1, 1), round(y1, 1), round(x2, 1), round(y2, 1)],
                "source": "coco",
            })

    # Environmental model inference (if available)
    env_detections = []
    if env_model is not None:
        try:
            env_results = env_model(image, conf=confidence_threshold)
            for result in env_results:
                if result.boxes is None:
                    continue
                for box, conf, cls_id in zip(result.boxes.xyxy, result.boxes.conf, result.boxes.cls):
                    class_id = int(cls_id.item())
                    confidence = float(conf.item())
                    x1, y1, x2, y2 = [float(v) for v in box.tolist()]
                    class_name = result.names.get(class_id, f"class_{class_id}")
                    env_detections.append({
                        "class_id": class_id,
                        "label": class_name,
                        "confidence": round(confidence, 4),
                        "bbox": [round(x1, 1), round(y1, 1), round(x2, 1), round(y2, 1)],
                        "source": "env_model",
                    })
        except Exception as exc:
            logger.warning("Environmental model inference failed: %s", exc)

    latency_ms = round((time.perf_counter() - started) * 1000, 2)

    # Roboflow Serverless API inference (if configured)
    roboflow_detections: list[dict[str, Any]] = []
    try:
        from roboflow_client import detect_from_bytes, is_configured, normalize_predictions

        if is_configured():
            raw = detect_from_bytes(image_bytes, confidence=confidence_threshold)
            roboflow_detections = normalize_predictions(raw)
            logger.info(
                "Roboflow returned %d detections in %.1f ms",
                len(roboflow_detections),
                raw.get("latency_ms", 0),
            )
    except RuntimeError as exc:
        logger.warning("Roboflow inference skipped: %s", exc)
    except Exception as exc:
        logger.warning("Roboflow inference unexpected error: %s", exc)

    # Merge all detection sources
    merged_detections = _merge_detections(detections, env_detections)
    merged_detections = _merge_detections(merged_detections, roboflow_detections)
    env_assessment = classify_environmental_risk(merged_detections)

    _record_metrics(latency_ms, merged_detections, env_assessment, _COCO_MODEL_NAME)

    model_info = _COCO_MODEL_NAME
    if _ENV_MODEL_NAME:
        model_info = f"{_COCO_MODEL_NAME}+{_ENV_MODEL_NAME}"

    # Compute composite confidence score
    coco_max = max((d["confidence"] for d in detections), default=0.0)
    env_max = max((d["confidence"] for d in env_detections), default=0.0)
    has_agreement = bool(env_detections) and env_assessment.get("has_environmental_concern", False)
    composite = compute_composite_score(coco_max, env_max, has_agreement)
    disposition = triage_disposition(composite)

    return {
        "model": model_info,
        "detections": merged_detections[:50],
        "detection_count": len(merged_detections),
        "environmental_assessment": env_assessment,
        "composite_confidence": composite,
        "triage_disposition": disposition,
        "latency_ms": latency_ms,
        "models_used": {
            "coco": _COCO_MODEL_NAME,
            "environmental": _ENV_MODEL_NAME or "none",
        },
    }


def analyze_base64(base64_string: str, confidence_threshold: float = 0.50) -> dict[str, Any]:
    """Analyze a base64-encoded image."""
    if len(base64_string) > MAX_IMAGE_BYTES * 2:
        raise ValueError("Base64 payload too large")
    try:
        image_bytes = base64.b64decode(base64_string, validate=True)
    except Exception as exc:
        raise ValueError(f"Invalid base64 encoding: {exc}") from exc
    return analyze_image(image_bytes, confidence_threshold)


def _record_metrics(
    latency_ms: float,
    detections: list[dict[str, Any]],
    env_assessment: dict[str, Any],
    model_name: str,
) -> None:
    """Opt-in JSONL metrics logger. Enabled by setting LIKASLENS_METRICS_LOG.

    Disabled by default to keep the inference hot path free of filesystem I/O.
    See INFERENCE_METRICS.md for the schema and how to run eval_metrics.py.
    """
    log_path = os.getenv("LIKASLENS_METRICS_LOG", "").strip()
    if not log_path:
        return
    try:
        record = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "latency_ms": latency_ms,
            "model": model_name,
            "detection_count": len(detections),
            "classes": sorted({d["class_id"] for d in detections}),
            "max_confidence": round(max((d["confidence"] for d in detections), default=0.0), 4),
            "has_environmental_concern": env_assessment.get("has_environmental_concern", False),
        }
        with open(log_path, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(record) + "\n")
    except OSError as exc:
        logger.warning("Metrics log write failed: %s", exc)
