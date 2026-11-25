"""Schedulable email model for Google Workspace Studio webhook payloads."""

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.db.session import Base
from app.models._shared import generate_uuid, utc_now


class SchedulableEmail(Base):
    __tablename__ = "schedulable_emails"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    sender = Column(String(255), nullable=False)
    subject = Column(String(500), nullable=False)
    body = Column(Text, default="", nullable=False)
    received_at = Column(String(64), nullable=True)
    is_schedulable = Column(Boolean, default=True, nullable=False)
    status = Column(String(32), default="pending", nullable=False)
    scheduled_target = Column(String(32), nullable=True)
    scheduled_ref_id = Column(String(64), nullable=True)
    deleted = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="schedulable_emails")
