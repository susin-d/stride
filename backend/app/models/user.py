import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, func
from sqlalchemy.orm import mapped_column, Mapped, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(1024), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    timezone: Mapped[str] = mapped_column(String(64), default="Asia/Kolkata", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    workspaces: Mapped[list["Workspace"]] = relationship(back_populates="user", cascade="all, delete-orphan")  # noqa: F821
    projects: Mapped[list["Project"]] = relationship(back_populates="user", cascade="all, delete-orphan")  # noqa: F821
    tasks: Mapped[list["Task"]] = relationship(back_populates="user", cascade="all, delete-orphan")  # noqa: F821
    goals: Mapped[list["Goal"]] = relationship(back_populates="user", cascade="all, delete-orphan")  # noqa: F821
    habits: Mapped[list["Habit"]] = relationship(back_populates="user", cascade="all, delete-orphan")  # noqa: F821
    focus_sessions: Mapped[list["FocusSession"]] = relationship(back_populates="user", cascade="all, delete-orphan")  # noqa: F821
    notifications: Mapped[list["Notification"]] = relationship(back_populates="user", cascade="all, delete-orphan")  # noqa: F821
    calendar_events: Mapped[list["CalendarEvent"]] = relationship(back_populates="user", cascade="all, delete-orphan")  # noqa: F821
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(back_populates="user", cascade="all, delete-orphan")  # noqa: F821
