"""
Async SQLAlchemy connection to Supabase PostgreSQL.
Uses the same DB as the old Laravel app — no data loss, no new migrations for existing tables.
"""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from config import settings

DATABASE_URL = settings.database_url

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_size=10,
    max_overflow=20,
) if DATABASE_URL else None

AsyncSessionLocal = (
    async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    if engine
    else None
)


class Base(DeclarativeBase):
    pass


async def get_db():
    """FastAPI dependency — yields an async DB session."""
    if AsyncSessionLocal is None:
        raise RuntimeError(
            "DATABASE_URL not set — database layer unavailable. "
            "Set DATABASE_URL in your .env file."
        )
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
