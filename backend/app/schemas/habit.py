from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional, List
import uuid
from app.models.habit import HabitFrequency


class HabitCreate(BaseModel):
    name: str
    description: Optional[str] = None
    frequency: HabitFrequency = HabitFrequency.daily
    color: str = "#111111"


class HabitUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    frequency: Optional[HabitFrequency] = None
    color: Optional[str] = None


class HabitLogCreate(BaseModel):
    completion_date: date


class HabitLogResponse(BaseModel):
    id: uuid.UUID
    habit_id: uuid.UUID
    completion_date: date
    completed_at: datetime

    model_config = {"from_attributes": True}


class HabitResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    description: Optional[str] = None
    frequency: HabitFrequency
    color: str
    streak: int = 0
    this_month_count: int = 0
    days_in_month: int = 30
    completed_today: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
