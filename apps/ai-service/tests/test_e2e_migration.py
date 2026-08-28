"""
E2E tests for the Laravel → FastAPI migration.
Covers all new routers: auth, reports, tickets, public, liksi.
Uses FastAPI dependency_overrides for proper DB/auth mocking.
"""

import os
import sys
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

# Ensure ai-service root is on path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Must set env before importing app
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://test:test@localhost/test")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-secret")
os.environ.setdefault("GOOGLE_API_KEY", "test-key")

from main import app
from db.connection import get_db
from auth.supabase_jwt import verify_supabase_token, optional_auth, require_lgu_role

client = TestClient(app)


def _mock_session(results=None, one_result=None, count=0):
    """Create a mock async session with configurable return values."""
    session = AsyncMock()
    session.add = MagicMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()
    session.close = AsyncMock()

    if one_result is not None:
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = one_result
        mock_result.scalars.return_value.all.return_value = results or []
        session.execute.return_value = mock_result
    elif results is not None:
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_result.scalars.return_value.all.return_value = results
        # Need count scalar too for paginated endpoints
        mock_count = MagicMock()
        mock_count.scalar.return_value = count
        session.execute.side_effect = [mock_count, mock_result]
    else:
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_result.scalars.return_value.all.return_value = []
        mock_count = MagicMock()
        mock_count.scalar.return_value = 0
        session.execute.side_effect = [mock_count, mock_result]

    return session


def _sample_ticket(**overrides):
    """Create a mock Ticket."""
    t = MagicMock()
    t.id = uuid.uuid4()
    t.title = overrides.get("title", "Test Environmental Report")
    t.description = overrides.get("description", "Test description")
    t.status = overrides.get("status", "open")
    t.ghost_mode = overrides.get("ghost_mode", False)
    t.latitude = overrides.get("latitude", 14.5547)
    t.longitude = overrides.get("longitude", 121.0244)
    t.location_fuzzed = overrides.get("location_fuzzed", False)
    t.address_text = overrides.get("address_text", None)
    t.ai_triage_summary = overrides.get("ai_triage_summary", "Illegal Dumping")
    t.ai_confidence = overrides.get("ai_confidence", 0.85)
    t.ai_analysis_raw = overrides.get("ai_analysis_raw", None)
    t.ai_recommended_office = overrides.get("ai_recommended_office", "LGU Environment Office")
    t.routing_source = overrides.get("routing_source", "neo4j")
    t.urgency_score = overrides.get("urgency_score", 0.85)
    t.resolved_at = overrides.get("resolved_at", None)
    t.created_at = datetime.now(timezone.utc)
    t.updated_at = datetime.now(timezone.utc)
    t.reporter = overrides.get("reporter", MagicMock(name="Test User"))
    if t.reporter:
        t.reporter.name = overrides.get("reporter_name", "Test User")
    t.evidence = []
    t.timeline = []
    return t


# ============================================================================
# Health endpoints (no auth, no DB)
# ============================================================================

class TestHealth:
    def test_health_check(self):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["service"] == "likaslens-ai-service"

    def test_health_models(self):
        resp = client.get("/health/models")
        assert resp.status_code == 200
        data = resp.json()
        assert "yolo_coco" in data
        assert "yolo_env" in data
        assert "gemini_available" in data

    def test_root(self):
        resp = client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "LikasLens AI Service"


# ============================================================================
# Auth — POST /api/v1/auth/sync
# ============================================================================

