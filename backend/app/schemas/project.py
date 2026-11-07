from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional
import uuid
from app.models.project import ProjectStatus


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    workspace_id: Optional[uuid.UUID] = None
    deadline: Optional[date] = None
    status: ProjectStatus = ProjectStatus.active


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    workspace_id: Optional[uuid.UUID] = None
    deadline: Optional[date] = None
    status: Optional[ProjectStatus] = None


class ProjectResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    workspace_id: Optional[uuid.UUID] = None
    name: str
    description: Optional[str] = None
    status: ProjectStatus
    deadline: Optional[date] = None
    task_count: int = 0
    completed_task_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
