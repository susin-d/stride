from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
import uuid


class NotificationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    message: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class DashboardStats(BaseModel):
    tasks_today: dict
    focus_time: dict
    goal_progress: dict


class WeeklyStats(BaseModel):
    tasks_completed: int
    tasks_remaining: int
    focus_minutes: int
    goal_completion_percent: float
    habit_consistency_percent: float
    daily_completions: List[dict]


class ProductivityStats(BaseModel):
    daily_averages: List[dict]
    top_priority: str
    streak_days: int
