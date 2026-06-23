"""
Roboflow Serverless Inference client for LikasLens.

Uses raw HTTP via `requests` (not the `inference` SDK) for Python 3.13+ compatibility.
Calls the Roboflow Serverless API at https://serverless.roboflow.com/{model_id}
"""

from __future__ import annotations

import logging
import os
import time
from typing import Any

import requests

logger = logging.getLogger(__name__)

ROBOFLOW_API_URL = "https://serverless.roboflow.com"

# Retry configuration for transient failures
_MAX_RETRIES = 3
_BACKOFF_BASE = 1.0  # seconds


def _get_config() -> tuple[str, str]:
    """Return (api_key, model_id) from env vars. Raises if not configured."""
    api_key = os.getenv("ROBOFLOW_API_KEY", "").strip()
    model_id = os.getenv("ROBOFLOW_MODEL_ID", "").strip()
    if not api_key:
        raise ValueError("ROBOFLOW_API_KEY is not set in environment")
    if not model_id:
        raise ValueError("ROBOFLOW_MODEL_ID is not set in environment")
    return api_key, model_id


def is_configured() -> bool:
    """Return True if both ROBOFLOW_API_KEY and ROBOFLOW_MODEL_ID are set."""
    return bool(os.getenv("ROBOFLOW_API_KEY", "").strip()) and bool(
        os.getenv("ROBOFLOW_MODEL_ID", "").strip()
    )


def health_check() -> dict[str, Any]:
    """Ping the Roboflow serverless endpoint to verify connectivity.

    Returns a dict with status info suitable for a health endpoint.
    """
    api_key, model_id = _get_config()
    url = f"{ROBOFLOW_API_URL}/{model_id}"
    try:
        resp = requests.get(url, params={"api_key": api_key}, timeout=10)
        # The serverless endpoint returns various codes:
        # - 200: OK (unlikely on GET)
        # - 400: Missing Content-Type (expected for GET — means endpoint is reachable)
        # - 404: Not found on GET (means model exists, just doesn't accept GET)
        # - 405: Method not allowed (means model exists)
        if resp.status_code in (200, 400, 404, 405):
            return {
                "status": "ok",
                "model": model_id,
                "roboflow_connected": True,
                "http_status": resp.status_code,
            }
        if resp.status_code == 401:
            return {
                "status": "error",
                "model": model_id,
                "roboflow_connected": False,
                "error": "Invalid API key (401 Unauthorized)",
            }
        return {
            "status": "error",
            "model": model_id,
            "roboflow_connected": False,
            "error": f"Unexpected HTTP {resp.status_code}",
        }
    except requests.ConnectionError:
        return {
            "status": "error",
            "model": model_id,
            "roboflow_connected": False,
            "error": "Cannot reach Roboflow API (connection refused or DNS failure)",
        }
    except requests.Timeout:
        return {
            "status": "error",
            "model": model_id,
            "roboflow_connected": False,
            "error": "Roboflow API timed out",
        }
    except Exception as exc:
        return {
            "status": "error",
            "model": model_id,
            "roboflow_connected": False,
            "error": str(exc),
        }


