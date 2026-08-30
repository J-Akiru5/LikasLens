"""
Centralized configuration for the LikasLens AI Service.

All environment variables are sourced through this single module.
Each variable is loaded exactly once with its exact current default preserved.

Classification:
  - Required: production should fail fast without it
  - Optional: has a sane default or is a fully optional integration
  - DevelopmentOnly: should never be set in production (test secrets, debug flags)
"""

from __future__ import annotations

import logging
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """AI Service configuration — loaded from environment variables via .env."""

    # ── Core Service ──────────────────────────────────────────────────────
    ai_service_port: int = Field(
        default=8001,
        description="Port the AI service listens on",
    )
    ai_service_api_key: str = Field(
        default="",
        description="Service-to-service API key (X-API-Key). Empty = dev mode, all requests allowed.",
    )
    app_debug: bool = Field(
        default=False,
        description="Enable debug mode. Controls verbose error details in responses.",
    )

    # ── Logging ───────────────────────────────────────────────────────────
    log_level: str = Field(
        default="INFO",
        description="Python logging level.",
    )

    # ── Database ──────────────────────────────────────────────────────────
    database_url: str = Field(
        default="",
        description="SQLAlchemy async database URL (e.g. postgresql+asyncpg://...). Required in production.",
    )

    # ── Supabase Auth ─────────────────────────────────────────────────────
    supabase_url: str = Field(
        default="",
        description="Supabase project URL (e.g. https://xxxx.supabase.co). Required for JWKS-based ES256 verification.",
    )
    supabase_jwt_secret: str = Field(
        default="",
        description="Supabase JWT secret for legacy HS256 verification. Optional — ES256 via JWKS is preferred.",
    )
    jwks_cache_ttl_seconds: int = Field(
        default=3600,
        description="How long to cache Supabase JWKS keys (seconds). Default 1 hour.",
    )

    # ── Supabase Storage ──────────────────────────────────────────────────
    supabase_storage_url: str = Field(
        default="",
        description="Supabase S3-compatible storage endpoint URL.",
    )
    supabase_storage_key: str = Field(
        default="",
        description="Supabase storage access key.",
    )
    supabase_storage_secret: str = Field(
        default="",
        description="Supabase storage secret key.",
    )
    supabase_storage_bucket: str = Field(
        default="evidence",
        description="Supabase storage bucket name for evidence uploads.",
    )

    # ── Gemini AI ─────────────────────────────────────────────────────────
    google_api_key: str = Field(
        default="",
        description="Google Generative AI (Gemini) API key. Required for chat, hazard analysis, graph RAG.",
    )

    # ── OpenCode Zen (MiMo-V2.5 Free) ────────────────────────────────────
    opencode_api_key: str = Field(
        default="",
        description="OpenCode Zen API key for MiMo-V2.5 Free. Dormant/unused — OPENCODE_API_KEY is unset in all environments; hazard analysis uses Gemini only.",
    )

    # ── Neo4j ─────────────────────────────────────────────────────────────
    neo4j_uri: str = Field(
        default="",
        description="Neo4j AuraDB connection URI (e.g. neo4j+s://...).",
    )
    neo4j_user: str = Field(
        default="",
        description="Neo4j username.",
    )
    neo4j_password: str = Field(
        default="",
        description="Neo4j password.",
    )

    # ── Roboflow ──────────────────────────────────────────────────────────
    roboflow_api_key: str = Field(
        default="",
        description="Roboflow hosted inference API key.",
    )
    roboflow_model_id: str = Field(
        default="",
        description="Roboflow model ID (e.g. garbage-detection-sht1u/4).",
    )

    # ── YOLO ──────────────────────────────────────────────────────────────
    yolo_model_path: str = Field(
        default="",
        description="Custom YOLO model path. Empty = use default yolov8n.pt.",
    )
    env_model_path: str = Field(
        default="",
        description="Environmental YOLO model path (e.g. models/yolov8-waste.pt).",
    )

    # ── CORS ──────────────────────────────────────────────────────────────
    cors_origins: str = Field(
        default="http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:8000",
        description="Comma-separated list of allowed CORS origins.",
    )

    # ── Metrics ───────────────────────────────────────────────────────────
    likaslens_metrics_log: str = Field(
        default="",
        description="Path for inference metrics JSONL log. Empty = disabled.",
    )

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore",
    }

    # ── Validators ────────────────────────────────────────────────────────

    @field_validator("app_debug", mode="before")
    @classmethod
    def parse_debug(cls, v: str | bool) -> bool:
        if isinstance(v, str):
            return v.lower() == "true"
        return bool(v)

    # ── Derived properties ────────────────────────────────────────────────

    @property
    def is_production(self) -> bool:
        return not self.app_debug

    @property
    def neo4j_configured(self) -> bool:
        return bool(self.neo4j_uri and self.neo4j_user and self.neo4j_password)

    @property
    def storage_configured(self) -> bool:
        return bool(self.supabase_storage_url and self.supabase_storage_key and self.supabase_storage_secret)

    @property
    def roboflow_configured(self) -> bool:
        return bool(self.roboflow_api_key.strip() and self.roboflow_model_id.strip())

    @property
    def gemini_configured(self) -> bool:
        return bool(self.google_api_key)

    @property
    def database_configured(self) -> bool:
        return bool(self.database_url)

    @property
    def auth_configured(self) -> bool:
        """Auth is configured if either SUPABASE_URL (ES256 JWKS) or SUPABASE_JWT_SECRET (legacy HS256) is set."""
        return bool(self.supabase_url or self.supabase_jwt_secret)

    @property
    def auth_mode(self) -> str:
        """Return the active auth verification mode."""
        if self.supabase_url:
            return "es256_jwks"
        if self.supabase_jwt_secret:
            return "hs256_legacy"
        return "none"

    # ── Validation ────────────────────────────────────────────────────────

    def validate_startup(self) -> list[str]:
        """Check configuration at startup. Returns list of warning messages."""
        warnings = []

        if self.is_production:
            if not self.database_url:
                warnings.append("CRITICAL: DATABASE_URL not set — database operations will fail")
            if not self.supabase_url and not self.supabase_jwt_secret:
                warnings.append("CRITICAL: Neither SUPABASE_URL nor SUPABASE_JWT_SECRET set — auth verification will fail")
            if not self.ai_service_api_key:
                warnings.append("WARNING: AI_SERVICE_API_KEY not set — running with API key auth DISABLED")
        else:
            if not self.database_url:
                warnings.append("DATABASE_URL not set — using in-memory/dummy database")

        if not self.google_api_key:
            warnings.append("GOOGLE_API_KEY not set — Gemini chat/hazard/RAG features DISABLED")

        if self.neo4j_uri and (not self.neo4j_user or not self.neo4j_password):
            warnings.append("NEO4J_URI set but NEO4J_USER or NEO4J_PASSWORD missing — Neo4j partially configured")

        if self.supabase_storage_url and (not self.supabase_storage_key or not self.supabase_storage_secret):
            warnings.append("SUPABASE_STORAGE_URL set but STORAGE_KEY or STORAGE_SECRET missing — storage partially configured")

        return warnings

    def log_config_summary(self) -> None:
        """Print a friendly per-integration config summary."""
        is_prod = self.is_production

        lines = [
            f"[config] {'PRODUCTION' if is_prod else 'DEVELOPMENT'} mode",
            f"[config]   Service port:      {self.ai_service_port}",
            f"[config]   API key auth:      {'ENABLED' if self.ai_service_api_key else 'DISABLED (dev mode)'}",
            f"[config]   Database:          {'✓ configured' if self.database_configured else '✗ not configured'}",
            f"[config]   Supabase Auth:     {'✓ configured (' + self.auth_mode + ')' if self.auth_configured else '✗ not configured'}",
            f"[config]   Supabase Storage:  {'✓ configured' if self.storage_configured else '✗ not configured'}",
            f"[config]   Gemini AI:         {'✓ configured' if self.gemini_configured else '✗ not configured (GOOGLE_API_KEY missing)'}",
            f"[config]   Neo4j:             {'✓ configured' if self.neo4j_configured else '✗ not configured'}",
            f"[config]   Roboflow:          {'✓ configured' if self.roboflow_configured else '✗ not configured'}",
            f"[config]   YOLO models:       {'✓ custom path' if self.yolo_model_path else 'default'} + {'✓ custom env' if self.env_model_path else 'default env'}",
            f"[config]   Metrics log:       {'✓ ' + self.likaslens_metrics_log if self.likaslens_metrics_log else '✗ disabled'}",
        ]

        for line in lines:
            logger.info(line)

        for warning in self.validate_startup():
            if warning.startswith("CRITICAL"):
                logger.error("[config] %s", warning)
            else:
                logger.warning("[config] %s", warning)

    def health_config(self) -> dict:
        """Return config status for /health/config endpoint. Never returns secret values."""
        def _status(configured: bool, required_fields: list[str], missing_fields: list[str]) -> str:
            if configured:
                return "configured"
            if missing_fields:
                return f"missing: {', '.join(missing_fields)}"
            return "not configured"

        return {
            "database": {
                "status": _status(
                    self.database_configured,
                    ["DATABASE_URL"],
                    ["DATABASE_URL"] if not self.database_configured else [],
                ),
            },
            "supabase_auth": {
                "status": _status(
                    self.auth_configured,
                    ["SUPABASE_URL (preferred) or SUPABASE_JWT_SECRET (legacy)"],
                    (
                        [k for k, v in [
                            ("SUPABASE_URL", self.supabase_url),
                            ("SUPABASE_JWT_SECRET", self.supabase_jwt_secret),
                        ] if not v]
                        if not self.auth_configured
                        else []
                    ),
                ),
                "mode": self.auth_mode,
            },
            "supabase_storage": {
                "status": _status(
                    self.storage_configured,
                    ["SUPABASE_STORAGE_URL", "SUPABASE_STORAGE_KEY", "SUPABASE_STORAGE_SECRET"],
                    (
                        [k for k, v in [
                            ("SUPABASE_STORAGE_URL", self.supabase_storage_url),
                            ("SUPABASE_STORAGE_KEY", self.supabase_storage_key),
                            ("SUPABASE_STORAGE_SECRET", self.supabase_storage_secret),
                        ] if not v]
                    ),
                ),
                "bucket": self.supabase_storage_bucket,
            },
            "gemini": {
                "status": _status(
                    self.gemini_configured,
                    ["GOOGLE_API_KEY"],
                    ["GOOGLE_API_KEY"] if not self.gemini_configured else [],
                ),
            },
            "neo4j": {
                "status": _status(
                    self.neo4j_configured,
                    ["NEO4J_URI", "NEO4J_USER", "NEO4J_PASSWORD"],
                    (
                        [k for k, v in [
                            ("NEO4J_URI", self.neo4j_uri),
                            ("NEO4J_USER", self.neo4j_user),
                            ("NEO4J_PASSWORD", self.neo4j_password),
                        ] if not v]
                    ),
                ),
            },
            "roboflow": {
                "status": _status(
                    self.roboflow_configured,
                    ["ROBOFLOW_API_KEY", "ROBOFLOW_MODEL_ID"],
                    (
                        [k for k, v in [
                            ("ROBOFLOW_API_KEY", self.roboflow_api_key),
                            ("ROBOFLOW_MODEL_ID", self.roboflow_model_id),
                        ] if not v]
                    ),
                ),
                "model": self.roboflow_model_id or None,
            },
            "yolo": {
                "status": "custom" if self.yolo_model_path else "default",
                "model_path": self.yolo_model_path or None,
                "env_model_path": self.env_model_path or None,
            },
            "metrics": {
                "status": "enabled" if self.likaslens_metrics_log else "disabled",
                "log_path": self.likaslens_metrics_log or None,
            },
            "api_key_auth": {
                "status": "enabled" if self.ai_service_api_key else "disabled (dev mode)",
            },
            "debug_mode": self.app_debug,
            "port": self.ai_service_port,
        }


# Singleton — import this, not os.getenv
settings = Settings()
