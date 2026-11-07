from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import uuid
from app.models.focus import SessionType, SessionStatus


class FocusSessionCreate(BaseModel):
    session_type: SessionType = SessionType.pomodoro
    planned_duration: int  # seconds


class FocusSessionUpdate(BaseModel):
    status: Optional[SessionStatus] = None
    actual_duration: Optional[int] = None


class FocusSessionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    session_type: SessionType
    planned_duration: int
    actual_duration: Optional[int] = None
    paused_duration: int
    started_at: datetime
    paused_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    status: SessionStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class FocusStatistics(BaseModel):
    today_minutes: int
    week_minutes: int
    total_sessions: int
    completed_sessions: int
    today_sessions: int
