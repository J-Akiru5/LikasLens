"""
Shared test fixtures for LikasLens AI service e2e tests.
Mocks database, auth, and external services.
"""

import os
import sys
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Ensure ai-service root is on path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


@pytest.fixture(autouse=True)
def _set_test_env(monkeypatch):
    """Set minimal env vars for testing."""
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://test:test@localhost/test")
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "test-secret-key-for-testing")
    monkeypatch.setenv("SUPABASE_URL", "https://test.supabase.co")
    monkeypatch.setenv("GOOGLE_API_KEY", "test-gemini-key")
    monkeypatch.setenv("APP_DEBUG", "true")


@pytest.fixture
def mock_db_session():
    """Create a mock async DB session."""
    session = AsyncMock()
    session.execute = AsyncMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()
    session.close = AsyncMock()
    session.add = MagicMock()
    return session


@pytest.fixture
def mock_user():
    """A mock user from Supabase JWT."""
    return {
        "sub": str(uuid.uuid4()),
        "email": "test@example.com",
        "user_metadata": {"role": "citizen"},
    }


@pytest.fixture
def mock_lgu_token():
    """A mock LGU officer token."""
    return {
        "sub": str(uuid.uuid4()),
        "email": "lgu@example.com",
        "user_metadata": {"role": "lgu_officer"},
    }


@pytest.fixture
def mock_admin_token():
    """A mock admin token."""
    return {
        "sub": str(uuid.uuid4()),
        "email": "admin@example.com",
        "user_metadata": {"role": "admin"},
    }


@pytest.fixture
def sample_ticket():
    """A mock Ticket model instance."""
    ticket = MagicMock()
    ticket.id = uuid.uuid4()
    ticket.title = "Test Environmental Report"
    ticket.description = "Test description"
    ticket.status = "open"
    ticket.ghost_mode = False
    ticket.latitude = 14.5547
    ticket.longitude = 121.0244
    ticket.location_fuzzed = False
    ticket.address_text = None
    ticket.ai_triage_summary = "Illegal Dumping"
    ticket.ai_confidence = 0.85
    ticket.ai_analysis_raw = None
    ticket.ai_recommended_office = "LGU Environment Office"
    ticket.routing_source = "neo4j"
    ticket.urgency_score = 0.85
    ticket.resolved_at = None
    ticket.created_at = datetime.now(timezone.utc)
    ticket.updated_at = datetime.now(timezone.utc)
    ticket.reporter = MagicMock()
    ticket.reporter.name = "Test User"
    ticket.evidence = []
    ticket.timeline = []
    return ticket


@pytest.fixture
def ghost_ticket():
    """A mock ghost-mode Ticket."""
    ticket = MagicMock()
    ticket.id = uuid.uuid4()
    ticket.title = "Ghost Environmental Report"
    ticket.description = "Anonymous report"
    ticket.status = "open"
    ticket.ghost_mode = True
    ticket.latitude = 14.55
    ticket.longitude = 121.02
    ticket.location_fuzzed = True
    ticket.address_text = None
    ticket.ai_triage_summary = "Water Pollution"
    ticket.ai_confidence = 0.78
    ticket.ai_analysis_raw = None
    ticket.ai_recommended_office = "DENR Water Resources Division"
    ticket.routing_source = "postgresql_fallback"
    ticket.urgency_score = 0.78
    ticket.resolved_at = None
    ticket.created_at = datetime.now(timezone.utc)
    ticket.updated_at = datetime.now(timezone.utc)
    ticket.reporter = None  # Ghost — no reporter
    ticket.evidence = []
    ticket.timeline = []
    return ticket
