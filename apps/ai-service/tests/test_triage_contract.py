"""
Regression tests for the pre-submission triage endpoint.

Context: POST /api/v1/reports/triage called

    analyze_base64_async(stripped_b64, confidence=0.35)

but the function's parameter is `confidence_threshold`. The call raised
TypeError on every request, and a bare `except Exception: result = {}` swallowed
it, so the endpoint answered has_concern=False with no indicators for every
photo, in every environment. Nothing caught it because nothing asserted that the
router's call signature matched the function it calls.

These tests are deliberately cheap: they do not load YOLO or hit the network.
They assert the contract (the call the router makes is one the callee accepts)
and that the endpoint maps a result through faithfully. A signature mismatch is
exactly the class of bug that was invisible before.
"""

from __future__ import annotations

import asyncio
import inspect
import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from image_analysis import analyze_base64, analyze_base64_async  # noqa: E402
import routers.reports as reports  # noqa: E402


# ---------------------------------------------------------------------------
# The contract
# ---------------------------------------------------------------------------

def test_analyze_base64_async_accepts_confidence_threshold():
    """The keyword the router uses must exist."""
    params = inspect.signature(analyze_base64_async).parameters
    assert "confidence_threshold" in params, (
        "analyze_base64_async must accept confidence_threshold; "
        "routers/reports.py passes it by name"
    )


def test_analyze_base64_async_rejects_unknown_confidence_keyword():
    """Pins the exact mistake: `confidence=` is NOT a valid keyword."""
    params = inspect.signature(analyze_base64_async).parameters
    assert "confidence" not in params


def test_sync_and_async_signatures_agree():
    """The async wrapper should mirror the sync function it delegates to."""
    sync_params = set(inspect.signature(analyze_base64).parameters)
    async_params = set(inspect.signature(analyze_base64_async).parameters)
    assert sync_params == async_params, (
        f"sync/async signature drift: sync={sorted(sync_params)} async={sorted(async_params)}"
    )


def test_router_source_does_not_use_the_bad_keyword():
    """Source-level guard, so a future edit cannot quietly reintroduce it."""
    source = inspect.getsource(reports)
    assert "analyze_base64_async(" in source
    assert "confidence=0.35" not in source, (
        "routers/reports.py passes `confidence=`, which analyze_base64_async "
        "does not accept — use confidence_threshold="
    )


# ---------------------------------------------------------------------------
# The endpoint mapping
# ---------------------------------------------------------------------------

def test_triage_maps_a_real_result_through(monkeypatch):
    """A detection result must reach the response instead of an empty stub."""
    fake = {
        "environmental_assessment": {
            "has_environmental_concern": True,
            "indicators": [{"label": "plastic", "type": "solid_waste", "hazard_id": "illegal_dumping"}],
        },
        "composite_confidence": 0.58,
    }

    seen = {}

    async def fake_analyze(_b64, confidence_threshold=0.50):
        seen["threshold"] = confidence_threshold
        return fake

    monkeypatch.setattr("image_analysis.analyze_base64_async", fake_analyze)

    body = reports.TriageRequest(base64Image=_tiny_png_b64())
    out = asyncio.run(reports.triage_image(body))

    assert seen.get("threshold") == 0.35, "the router's intended threshold"
    assert out["success"] is True
    assert out["has_concern"] is True
    assert out["indicators"] == fake["environmental_assessment"]["indicators"]
    assert out["confidence"] == 0.58


def test_triage_degrades_safely_when_inference_raises(monkeypatch):
    """Inference failure must not 500 the citizen's pre-check."""

    async def boom(_b64, confidence_threshold=0.50):
        raise RuntimeError("model exploded")

    monkeypatch.setattr("image_analysis.analyze_base64_async", boom)

    body = reports.TriageRequest(base64Image=_tiny_png_b64())
    out = asyncio.run(reports.triage_image(body))

    assert out["success"] is True
    assert out["has_concern"] is False
    assert out["indicators"] == []


def _tiny_png_b64() -> str:
    """
    A 4x4 PNG, built with Pillow so it is guaranteed valid.

    strip_exif and downscale_image run on it for real; no model is touched
    because analyze_base64_async is monkeypatched in both callers.
    """
    import base64
    import io

    from PIL import Image

    buf = io.BytesIO()
    Image.new("RGB", (4, 4), (32, 96, 64)).save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()
