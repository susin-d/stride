from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import uuid
from app.core.dependencies import get_db, get_current_user
from app.repositories.project_repository import ProjectRepository
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=List[ProjectResponse])
async def list_projects(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = ProjectRepository(db)
    projects = await repo.get_all(current_user.id)
    result = []
    for p in projects:
        counts = await repo.get_task_counts(p.id)
        result.append(ProjectResponse(
            id=p.id, user_id=p.user_id, workspace_id=p.workspace_id,
            name=p.name, description=p.description, status=p.status,
            deadline=p.deadline, created_at=p.created_at, updated_at=p.updated_at,
            **counts,
        ))
    return result


@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(
    data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = ProjectRepository(db)
    project = await repo.create(user_id=current_user.id, **data.model_dump())
    counts = await repo.get_task_counts(project.id)
    return ProjectResponse(
        id=project.id, user_id=project.user_id, workspace_id=project.workspace_id,
        name=project.name, description=project.description, status=project.status,
        deadline=project.deadline, created_at=project.created_at, updated_at=project.updated_at,
        **counts,
    )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = ProjectRepository(db)
    project = await repo.get_by_id(project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    counts = await repo.get_task_counts(project.id)
    return ProjectResponse(
        id=project.id, user_id=project.user_id, workspace_id=project.workspace_id,
        name=project.name, description=project.description, status=project.status,
        deadline=project.deadline, created_at=project.created_at, updated_at=project.updated_at,
        **counts,
    )


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID,
    data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = ProjectRepository(db)
    project = await repo.get_by_id(project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project = await repo.update(project, **data.model_dump(exclude_none=True))
    counts = await repo.get_task_counts(project.id)
    return ProjectResponse(
        id=project.id, user_id=project.user_id, workspace_id=project.workspace_id,
        name=project.name, description=project.description, status=project.status,
        deadline=project.deadline, created_at=project.created_at, updated_at=project.updated_at,
        **counts,
    )


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = ProjectRepository(db)
    project = await repo.get_by_id(project_id, current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await repo.delete(project)
