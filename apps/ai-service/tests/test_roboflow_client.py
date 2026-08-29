"""Tests for roboflow_client.py — Roboflow Serverless API integration."""

from __future__ import annotations

import os
from unittest.mock import MagicMock, patch

import pytest
import requests

# Import the module under test
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import settings
from roboflow_client import (
    _get_config,
    _MAX_RETRIES,
    detect_from_bytes,
    health_check,
    is_configured,
    normalize_predictions,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def _clean_settings():
    """Ensure settings are clean before each test — mock to empty strings."""
    with patch.object(settings, "roboflow_api_key", ""), \
         patch.object(settings, "roboflow_model_id", ""):
        yield


@pytest.fixture()
def _set_settings():
    """Set valid config for tests that need them."""
    with patch.object(settings, "roboflow_api_key", "test-key-123"), \
         patch.object(settings, "roboflow_model_id", "garbage-detection-sht1u/4"):
        yield


# ---------------------------------------------------------------------------
# _get_config
# ---------------------------------------------------------------------------

class TestGetConfig:
    def test_raises_when_api_key_missing(self):
        with pytest.raises(ValueError, match="ROBOFLOW_API_KEY"):
            _get_config()

    def test_raises_when_model_id_missing(self):
        with patch.object(settings, "roboflow_api_key", "key"), \
             pytest.raises(ValueError, match="ROBOFLOW_MODEL_ID"):
            _get_config()

    def test_returns_tuple_when_configured(self, _set_settings):
        api_key, model_id = _get_config()
        assert api_key == "test-key-123"
        assert model_id == "garbage-detection-sht1u/4"


# ---------------------------------------------------------------------------
# is_configured
# ---------------------------------------------------------------------------

class TestIsConfigured:
    def test_false_when_no_env(self):
        assert is_configured() is False

    def test_false_when_only_key(self):
        with patch.object(settings, "roboflow_api_key", "key"):
            assert is_configured() is False

    def test_false_when_only_model(self):
        with patch.object(settings, "roboflow_model_id", "model/1"):
            assert is_configured() is False

    def test_false_when_empty_strings(self):
        with patch.object(settings, "roboflow_api_key", "  "), \
             patch.object(settings, "roboflow_model_id", "  "):
            assert is_configured() is False

    def test_true_when_both_set(self, _set_settings):
        assert is_configured() is True


# ---------------------------------------------------------------------------
# health_check
# ---------------------------------------------------------------------------

class TestHealthCheck:
    def test_ok_on_200(self, _set_settings):
        mock_resp = MagicMock(status_code=200)
        with patch("roboflow_client.requests.get", return_value=mock_resp):
            result = health_check()
        assert result["status"] == "ok"
        assert result["roboflow_connected"] is True

    def test_ok_on_400(self, _set_settings):
        mock_resp = MagicMock(status_code=400)
        with patch("roboflow_client.requests.get", return_value=mock_resp):
            result = health_check()
        assert result["status"] == "ok"
        assert result["roboflow_connected"] is True

    def test_ok_on_405(self, _set_settings):
        mock_resp = MagicMock(status_code=405)
        with patch("roboflow_client.requests.get", return_value=mock_resp):
            result = health_check()
        assert result["status"] == "ok"

    def test_error_on_401(self, _set_settings):
        mock_resp = MagicMock(status_code=401)
        with patch("roboflow_client.requests.get", return_value=mock_resp):
            result = health_check()
        assert result["status"] == "error"
        assert result["roboflow_connected"] is False
        assert "401" in result["error"]

    def test_error_on_unexpected_status(self, _set_settings):
        mock_resp = MagicMock(status_code=503)
        with patch("roboflow_client.requests.get", return_value=mock_resp):
            result = health_check()
        assert result["status"] == "error"
        assert "503" in result["error"]

    def test_error_on_connection_error(self, _set_settings):
        with patch("roboflow_client.requests.get", side_effect=requests.ConnectionError("refused")):
            result = health_check()
        assert result["status"] == "error"
        assert "connection" in result["error"].lower()

    def test_error_on_timeout(self, _set_settings):
        with patch("roboflow_client.requests.get", side_effect=requests.Timeout("timed out")):
            result = health_check()
        assert result["status"] == "error"
        assert "timed out" in result["error"].lower()

    def test_raises_when_not_configured(self):
        with pytest.raises(ValueError):
            health_check()


# ---------------------------------------------------------------------------
# detect_from_bytes
# ---------------------------------------------------------------------------

class TestDetectFromBytes:
    SAMPLE_IMAGE = b"\xff\xd8\xff\xe0" + b"\x00" * 100  # Fake JPEG header

    def test_success_response(self, _set_settings):
        mock_resp = MagicMock(
            status_code=200,
            json=lambda: {
                "predictions": [{"class": "Plastic", "confidence": 0.85}],
                "inference_ms": 150,
                "image": {"width": 640, "height": 480},
            },
        )
        with patch("roboflow_client.requests.post", return_value=mock_resp):
            result = detect_from_bytes(self.SAMPLE_IMAGE)
        assert len(result["predictions"]) == 1
        assert result["model"] == "garbage-detection-sht1u/4"

    def test_raises_on_401(self, _set_settings):
        mock_resp = MagicMock(status_code=401)
        with patch("roboflow_client.requests.post", return_value=mock_resp):
            with pytest.raises(RuntimeError, match="401"):
                detect_from_bytes(self.SAMPLE_IMAGE)

    def test_raises_on_404(self, _set_settings):
        mock_resp = MagicMock(status_code=404)
        with patch("roboflow_client.requests.post", return_value=mock_resp):
            with pytest.raises(RuntimeError, match="404"):
                detect_from_bytes(self.SAMPLE_IMAGE)

    def test_raises_on_400(self, _set_settings):
        mock_resp = MagicMock(status_code=400, text="Bad request")
        with patch("roboflow_client.requests.post", return_value=mock_resp):
            with pytest.raises(RuntimeError, match="400"):
                detect_from_bytes(self.SAMPLE_IMAGE)

    def test_retries_on_connection_error(self, _set_settings):
        with patch(
            "roboflow_client.requests.post",
            side_effect=requests.ConnectionError("refused"),
        ) as mock_post, patch("roboflow_client.time.sleep"):
            with pytest.raises(RuntimeError, match=f"after {_MAX_RETRIES} attempts"):
                detect_from_bytes(self.SAMPLE_IMAGE)
            assert mock_post.call_count == _MAX_RETRIES

    def test_retries_on_timeout(self, _set_settings):
        with patch(
            "roboflow_client.requests.post",
            side_effect=requests.Timeout("timeout"),
        ) as mock_post, patch("roboflow_client.time.sleep"):
            with pytest.raises(RuntimeError, match=f"after {_MAX_RETRIES} attempts"):
                detect_from_bytes(self.SAMPLE_IMAGE)
            assert mock_post.call_count == _MAX_RETRIES

    def test_retries_on_500(self, _set_settings):
        mock_resp = MagicMock(status_code=500)
        with patch(
            "roboflow_client.requests.post",
            return_value=mock_resp,
        ) as mock_post, patch("roboflow_client.time.sleep"):
            with pytest.raises(RuntimeError, match=f"after {_MAX_RETRIES} attempts"):
                detect_from_bytes(self.SAMPLE_IMAGE)
            assert mock_post.call_count == _MAX_RETRIES

    def test_no_retry_on_401(self, _set_settings):
        mock_resp = MagicMock(status_code=401)
        with patch(
            "roboflow_client.requests.post",
            return_value=mock_resp,
        ) as mock_post:
            with pytest.raises(RuntimeError, match="401"):
                detect_from_bytes(self.SAMPLE_IMAGE)
            assert mock_post.call_count == 1

    def test_raises_when_not_configured(self):
        with pytest.raises(ValueError):
            detect_from_bytes(self.SAMPLE_IMAGE)


# ---------------------------------------------------------------------------
# normalize_predictions
# ---------------------------------------------------------------------------

class TestNormalizePredictions:
    def test_empty_predictions(self):
        assert normalize_predictions({"predictions": []}) == []

    def test_converts_center_to_corner_bbox(self):
        raw = {
            "predictions": [
                {
                    "x": 100.0,
                    "y": 200.0,
                    "width": 50.0,
                    "height": 80.0,
                    "class": "Plastic",
                    "confidence": 0.85,
                    "class_id": 0,
                }
            ]
        }
        result = normalize_predictions(raw)
        assert len(result) == 1
        det = result[0]
        assert det["label"] == "Plastic"
        assert det["confidence"] == 0.85
        assert det["source"] == "roboflow"
        assert det["bbox"] == [75.0, 160.0, 125.0, 240.0]

    def test_handles_missing_fields(self):
        raw = {"predictions": [{"class": "Trash"}]}
        result = normalize_predictions(raw)
        assert len(result) == 1
        assert result[0]["label"] == "Trash"
        assert result[0]["confidence"] == 0
        assert result[0]["class_id"] == -1

    def test_multiple_predictions(self):
        raw = {
            "predictions": [
                {"x": 10, "y": 20, "width": 5, "height": 5, "class": "A", "confidence": 0.9, "class_id": 0},
                {"x": 30, "y": 40, "width": 10, "height": 10, "class": "B", "confidence": 0.7, "class_id": 1},
            ]
        }
        result = normalize_predictions(raw)
        assert len(result) == 2
        assert result[0]["label"] == "A"
        assert result[1]["label"] == "B"


# ---------------------------------------------------------------------------
# compute_composite_score (from image_analysis.py)
# ---------------------------------------------------------------------------

class TestCompositeScore:
    """Test the updated composite score with Roboflow integration."""

    @pytest.fixture()
    def _import_score(self):
        sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from image_analysis import compute_composite_score
        return compute_composite_score

    def test_base_score_no_agreement(self, _import_score):
        score = _import_score(0.8, 0.0, False, 0.0)
        # 0.8 * 0.6 + 0 * 0.3 + (1/3) * 0.1 = 0.48 + 0 + 0.0333
        assert 0.50 <= score <= 0.52

    def test_with_all_sources(self, _import_score):
        score = _import_score(0.8, 0.7, True, 0.9)
        # max(0.8, 0.7, 0.9) * 0.6 + 1.0 * 0.3 + (3/3) * 0.1 = 0.54 + 0.3 + 0.1
        assert score == 0.94

    def test_only_roboflow(self, _import_score):
        score = _import_score(0.0, 0.0, False, 0.75)
        # 0.75 * 0.6 + 0 * 0.3 + (1/3) * 0.1 = 0.45 + 0 + 0.0333
        assert 0.47 <= score <= 0.49

    def test_two_sources(self, _import_score):
        score = _import_score(0.8, 0.0, False, 0.6)
        # max(0.8, 0.0, 0.6) * 0.6 + 0 * 0.3 + (2/3) * 0.1 = 0.48 + 0 + 0.0667
        assert 0.54 <= score <= 0.55
