"""
Regression tests for classify_environmental_risk().

Context: `has_environmental_concern` was computed from an allow-list of hazard
types that omitted `hazardous_waste`. ENV_MODEL_CLASS_MAP maps "e-waste" and
"medical" to `hazardous_waste` at severity "critical", so the worst detections
the environmental model can produce still answered has_environmental_concern=
False. These tests pin the corrected rule: hazardous_waste counts at high or
critical severity, and low/medium severities still do not.

No YOLO model is loaded here — classify_environmental_risk() is pure.
"""

from __future__ import annotations

import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from image_analysis import (  # noqa: E402
    ENV_MODEL_CLASS_MAP,
    _indicates_environmental_concern,
    classify_environmental_risk,
)


def _env_detection(label: str, confidence: float = 0.9) -> dict:
    """Minimal env-model detection; class_id 999 avoids the COCO heuristics."""
    return {
        "class_id": 999,
        "label": label,
        "confidence": confidence,
        "source": "env_model",
        "bbox": [0.0, 0.0, 10.0, 10.0],
    }


# ---------------------------------------------------------------------------
# The gap: hazardous waste at critical severity
# ---------------------------------------------------------------------------

def test_ewaste_critical_is_an_environmental_concern():
    result = classify_environmental_risk([_env_detection("e-waste")])

    assert result["has_environmental_concern"] is True
    hazardous = [i for i in result["indicators"] if i["type"] == "hazardous_waste"]
    assert len(hazardous) == 1
    assert hazardous[0]["severity"] == "critical"
    assert hazardous[0]["label"] == "e-waste"
    assert hazardous[0]["hazard_id"] == "chemical_spill"
    assert "chemical_spill" in result["hazard_ids"]


def test_medical_waste_critical_is_an_environmental_concern():
    result = classify_environmental_risk([_env_detection("medical")])

    assert result["has_environmental_concern"] is True
    assert any(i["type"] == "hazardous_waste" for i in result["indicators"])


# ---------------------------------------------------------------------------
# Severity gate: hazardous_waste must be severe, not just present
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("severity", ["low", "medium"])
def test_low_and_medium_hazardous_waste_are_not_a_concern(monkeypatch, severity):
    """A hypothetical non-severe hazardous-waste class must not flip the flag."""
    monkeypatch.setitem(
        ENV_MODEL_CLASS_MAP,
        "test_hazard",
        {"type": "hazardous_waste", "severity": severity, "hazard_id": "chemical_spill"},
    )

    result = classify_environmental_risk([_env_detection("test hazard")])

    assert result["indicators"], "the indicator is still reported"
    assert result["has_environmental_concern"] is False


@pytest.mark.parametrize("severity", ["low", "medium"])
def test_hazardous_waste_helper_rejects_non_severe_severities(severity):
    assert _indicates_environmental_concern(
        {"type": "hazardous_waste", "severity": severity}
    ) is False


@pytest.mark.parametrize("severity", ["high", "critical"])
def test_hazardous_waste_helper_accepts_severe_severities(severity):
    assert _indicates_environmental_concern(
        {"type": "hazardous_waste", "severity": severity}
    ) is True


# ---------------------------------------------------------------------------
# Existing behaviour must not regress
# ---------------------------------------------------------------------------

def test_medium_solid_waste_still_not_a_concern():
    """A COCO bottle is medium-severity solid waste and must stay a non-concern."""
    bottle = {
        "class_id": 39,
        "label": "bottle",
        "confidence": 0.8,
        "source": "coco",
        "bbox": [0.0, 0.0, 10.0, 10.0],
    }

    result = classify_environmental_risk([bottle])

    assert result["has_environmental_concern"] is False
    assert result["indicators"][0]["type"] == "solid_waste"
    assert result["indicators"][0]["severity"] == "medium"


def test_high_solid_waste_is_still_a_concern():
    result = classify_environmental_risk([_env_detection("trash")])

    assert result["has_environmental_concern"] is True
    assert result["indicators"][0]["type"] == "solid_waste"
    assert result["indicators"][0]["severity"] == "high"


def test_critical_open_burning_is_still_a_concern():
    result = classify_environmental_risk([_env_detection("fire")])

    assert result["has_environmental_concern"] is True
    assert result["indicators"][0]["type"] == "open_burning"
    assert result["indicators"][0]["severity"] == "critical"
