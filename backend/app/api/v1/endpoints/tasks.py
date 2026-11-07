from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from datetime import date
import uuid
from app.core.dependencies import get_db, get_current_user_id
from app.repositories.task_repository import TaskRepository
from app.models.task import TaskStatus, Priority
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse, SubtaskCreate, SubtaskResponse

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("", response_model=List[TaskResponse])
async def list_tasks(
    status: Optional[TaskStatus] = Query(None),
    priority: Optional[Priority] = Query(None),
    project_id: Optional[uuid.UUID] = Query(None),
    workspace_id: Optional[uuid.UUID] = Query(None),
    due_date: Optional[date] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0),
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    repo = TaskRepository(db)
    return await repo.get_all(
        user_id=user_id,
        status=status,
        priority=priority,
        project_id=project_id,
        workspace_id=workspace_id,
        due_date=due_date,
        search=search,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=TaskResponse, status_code=201)
async def create_task(
    data: TaskCreate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    repo = TaskRepository(db)
    return await repo.create(user_id=user_id, **data.model_dump())


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    repo = TaskRepository(db)
    task = await repo.get_by_id(task_id, user_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: uuid.UUID,
    data: TaskUpdate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    repo = TaskRepository(db)
    task = await repo.get_by_id(task_id, user_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return await repo.update(task, **data.model_dump(exclude_none=True))


@router.delete("/{task_id}", status_code=204)
async def delete_task(
    task_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    repo = TaskRepository(db)
    task = await repo.get_by_id(task_id, user_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    await repo.delete(task)


@router.post("/{task_id}/complete", response_model=TaskResponse)
async def toggle_complete(
    task_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    repo = TaskRepository(db)
    task = await repo.toggle_complete(task_id, user_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/{task_id}/subtasks", response_model=SubtaskResponse, status_code=201)
async def add_subtask(
    task_id: uuid.UUID,
    data: SubtaskCreate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    repo = TaskRepository(db)
    task = await repo.get_by_id(task_id, user_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return await repo.add_subtask(task_id, data.title)


@router.get("/upcoming/list", response_model=List[TaskResponse])
async def get_upcoming(
    days: int = Query(7, le=30),
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    repo = TaskRepository(db)
    return await repo.get_upcoming_tasks(user_id, days)
