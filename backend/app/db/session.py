from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import create_engine
from app.core.config import settings

# Async engine for the application with connection pooling optimized for Neon PgBouncer
async_engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=15,
    max_overflow=10,
    pool_recycle=300,
    connect_args={
        "statement_cache_size": 0,  # Required for PgBouncer / Neon pooler
        "prepared_statement_cache_size": 0,
    } if "pooler" in settings.DATABASE_URL else {},
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Sync engine for Alembic
sync_engine = create_engine(
    settings.SYNC_DATABASE_URL,
    pool_pre_ping=True,
)
