"""
Alembic env.py — async SQLAlchemy migration runner.

Uses the same DATABASE_URL and Base from db.connection so autogenerate
can introspect all models defined in db.models.
"""

import asyncio
import os
import sys
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config

# Ensure the ai-service root is on sys.path so `db.*` imports resolve
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from db.connection import Base
from db.models import Ticket, TicketEvidence, TicketTimeline, User  # noqa: F401 — ensure models loaded

# Alembic Config object
config = context.config

# Python logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Metadata for autogenerate support — points at our DeclarativeBase
target_metadata = Base.metadata

# Override sqlalchemy.url from DATABASE_URL env var (never hardcode credentials)
DATABASE_URL = os.environ.get("DATABASE_URL", "")
if DATABASE_URL:
    config.set_main_option("sqlalchemy.url", DATABASE_URL)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode — emit SQL to stdout without a live connection."""
    url = config.get_main_option("sqlalchemy.url") or "postgresql+asyncpg://user:pass@localhost/dbname"
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    """Helper: configure context with the given connection and run migrations."""
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in 'online' mode using an async engine."""
    url = config.get_main_option("sqlalchemy.url")
    if not url or url.startswith("driver://"):
        raise RuntimeError(
            "DATABASE_URL not set and no sqlalchemy.url in alembic.ini. "
            "Set DATABASE_URL in your .env file."
        )

    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode — connect to the live database."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
