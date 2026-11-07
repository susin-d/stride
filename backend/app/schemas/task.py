from pydantic import BaseModel
from datetime import datetime, date, time
from typing import Optional, List
import uuid
from app.models.task import Priority, TaskStatus


class SubtaskCreate(BaseModel):
    title: str


class SubtaskResponse(BaseModel):
    id: uuid.UUID
    task_id: uuid.UUID
    title: str
    is_completed: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class SubtaskUpdate(BaseModel):
    title: Optional[str] = None
    is_completed: Optional[bool] = None


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Priority = Priority.medium
    status: TaskStatus = TaskStatus.todo
    due_date: Optional[date] = None
    due_time: Optional[time] = None
    workspace_id: Optional[uuid.UUID] = None
    project_id: Optional[uuid.UUID] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[Priority] = None
    status: Optional[TaskStatus] = None
    due_date: Optional[date] = None
    due_time: Optional[time] = None
    workspace_id: Optional[uuid.UUID] = None
    project_id: Optional[uuid.UUID] = None


class TaskResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    workspace_id: Optional[uuid.UUID] = None
    project_id: Optional[uuid.UUID] = None
    title: str
    description: Optional[str] = None
    priority: Priority
    status: TaskStatus
    due_date: Optional[date] = None
    due_time: Optional[time] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    subtasks: List[SubtaskResponse] = []

    model_config = {"from_attributes": True}


class TaskFilter(BaseModel):
    status: Optional[TaskStatus] = None
    priority: Optional[Priority] = None
    project_id: Optional[uuid.UUID] = None
    workspace_id: Optional[uuid.UUID] = None
    due_date: Optional[date] = None
    search: Optional[str] = None
