"""initial schema — users, tickets, ticket_evidences, ticket_timelines

These tables already exist in Supabase (created by Laravel migrations).
This migration documents the schema for new environments and autogenerate diffing.

Revision ID: 001_initial
Revises: None
Create Date: 2026-08-28

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001_initial"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create core tables — mirrors the Laravel migrations already applied to Supabase."""

    # ── users ────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("supabase_auth_user_id", sa.String(255), unique=True, nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("role", sa.String(50), server_default="citizen", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # ── tickets ──────────────────────────────────────────────────────────
    op.create_table(
        "tickets",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "reporter_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("status", sa.String(50), server_default="open", nullable=False),
        sa.Column("ghost_mode", sa.Boolean, server_default=sa.text("false"), nullable=False),
        sa.Column("latitude", sa.Float, nullable=True),
        sa.Column("longitude", sa.Float, nullable=True),
        sa.Column("location_fuzzed", sa.Boolean, server_default=sa.text("false"), nullable=False),
        sa.Column("address_text", sa.String(500), nullable=True),
        sa.Column("ai_triage_summary", sa.Text, nullable=True),
        sa.Column("ai_confidence", sa.Float, nullable=True),
        sa.Column("ai_analysis_raw", postgresql.JSONB, nullable=True),
        sa.Column("ai_recommended_office", sa.String(300), nullable=True),
        sa.Column("routing_source", sa.String(50), nullable=True),
        sa.Column("urgency_score", sa.Float, nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
    )
    op.create_index("ix_tickets_status", "tickets", ["status"])
    op.create_index("ix_tickets_created_at", "tickets", ["created_at"])
    op.create_index("ix_tickets_location", "tickets", ["latitude", "longitude"])

    # ── ticket_evidences ─────────────────────────────────────────────────
    op.create_table(
        "ticket_evidences",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "ticket_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tickets.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("storage_path", sa.String(1000), nullable=False),
        sa.Column("storage_provider", sa.String(50), nullable=True),
        sa.Column("checksum_sha256", sa.String(64), nullable=True),
        sa.Column("mime_type", sa.String(100), nullable=True),
        sa.Column("file_size_bytes", sa.BigInteger, nullable=True),
        sa.Column("exif_removed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("yolo_status", sa.String(50), server_default="pending", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index(
        "ix_ticket_evidences_ticket_created",
        "ticket_evidences",
        ["ticket_id", "created_at"],
    )

    # ── ticket_timelines ─────────────────────────────────────────────────
    op.create_table(
        "ticket_timelines",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "ticket_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("tickets.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "actor_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("actor_type", sa.String(50), server_default="system", nullable=False),
        sa.Column("from_status", sa.String(50), nullable=True),
        sa.Column("to_status", sa.String(50), nullable=False),
        sa.Column("note", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index(
        "ix_ticket_timelines_ticket",
        "ticket_timelines",
        ["ticket_id"],
    )


def downgrade() -> None:
    """Drop all tables created in upgrade()."""
    op.drop_table("ticket_timelines")
    op.drop_table("ticket_evidences")
    op.drop_table("tickets")
    op.drop_table("users")
