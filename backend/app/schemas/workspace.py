from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import uuid


class WorkspaceCreate(BaseModel):
    name: str
    color: str = "#111111"


class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None


class WorkspaceResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    color: str
    created_at: datetime

    model_config = {"from_attributes": True}