class TestAuthSync:
    def test_sync_creates_new_user(self):
        session = _mock_session(one_result=None)
        app.dependency_overrides[get_db] = lambda: session

        resp = client.post("/api/v1/auth/sync", json={
            "supabase_auth_user_id": "test-auth-id-123",
            "email": "new@test.com",
            "name": "New User",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        # User was created — verify structure (mock session may not persist attrs)
        assert "data" in data
        assert "id" in data["data"]
        app.dependency_overrides.clear()

    def test_sync_existing_user(self):
        existing = MagicMock()
        existing.id = uuid.uuid4()
        existing.name = "Existing"
        existing.email = "existing@test.com"
        existing.role = "citizen"

        session = _mock_session(one_result=existing)
        app.dependency_overrides[get_db] = lambda: session

        resp = client.post("/api/v1/auth/sync", json={
            "supabase_auth_user_id": "existing-auth-id",
            "email": "existing@test.com",
            "name": "Existing",
        })
        assert resp.status_code == 200
        assert resp.json()["success"] is True
        app.dependency_overrides.clear()

    def test_sync_missing_fields(self):
        resp = client.post("/api/v1/auth/sync", json={})
        assert resp.status_code == 422


# ============================================================================
# Reports — POST /api/v1/reports, /triage
# ============================================================================

class TestReports:
    @patch("services.triage_service.run_triage", new_callable=AsyncMock)
    @patch("routers.reports.boto3")
    def test_submit_report_as_ghost(self, mock_boto3, mock_triage):
        session = _mock_session()
        app.dependency_overrides[get_db] = lambda: session
        mock_triage.return_value = {"status": "analyzed"}

        from PIL import Image
        import io, base64
        img = Image.new("RGB", (10, 10), color="red")
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        b64 = base64.b64encode(buf.getvalue()).decode()

        resp = client.post("/api/v1/reports", json={
            "base64Image": b64,
            "latitude": 14.5547,
            "longitude": 121.0244,
            "ghost_mode": True,
            "description": "Illegal dumping near river",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["success"] is True
        assert "ticket_id" in data
        assert data["ghost_mode"] is True
        app.dependency_overrides.clear()

    def test_submit_report_invalid_base64(self):
        resp = client.post("/api/v1/reports", json={
            "base64Image": "not-valid-base64!!!",
            "ghost_mode": True,
        })
        assert resp.status_code == 422

    @patch("image_analysis.analyze_base64")
    def test_triage_image(self, mock_analyze):
        mock_analyze.return_value = {
            "environmental_assessment": {
                "has_environmental_concern": True,
                "indicators": [{"type": "solid_waste", "severity": "high"}],
            },
            "composite_confidence": 0.85,
        }

        from PIL import Image
        import io, base64
        img = Image.new("RGB", (10, 10), color="green")
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        b64 = base64.b64encode(buf.getvalue()).decode()

        resp = client.post("/api/v1/reports/triage", json={"base64Image": b64})
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["has_concern"] is True
        assert data["confidence"] == 0.85


# ============================================================================
# Tickets — GET/PATCH /api/v1/tickets/*
# ============================================================================

class TestTickets:
    def _auth_lgu(self):
        app.dependency_overrides[require_lgu_role] = lambda: {
            "sub": str(uuid.uuid4()),
            "user_metadata": {"role": "admin"},
        }

    def test_list_tickets(self):
        self._auth_lgu()
        session = _mock_session(results=[])
        app.dependency_overrides[get_db] = lambda: session

        resp = client.get("/api/v1/tickets")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"] == []
        app.dependency_overrides.clear()

    def test_get_ticket_detail(self):
        self._auth_lgu()
        ticket = _sample_ticket()
        session = _mock_session(one_result=ticket)
        app.dependency_overrides[get_db] = lambda: session

        resp = client.get(f"/api/v1/tickets/{ticket.id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["title"] == "Test Environmental Report"
        assert data["data"]["ai_confidence"] == 0.85
        app.dependency_overrides.clear()

    def test_get_ticket_not_found(self):
        self._auth_lgu()
        session = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        session.execute.return_value = mock_result
        app.dependency_overrides[get_db] = lambda: session

        resp = client.get(f"/api/v1/tickets/{uuid.uuid4()}")
        assert resp.status_code == 404
        app.dependency_overrides.clear()

    def test_get_timeline(self):
        ticket = _sample_ticket()
        entry = MagicMock()
        entry.from_status = None
        entry.to_status = "open"
        entry.note = "Report submitted"
        entry.actor_type = "user"
        entry.created_at = datetime.now(timezone.utc)

        session = _mock_session()
        # First call: ticket lookup, second call: timeline
        mock_ticket_result = MagicMock()
        mock_ticket_result.scalar_one_or_none.return_value = ticket
        mock_tl_result = MagicMock()
        mock_tl_result.scalars.return_value.all.return_value = [entry]
        session.execute.side_effect = [mock_ticket_result, mock_tl_result]
        app.dependency_overrides[get_db] = lambda: session

        resp = client.get(f"/api/v1/tickets/{ticket.id}/timeline")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert len(data["data"]["timeline"]) == 1
        assert data["data"]["timeline"][0]["action"] == "Report submitted"
        app.dependency_overrides.clear()

    def test_update_status_valid(self):
        self._auth_lgu()
        ticket = _sample_ticket()
        session = _mock_session(one_result=ticket)
        app.dependency_overrides[get_db] = lambda: session

        resp = client.patch(
            f"/api/v1/tickets/{ticket.id}/status",
            json={"status": "investigating", "notes": "Dispatched team"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["old_status"] == "open"
        assert data["data"]["new_status"] == "investigating"
        app.dependency_overrides.clear()

    def test_update_status_invalid(self):
        self._auth_lgu()
        ticket = _sample_ticket()
        session = _mock_session(one_result=ticket)
        app.dependency_overrides[get_db] = lambda: session

        # open -> monitoring is NOT allowed
        resp = client.patch(
            f"/api/v1/tickets/{ticket.id}/status",
            json={"status": "monitoring"},
        )
        assert resp.status_code == 422
        assert "Cannot transition" in resp.json()["detail"]
        app.dependency_overrides.clear()


# ============================================================================
# Public — GET /api/v1/public/tickets
# ============================================================================

class TestPublic:
    def test_public_tickets_no_identity(self):
        ticket = _sample_ticket()
        session = _mock_session(results=[ticket])
        app.dependency_overrides[get_db] = lambda: session

        resp = client.get("/api/v1/public/tickets")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert len(data["data"]) == 1

        t = data["data"][0]
        # Identity fields must NEVER appear
        assert "reporter_user_id" not in t
        assert "reporter_email" not in t
        assert "ghost_mode" not in t
        # Core fields present
        assert "id" in t
        assert "title" in t
        assert "status" in t
        app.dependency_overrides.clear()

    def test_public_ticket_detail(self):
        ticket = _sample_ticket()
        session = _mock_session(one_result=ticket)
        app.dependency_overrides[get_db] = lambda: session

        resp = client.get(f"/api/v1/public/tickets/{ticket.id}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert "reporter_user_id" not in data["data"]
        app.dependency_overrides.clear()

    def test_public_ticket_not_found(self):
        session = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        session.execute.return_value = mock_result
        app.dependency_overrides[get_db] = lambda: session

        resp = client.get(f"/api/v1/public/tickets/{uuid.uuid4()}")
        assert resp.status_code == 404
        app.dependency_overrides.clear()


# ============================================================================
# Ghost Mode safety (unit tests — no HTTP)
# ============================================================================

class TestGhostMode:
    def test_ghost_mode_strips_identity(self):
        from services.ghost_mode import sanitize_report_payload
        result = sanitize_report_payload(
            reporter_user_id="user-123", ghost_mode=True,
            latitude=14.5547, longitude=121.0244,
        )
        assert result["reporter_user_id"] is None
        assert result["ghost_mode"] is True
        assert result["location_fuzzed"] is True

    def test_non_ghost_preserves_identity(self):
        from services.ghost_mode import sanitize_report_payload
        result = sanitize_report_payload(
            reporter_user_id="user-123", ghost_mode=False,
            latitude=14.5547, longitude=121.0244,
        )
        assert result["reporter_user_id"] == "user-123"
        assert result["ghost_mode"] is False
        assert result["location_fuzzed"] is False

    def test_location_fuzzing(self):
        from services.ghost_mode import fuzz_location
        lat, lon = fuzz_location(14.5547, 121.0244)
        assert abs(lat - 14.5547) < 0.01
        assert abs(lon - 121.0244) < 0.01

    def test_public_view_anonymizes(self):
        from services.ghost_mode import get_reporter_display
        assert get_reporter_display(True, "John") == "Anonymous Reporter"
        assert get_reporter_display(False, "John") == "John"
        assert get_reporter_display(False, None) == "Unknown"

    def test_identity_fields_stripped(self):
        from services.ghost_mode import sanitize_for_public
        d = {
            "id": "abc", "title": "Test",
            "reporter_user_id": "u1", "reporter_email": "e@e.com",
            "ghost_mode": True, "status": "open",
        }
        safe = sanitize_for_public(d)
        assert "reporter_user_id" not in safe
        assert "reporter_email" not in safe
        assert "ghost_mode" not in safe
        assert safe["id"] == "abc"
        assert safe["status"] == "open"


# ============================================================================
# EXIF stripping
# ============================================================================

class TestExif:
    def test_strip_jpeg(self):
        from PIL import Image
        import io
        from services.exif import strip_exif, get_mime_type
        img = Image.new("RGB", (100, 100), color="blue")
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=95)
        stripped, checksum = strip_exif(buf.getvalue())
        assert len(checksum) == 64
        assert get_mime_type(stripped) == "image/jpeg"

    def test_strip_png(self):
        from PIL import Image
        import io
        from services.exif import strip_exif, get_mime_type
        img = Image.new("RGB", (100, 100), color="green")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        stripped, checksum = strip_exif(buf.getvalue())
        assert len(checksum) == 64
        assert get_mime_type(stripped) == "image/png"

    def test_invalid_raises(self):
        from services.exif import strip_exif
        with pytest.raises(ValueError, match="Invalid image data"):
            strip_exif(b"not an image")


# ============================================================================
# Status transitions
# ============================================================================

class TestStatusTransitions:
    def test_all_statuses_present(self):
        from db.models import ALLOWED_TRANSITIONS
        expected = {"open", "investigating", "monitoring", "resolved", "verified", "closed", "pending_review"}
        assert set(ALLOWED_TRANSITIONS.keys()) == expected

    def test_closed_is_dead_end(self):
        from db.models import ALLOWED_TRANSITIONS
        assert ALLOWED_TRANSITIONS["closed"] == []

    def test_valid_lifecycle(self):
        from db.models import ALLOWED_TRANSITIONS
        chain = ["open", "investigating", "monitoring", "resolved", "verified", "closed"]
        for i in range(len(chain) - 1):
            assert chain[i + 1] in ALLOWED_TRANSITIONS[chain[i]]


# ============================================================================
# Liksi service
# ============================================================================

class TestLiksi:
    def test_citizen_prompt(self):
        from services.liksi_service import get_system_prompt
        p = get_system_prompt("citizen")
        assert "Liksi" in p

    def test_lgu_prompt(self):
        from services.liksi_service import get_system_prompt
        p = get_system_prompt("lgu")
        assert "Liksi" in p
        assert "officer" in p.lower() or "LGU" in p

    def test_context_builder(self):
        from services.liksi_service import build_lgu_context
        ctx = build_lgu_context({
            "ai_triage_summary": "Water Pollution",
            "ai_confidence": 0.87,
            "ai_recommended_office": "DENR",
            "status": "investigating",
            "description": "Brown water",
        })
        assert "Water Pollution" in ctx
        assert "87%" in ctx

    def test_empty_context(self):
        from services.liksi_service import build_lgu_context
        assert build_lgu_context(None) == ""
        assert build_lgu_context({}) == ""


# ============================================================================
# Triage routing fallback
# ============================================================================

class TestTriageRouting:
    def test_fallback_rules(self):
        from services.triage_service import _fallback_route
        tests = [
            ("illegal_dumping", "LGU Environment Office"),
            ("water_pollution", "DENR Water Resources Division"),
            ("deforestation", "DENR - Protected Areas"),
            ("unknown_category", "LGU Environment Office"),
        ]
        for cat, expected in tests:
            office, source = _fallback_route(cat)
            assert office == expected
            assert source == "postgresql_fallback"
