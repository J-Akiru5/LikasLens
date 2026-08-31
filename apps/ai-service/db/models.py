"""
SQLAlchemy ORM models.
These map to the EXISTING Supabase tables created by Laravel migrations.
Do NOT change column names — we reuse the same schema.
"""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, String, Text, ForeignKey, text as sa_text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from db.connection import Base

# Ticket status state machine — mirrors Laravel's allowedTransitions
TICKET_STATUS = [
    "open", "investigating", "monitoring", "resolved",
    "verified", "closed", "pending_review",
]

# Allowed status transitions (same logic as TicketController::updateStatus)
ALLOWED_TRANSITIONS = {
    "open":           ["investigating", "closed"],
    "investigating":  ["monitoring", "resolved", "closed"],
    "monitoring":     ["resolved", "investigating", "closed"],
    "resolved":       ["verified", "closed"],
    "pending_review": ["open", "investigating", "closed"],
    "verified":       ["closed"],
    "closed":         [],
}


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    supabase_auth_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), unique=True, nullable=True)
    name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    role: Mapped[str] = mapped_column(String(50), default="citizen")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    tickets: Mapped[list["Ticket"]] = relationship("Ticket", back_populates="reporter")


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reporter_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True,
    )
    title: Mapped[str] = mapped_column(String(500))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="open")
    ghost_mode: Mapped[bool] = mapped_column(Boolean, default=False)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    location_fuzzed: Mapped[bool] = mapped_column(Boolean, default=False)
    address_text: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    ai_triage_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ai_confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ai_analysis_raw: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    ai_recommended_office: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    routing_source: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    submission_path: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    needs_ai_reanalysis: Mapped[bool] = mapped_column(Boolean, default=False, server_default=sa_text("false"))
    urgency_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(),
    )

    reporter: Mapped[Optional["User"]] = relationship("User", back_populates="tickets")
    evidence: Mapped[list["TicketEvidence"]] = relationship("TicketEvidence", back_populates="ticket")
    timeline: Mapped[list["TicketTimeline"]] = relationship(
        "TicketTimeline", back_populates="ticket", order_by="TicketTimeline.created_at",
    )


class TicketEvidence(Base):
    __tablename__ = "ticket_evidence"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tickets.id"), nullable=False)
    uploaded_by_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    storage_provider: Mapped[str] = mapped_column(String(50), nullable=False)
    storage_bucket: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(1000))
    checksum_sha256: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    mime_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    file_size_bytes: Mapped[Optional[int]] = mapped_column(nullable=True)
    captured_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    exif_removed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    yolo_status: Mapped[str] = mapped_column(String(50), default="pending")
    yolo_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="evidence")


class TicketTimeline(Base):
    __tablename__ = "ticket_timeline"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tickets.id"), nullable=False)
    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True,
    )
    actor_type: Mapped[str] = mapped_column(String(50), default="system")
    from_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    to_status: Mapped[str] = mapped_column(String(50))
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    extra_metadata: Mapped[Optional[dict]] = mapped_column("metadata", JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="timeline")
