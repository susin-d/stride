from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import uuid


class CalendarEventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    color: str = "#111111"


class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    color: Optional[str] = None


class CalendarEventResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    color: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
