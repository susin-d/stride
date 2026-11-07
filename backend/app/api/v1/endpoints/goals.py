from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import uuid
from app.core.dependencies import get_db, get_current_user_id
from app.repositories.goal_repository import GoalRepository
from app.schemas.goal import GoalCreate, GoalUpdate, GoalResponse

router = APIRouter(prefix="/goals", tags=["goals"])


def _to_response(goal) -> GoalResponse:
    return GoalResponse(
        id=goal.id, user_id=goal.user_id, title=goal.title,
        description=goal.description, target_value=goal.target_value,
        current_value=goal.current_value, progress_percent=goal.progress_percent,
        deadline=goal.deadline, status=goal.status,
        created_at=goal.created_at, updated_at=goal.updated_at,
    )


@router.get("", response_model=List[GoalResponse])
async def list_goals(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    repo = GoalRepository(db)
    goals = await repo.get_all(user_id)
    return [_to_response(g) for g in goals]


@router.post("", response_model=GoalResponse, status_code=201)
async def create_goal(
    data: GoalCreate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    repo = GoalRepository(db)
    goal = await repo.create(user_id=user_id, **data.model_dump())
    return _to_response(goal)


@router.patch("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: uuid.UUID,
    data: GoalUpdate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    repo = GoalRepository(db)
    goal = await repo.get_by_id(goal_id, user_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    goal = await repo.update(goal, **data.model_dump(exclude_none=True))
    return _to_response(goal)


@router.delete("/{goal_id}", status_code=204)
async def delete_goal(
    goal_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    repo = GoalRepository(db)
    goal = await repo.get_by_id(goal_id, user_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    await repo.delete(goal)
