from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional
import uuid
from app.models.goal import GoalStatus


class GoalCreate(BaseModel):
    title: str
    description: Optional[str] = None
    target_value: float = 100.0
    current_value: float = 0.0
    deadline: Optional[date] = None


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target_value: Optional[float] = None
    current_value: Optional[float] = None
    deadline: Optional[date] = None
    status: Optional[GoalStatus] = None


class GoalResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    description: Optional[str] = None
    target_value: float
    current_value: float
    progress_percent: float
    deadline: Optional[date] = None
    status: GoalStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
