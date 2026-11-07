from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List
import uuid
from app.core.dependencies import get_db, get_current_user_id
from app.models.workspace import Workspace
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate, WorkspaceResponse

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


@router.get("", response_model=List[WorkspaceResponse])
async def list_workspaces(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Workspace).where(Workspace.user_id == user_id).order_by(Workspace.created_at.asc())
    )
    return list(result.scalars().all())


@router.post("", response_model=WorkspaceResponse, status_code=201)
async def create_workspace(
    data: WorkspaceCreate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    ws = Workspace(user_id=user_id, **data.model_dump())
    db.add(ws)
    await db.commit()
    await db.refresh(ws)
    return ws


@router.patch("/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace(
    workspace_id: uuid.UUID,
    data: WorkspaceUpdate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Workspace).where(
            and_(Workspace.id == workspace_id, Workspace.user_id == user_id)
        )
    )
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    for key, value in data.model_dump(exclude_none=True).items():
        setattr(ws, key, value)
    await db.commit()
    await db.refresh(ws)
    return ws


@router.delete("/{workspace_id}", status_code=204)
async def delete_workspace(
    workspace_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Workspace).where(
            and_(Workspace.id == workspace_id, Workspace.user_id == user_id)
        )
    )
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    await db.delete(ws)
    await db.commit()
