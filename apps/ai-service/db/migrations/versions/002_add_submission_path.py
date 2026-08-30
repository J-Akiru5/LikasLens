"""add submission_path and needs_ai_reanalysis to tickets

Tracks whether a report went through the AI pipeline or fell back to
direct Supabase insert, and flags tickets that need reprocessing when
the AI service becomes available again.

Revision ID: 002_submission_path
Revises: 001_initial
Create Date: 2026-08-30

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "002_submission_path"
down_revision: Union[str, Sequence[str], None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "tickets",
        sa.Column(
            "submission_path",
            sa.String(50),
            nullable=True,
            comment="ai_service | direct_fallback — tracks how the ticket was created",
        ),
    )
    op.add_column(
        "tickets",
        sa.Column(
            "needs_ai_reanalysis",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
            comment="True when ticket was created via fallback and needs AI reprocessing",
        ),
    )
    # Index for quick lookup of fallback tickets needing reprocessing
    op.create_index(
        "ix_tickets_needs_ai_reanalysis",
        "tickets",
        ["needs_ai_reanalysis"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_tickets_needs_ai_reanalysis", table_name="tickets")
    op.drop_column("tickets", "needs_ai_reanalysis")
    op.drop_column("tickets", "submission_path")
