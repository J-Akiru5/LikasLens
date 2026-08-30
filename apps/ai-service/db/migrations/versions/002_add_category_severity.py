"""add category and severity columns to tickets

Adds persistent category (VARCHAR) and severity (VARCHAR) columns.
Backfills existing rows from ai_analysis_raw where possible.

Revision ID: 002_category_severity
Revises: 001_initial
Create Date: 2026-08-30

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "002_category_severity"
down_revision: Union[str, Sequence[str], None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add category and severity columns, then backfill from ai_analysis_raw."""

    # ── Add new columns (nullable initially for backfill) ────────────────
    op.add_column("tickets", sa.Column("category", sa.String(100), nullable=True))
    op.add_column("tickets", sa.Column("severity", sa.String(20), nullable=True))

    # ── Add index on category for analytics GROUP BY performance ─────────
    op.create_index("ix_tickets_category", "tickets", ["category"])

    # ── Backfill category from ai_analysis_raw JSONB ─────────────────────
    # Category lives in ai_analysis_raw->'environmental_assessment'->'indicators'->0->>'type'
    # Fallback: parse from ai_triage_summary text ("Category: <value>.")
    op.execute("""
        UPDATE tickets
        SET category = COALESCE(
            ai_analysis_raw
                ->'environmental_assessment'
                ->'indicators'
                ->0
                ->>'type',
            -- fallback: extract from ai_triage_summary "Category: solid_waste."
            CASE
                WHEN ai_triage_summary LIKE '%Category: %'
                THEN split_part(
                    split_part(ai_triage_summary, 'Category: ', 2),
                    '.', 1
                )
                ELSE NULL
            END
        )
        WHERE category IS NULL
          AND (ai_analysis_raw IS NOT NULL OR ai_triage_summary IS NOT NULL)
    """)

    # ── Backfill severity from ai_analysis_raw JSONB ─────────────────────
    # Severity lives in ai_analysis_raw->'environmental_assessment'->'indicators'->N->>'severity'
    # Strategy: take the HIGHEST severity across all indicators (critical > high > medium > low > info)
    op.execute("""
        UPDATE tickets
        SET severity = (
            SELECT MAX(sev) FROM (
                SELECT
                    CASE ind->>'severity'
                        WHEN 'critical' THEN 5
                        WHEN 'high'     THEN 4
                        WHEN 'medium'   THEN 3
                        WHEN 'low'      THEN 2
                        WHEN 'info'     THEN 1
                        ELSE 0
                    END AS sev_num,
                    ind->>'severity' AS sev
                FROM jsonb_array_elements(
                    ai_analysis_raw
                        ->'environmental_assessment'
                        ->'indicators'
                ) AS ind
            ) sub
            WHERE sub.sev IS NOT NULL
        )
        WHERE severity IS NULL
          AND ai_analysis_raw IS NOT NULL
          AND ai_analysis_raw->'environmental_assessment'->'indicators' IS NOT NULL
    """)

    # Make severity NOT NULL with a default for any remaining NULLs
    # (tickets that have no ai_analysis_raw yet get 'low' as a safe default)
    op.execute("UPDATE tickets SET severity = 'low' WHERE severity IS NULL")
    op.alter_column("tickets", "severity", nullable=False, server_default="low")


def downgrade() -> None:
    """Remove category and severity columns."""
    op.drop_index("ix_tickets_category", table_name="tickets")
    op.drop_column("tickets", "severity")
    op.drop_column("tickets", "category")
