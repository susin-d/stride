import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, mapped_column, Mapped
from sqlalchemy.dialects.postgresql import UUID


class Base(DeclarativeBase):
    pass


def utcnow():
    return datetime.now(timezone.utc)
