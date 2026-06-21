"""
Image similarity search module for LikasLens.
Uses YOLOv8 feature extraction to find visually similar reports.
"""

from __future__ import annotations

import json
import logging
import math
import os
from datetime import UTC, datetime
from io import BytesIO
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image, UnidentifiedImageError
from ultralytics import YOLO

logger = logging.getLogger(__name__)

# Persistent storage path for embeddings
EMBEDDINGS_DIR = Path(__file__).parent / "data"
EMBEDDINGS_FILE = EMBEDDINGS_DIR / "image_embeddings.json"


def _ensure_data_dir() -> None:
    """Create the data directory if it does not exist."""
    EMBEDDINGS_DIR.mkdir(parents=True, exist_ok=True)


def _load_embeddings() -> list[dict[str, Any]]:
    """Load existing embeddings from the JSON file."""
    _ensure_data_dir()
    if not EMBEDDINGS_FILE.exists():
        return []
    try:
        with open(EMBEDDINGS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, list):
            return data
        logger.warning("Embeddings file did not contain a list; resetting")
        return []
    except (json.JSONDecodeError, OSError) as exc:
        logger.warning("Failed to load embeddings file: %s", exc)
        return []


def _save_embeddings(embeddings: list[dict[str, Any]]) -> None:
    """Persist embeddings to the JSON file."""
    _ensure_data_dir()
    tmp_path = EMBEDDINGS_FILE.with_suffix(".tmp")
    try:
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(embeddings, f)
        tmp_path.replace(EMBEDDINGS_FILE)
    except OSError as exc:
        logger.error("Failed to save embeddings: %s", exc)
        if tmp_path.exists():
            tmp_path.unlink()
        raise


def extract_features(image_bytes: bytes) -> list[float]:
    """Extract a feature embedding from an image using YOLOv8's penultimate layer.

    Runs a forward pass through the model and captures the feature vector
    produced before the final detection head.  The resulting vector is
    normalised to unit length so cosine similarity can be computed as a
    simple dot product.
    """
    # Lazy import to avoid circular dependency with image_analysis
    from image_analysis import load_model

    try:
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
    except UnidentifiedImageError:
        raise ValueError("Invalid image format: unable to decode")
    except Exception as exc:
        raise ValueError(f"Failed to open image: {exc}") from exc

    # Resize very large images to keep feature extraction fast
    w, h = image.size
    max_pixels = 1600 * 1600
    if w * h > max_pixels:
        image.thumbnail((1600, 1600), Image.LANCZOS)

    model = load_model()

    # Run a forward pass and capture the feature map from the backbone.
    # Ultralytics YOLO models expose an `embed()` method (available in
    # ultralytics >= 8.0.196) that returns the penultimate-layer features
    # without running the detection head.  This is the cleanest way to
    # obtain a fixed-length embedding.
    try:
        results = model.predict(image, verbose=False)
        # Attempt to use the newer embed() API first
        try:
            features = model.embed(image, verbose=False)
            if features is not None and len(features) > 0:
                # features is a list of tensors; take the last (highest-level) one
                feat_tensor = features[-1]
                embedding = feat_tensor.cpu().numpy().flatten().tolist()
            else:
                raise AttributeError("embed() returned empty")
        except (AttributeError, TypeError):
            # Fallback: use the raw output of the model (detections tensor)
            # and global-average-pool it into a fixed-length vector.
            logger.info("Using fallback feature extraction via detection output")
            if results and len(results) > 0 and results[0].boxes is not None:
                boxes = results[0].boxes
                if hasattr(boxes, "data") and boxes.data is not None:
                    raw = boxes.data.cpu().numpy()
                    if raw.shape[0] > 0:
                        # Each detection is [x1, y1, x2, y2, conf, cls, ...]
                        # Use the class-confidence distribution as a feature vector
                        num_classes = model.model.nc if hasattr(model.model, "nc") else 80
                        feat = np.zeros(num_classes, dtype=np.float64)
                        for det in raw:
                            cls_id = int(det[5].item()) if det.shape[0] > 5 else 0
                            conf = float(det[4].item()) if det.shape[0] > 4 else 0
                            if 0 <= cls_id < num_classes:
                                feat[cls_id] += conf
                        embedding = feat.tolist()
                    else:
                        embedding = [0.0] * 80
                else:
                    embedding = [0.0] * 80
            else:
                embedding = [0.0] * 80
    except RuntimeError as exc:
        if "out of memory" in str(exc).lower():
            raise RuntimeError("Feature extraction failed: GPU out of memory") from exc
        raise RuntimeError(f"Feature extraction failed: {exc}") from exc
    except Exception as exc:
        raise RuntimeError(f"Feature extraction failed: {exc}") from exc

    # L2-normalise so cosine similarity becomes a dot product
    norm = math.sqrt(sum(v * v for v in embedding))
    if norm > 0:
        embedding = [v / norm for v in embedding]

    return embedding


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two feature vectors.

    Both vectors are assumed to already be L2-normalised.  The result is
    clamped to [-1, 1] to guard against floating-point drift.
    """
    if len(a) != len(b):
        # Pad the shorter vector with zeros so comparison still works
        max_len = max(len(a), len(b))
        a = a + [0.0] * (max_len - len(a))
        b = b + [0.0] * (max_len - len(b))

    dot = sum(x * y for x, y in zip(a, b))
    return max(-1.0, min(1.0, dot))


def find_similar(
    embedding: list[float],
    existing_embeddings: list[dict[str, Any]],
    threshold: float = 0.85,
) -> list[dict[str, Any]]:
    """Find reports whose embeddings are above *threshold* similarity.

    Returns a list sorted by descending similarity, each entry containing
    ``report_id``, ``similarity``, ``violation_type``, and ``created_at``.
    """
    results: list[dict[str, Any]] = []

    for entry in existing_embeddings:
        existing_emb = entry.get("embedding")
        if not existing_emb or not isinstance(existing_emb, list):
            continue

        sim = cosine_similarity(embedding, existing_emb)
        if sim >= threshold:
            results.append({
                "report_id": entry.get("report_id", "unknown"),
                "similarity": round(sim, 4),
                "violation_type": entry.get("violation_type", "unknown"),
                "created_at": entry.get("created_at", ""),
            })

    results.sort(key=lambda x: x["similarity"], reverse=True)
    return results


def store_embedding(
    report_id: str,
    embedding: list[float],
    violation_type: str = "unknown",
) -> bool:
    """Append a new embedding entry to the persistent store.

    Returns ``True`` on success, ``False`` on failure.
    """
    existing = _load_embeddings()
    entry = {
        "report_id": report_id,
        "embedding": embedding,
        "violation_type": violation_type,
        "created_at": datetime.now(UTC).isoformat(),
    }
    existing.append(entry)
    try:
        _save_embeddings(existing)
        return True
    except Exception:
        return False


def get_all_embeddings() -> list[dict[str, Any]]:
    """Return all stored embeddings."""
    return _load_embeddings()