def detect_from_bytes(
    image_bytes: bytes,
    confidence: float = 0.25,
) -> dict[str, Any]:
    """Send image bytes to Roboflow Serverless API and return detections.

    Returns a dict with:
      - predictions: list of bounding-box detections
      - latency_ms: request time in milliseconds
      - model: the model_id used

    Retries up to 3 times with exponential backoff on transient errors
    (ConnectionError, Timeout, 5xx). Raises RuntimeError on persistent
    failures so callers can fall back gracefully.
    """
    api_key, model_id = _get_config()
    url = f"{ROBOFLOW_API_URL}/{model_id}"
    last_exc: Exception | None = None

    for attempt in range(_MAX_RETRIES):
        try:
            resp = requests.post(
                url,
                params={"api_key": api_key, "confidence": confidence},
                files={"image": ("image.jpg", image_bytes, "image/jpeg")},
                timeout=30,
            )
        except requests.ConnectionError as exc:
            last_exc = exc
            if attempt < _MAX_RETRIES - 1:
                wait = _BACKOFF_BASE * (2 ** attempt)
                logger.warning("Roboflow connection error (attempt %d/%d), retrying in %.1fs: %s",
                               attempt + 1, _MAX_RETRIES, wait, exc)
                time.sleep(wait)
                continue
            raise RuntimeError(
                f"Roboflow API unreachable after {_MAX_RETRIES} attempts — falling back to COCO-only: {exc}"
            ) from exc
        except requests.Timeout as exc:
            last_exc = exc
            if attempt < _MAX_RETRIES - 1:
                wait = _BACKOFF_BASE * (2 ** attempt)
                logger.warning("Roboflow timeout (attempt %d/%d), retrying in %.1fs: %s",
                               attempt + 1, _MAX_RETRIES, wait, exc)
                time.sleep(wait)
                continue
            raise RuntimeError(
                f"Roboflow API timed out after {_MAX_RETRIES} attempts — falling back to COCO-only: {exc}"
            ) from exc

        # Non-retryable auth/not-found errors
        if resp.status_code == 401:
            raise RuntimeError(
                "Roboflow API rejected the request (401 Unauthorized). "
                "Check ROBOFLOW_API_KEY in .env."
            )

        if resp.status_code == 404:
            raise RuntimeError(
                f"Roboflow model not found (404): {model_id}. "
                "Check ROBOFLOW_MODEL_ID in .env."
            )

        # Retry on 5xx server errors
        if resp.status_code >= 500:
            last_exc = RuntimeError(f"Roboflow server error: HTTP {resp.status_code}")
            if attempt < _MAX_RETRIES - 1:
                wait = _BACKOFF_BASE * (2 ** attempt)
                logger.warning("Roboflow server error %d (attempt %d/%d), retrying in %.1fs",
                               resp.status_code, attempt + 1, _MAX_RETRIES, wait)
                time.sleep(wait)
                continue
            raise RuntimeError(
                f"Roboflow API error after {_MAX_RETRIES} attempts: HTTP {resp.status_code}"
            )

        # Other 4xx errors are not retryable
        if resp.status_code >= 400:
            raise RuntimeError(
                f"Roboflow API error: HTTP {resp.status_code} — {resp.text[:300]}"
            )

        # Success
        data = resp.json()
        return {
            "predictions": data.get("predictions", []),
            "latency_ms": data.get("inference_ms", 0),
            "model": model_id,
            "image_width": data.get("image", {}).get("width", 0),
            "image_height": data.get("image", {}).get("height", 0),
        }

    # Should not reach here, but just in case
    raise RuntimeError(
        f"Roboflow API failed after {_MAX_RETRIES} attempts: {last_exc}"
    ) from last_exc


def normalize_predictions(raw: dict[str, Any]) -> list[dict[str, Any]]:
    """Convert Roboflow prediction format to LikasLens detection format.

    Roboflow returns:
      {
        "predictions": [
          {
            "x": center_x, "y": center_y,
            "width": w, "height": h,
            "class": "Plastic",
            "confidence": 0.85,
            "class_id": 0,
          }
        ]
      }

    We convert to:
      {
        "class_id": int,
        "label": str,
        "confidence": float,
        "bbox": [x1, y1, x2, y2],
        "source": "roboflow",
      }
    """
    detections: list[dict[str, Any]] = []

    for pred in raw.get("predictions", []):
        cx = pred.get("x", 0)
        cy = pred.get("y", 0)
        w = pred.get("width", 0)
        h = pred.get("height", 0)

        # Convert center-format to corner-format [x1, y1, x2, y2]
        x1 = round(cx - w / 2, 1)
        y1 = round(cy - h / 2, 1)
        x2 = round(cx + w / 2, 1)
        y2 = round(cy + h / 2, 1)

        detections.append(
            {
                "class_id": pred.get("class_id", -1),
                "label": pred.get("class", "unknown"),
                "confidence": round(pred.get("confidence", 0), 4),
                "bbox": [x1, y1, x2, y2],
                "source": "roboflow",
            }
        )

    return detections
