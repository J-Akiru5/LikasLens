"""
YOLOv8 image analysis module for LikasLens.
Provides environmental violation detection using pre-trained YOLO models.
"""

from __future__ import annotations

import base64
import logging
import os
from io import BytesIO
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image
from ultralytics import YOLO

logger = logging.getLogger(__name__)

_MODEL: YOLO | None = None
_MODEL_NAME: str = ""

# Environmental violation categories mapped from COCO / custom classes
ENVIRONMENTAL_KEYWORDS: dict[int, str] = {
    # These COCO classes are relevant to environmental violations
    0: "person",
    1: "bicycle",
    2: "car",
    3: "motorcycle",
    4: "airplane",
    5: "bus",
    6: "train",
    7: "truck",
    8: "boat",
    9: "traffic light",
    10: "fire hydrant",
    13: "stop sign",
    14: "parking meter",
    15: "bench",
    16: "bird",
    17: "cat",
    18: "dog",
    19: "horse",
    20: "sheep",
    21: "cow",
    22: "elephant",
    23: "bear",
    24: "zebra",
    25: "giraffe",
    27: "backpack",
    28: "umbrella",
    31: "handbag",
    32: "tie",
    33: "suitcase",
    39: "bottle",
    40: "wine glass",
    41: "cup",
    42: "fork",
    43: "knife",
    44: "spoon",
    45: "bowl",
    46: "banana",
    47: "apple",
    48: "sandwich",
    49: "orange",
    50: "broccoli",
    51: "carrot",
    52: "hot dog",
    53: "pizza",
    54: "donut",
    55: "cake",
    56: "chair",
    57: "couch",
    58: "potted plant",
    59: "bed",
    60: "dining table",
    61: "toilet",
    62: "tv",
    63: "laptop",
    64: "mouse",
    65: "remote",
    66: "keyboard",
    67: "cell phone",
    73: "book",
    74: "clock",
    75: "vase",
    76: "scissors",
    77: "teddy bear",
    78: "hair drier",
    79: "toothbrush",
}

# Custom environmental violation flags based on detected objects
ENVIRONMENTAL_INDICATORS: list[dict[str, Any]] = [
    {"classes": [39, 41, 44, 45, 46, 47, 48, 49, 52, 53, 54, 55], "label": "Litter / Waste", "type": "solid_waste"},
    {"classes": [1, 2, 3, 5, 6, 7, 8], "label": "Vehicle / Traffic", "type": "vehicle"},
    {"classes": [61], "label": "Sanitation Issue", "type": "sanitation"},
    {"classes": [58], "label": "Vegetation / Greenery", "type": "vegetation"},
    {"classes": [10, 13, 14], "label": "Infrastructure", "type": "infrastructure"},
]


def get_model_path() -> str:
    """Return path to YOLO model, downloading if needed."""
    custom_model = os.getenv("YOLO_MODEL_PATH", "")
    if custom_model and Path(custom_model).exists():
        return custom_model
    return "yolov8n.pt"


def load_model() -> YOLO:
    """Load (or return cached) YOLO model."""
    global _MODEL, _MODEL_NAME
    if _MODEL is not None:
        return _MODEL

    model_path = get_model_path()
    logger.info("Loading YOLO model: %s", model_path)
    _MODEL = YOLO(model_path)
    _MODEL_NAME = Path(model_path).stem
    logger.info("YOLO model loaded: %s", _MODEL_NAME)
    return _MODEL


def classify_environmental_risk(detections: list[dict[str, Any]]) -> dict[str, Any]:
    """Analyze detections for environmental violation indicators."""
    detected_classes = {d["class_id"] for d in detections}
    matched_indicators = []

    for indicator in ENVIRONMENTAL_INDICATORS:
        overlap = detected_classes & set(indicator["classes"])
        if overlap:
            matched_indicators.append({
                "label": indicator["label"],
                "type": indicator["type"],
                "matched_objects": [
                    ENVIRONMENTAL_KEYWORDS.get(c, f"class_{c}") for c in overlap
                ],
            })

    has_violation = any(
        ind["type"] in ("solid_waste", "sanitation")
        for ind in matched_indicators
    )

    return {
        "has_environmental_concern": has_violation,
        "indicators": matched_indicators,
        "total_objects_detected": len(detections),
    }


def analyze_image(image_bytes: bytes, confidence_threshold: float = 0.25) -> dict[str, Any]:
    """Run YOLOv8 inference on image bytes and return structured results."""
    model = load_model()

    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    results = model(image, conf=confidence_threshold)

    detections = []
    for result in results:
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
            })

    env_assessment = classify_environmental_risk(detections)

    return {
        "model": _MODEL_NAME,
        "detections": detections[:50],
        "detection_count": len(detections),
        "environmental_assessment": env_assessment,
    }


def analyze_base64(base64_string: str, confidence_threshold: float = 0.25) -> dict[str, Any]:
    """Analyze a base64-encoded image."""
    image_bytes = base64.b64decode(base64_string)
    return analyze_image(image_bytes, confidence_threshold)
