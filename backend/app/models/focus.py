import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, Integer, Enum as SAEnum, func
from sqlalchemy.orm import mapped_column, Mapped, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base
import enum


class SessionType(str, enum.Enum):
    pomodoro = "pomodoro"
    deep_work = "deep_work"
    short_break = "short_break"
    long_break = "long_break"


class SessionStatus(str, enum.Enum):
    active = "active"
    paused = "paused"
    completed = "completed"
    cancelled = "cancelled"


class FocusSession(Base):
    __tablename__ = "focus_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    session_type: Mapped[SessionType] = mapped_column(
        SAEnum(SessionType), default=SessionType.pomodoro, nullable=False
    )
    planned_duration: Mapped[int] = mapped_column(Integer, nullable=False)  # seconds
    actual_duration: Mapped[int | None] = mapped_column(Integer, nullable=True)  # seconds
    paused_duration: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # seconds accumulated in pauses
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    paused_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[SessionStatus] = mapped_column(
        SAEnum(SessionStatus), default=SessionStatus.active, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="focus_sessions")  # noqa: F821
