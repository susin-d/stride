from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from datetime import date
import uuid
import calendar as cal
from app.core.dependencies import get_db, get_current_user
from app.repositories.habit_repository import HabitRepository
from app.models.user import User
from app.schemas.habit import HabitCreate, HabitUpdate, HabitResponse, HabitLogCreate, HabitLogResponse

router = APIRouter(prefix="/habits", tags=["habits"])


@router.get("", response_model=List[HabitResponse])
async def list_habits(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = HabitRepository(db)
    items = await repo.get_all_enriched(current_user.id)
    return [
        HabitResponse(
            id=item["habit"].id,
            user_id=item["habit"].user_id,
            name=item["habit"].name,
            description=item["habit"].description,
            frequency=item["habit"].frequency,
            color=item["habit"].color,
            streak=item["streak"],
            this_month_count=item["this_month_count"],
            days_in_month=item["days_in_month"],
            completed_today=item["completed_today"],
            created_at=item["habit"].created_at,
            updated_at=item["habit"].updated_at,
        )
        for item in items
    ]


@router.post("", response_model=HabitResponse, status_code=201)
async def create_habit(
    data: HabitCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = HabitRepository(db)
    habit = await repo.create(user_id=current_user.id, **data.model_dump())
    today = date.today()
    days_in_month = cal.monthrange(today.year, today.month)[1]
    return HabitResponse(
        id=habit.id, user_id=habit.user_id, name=habit.name,
        description=habit.description, frequency=habit.frequency,
        color=habit.color, streak=0, this_month_count=0,
        days_in_month=days_in_month, completed_today=False,
        created_at=habit.created_at, updated_at=habit.updated_at,
    )


@router.patch("/{habit_id}", response_model=HabitResponse)
async def update_habit(
    habit_id: uuid.UUID,
    data: HabitUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = HabitRepository(db)
    habit = await repo.get_by_id(habit_id, current_user.id)
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    habit = await repo.update(habit, **data.model_dump(exclude_none=True))
    today = date.today()
    days_in_month = cal.monthrange(today.year, today.month)[1]
    return HabitResponse(
        id=habit.id, user_id=habit.user_id, name=habit.name,
        description=habit.description, frequency=habit.frequency,
        color=habit.color, streak=0, this_month_count=0,
        days_in_month=days_in_month, completed_today=False,
        created_at=habit.created_at, updated_at=habit.updated_at,
    )


@router.delete("/{habit_id}", status_code=204)
async def delete_habit(
    habit_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = HabitRepository(db)
    habit = await repo.get_by_id(habit_id, current_user.id)
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    await repo.delete(habit)


@router.post("/{habit_id}/logs", status_code=200)
async def log_habit(
    habit_id: uuid.UUID,
    data: HabitLogCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = HabitRepository(db)
    habit = await repo.get_by_id(habit_id, current_user.id)
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    log = await repo.log_completion(habit_id, data.completion_date)
    return {"logged": log is not None, "date": str(data.completion_date)}


@router.get("/{habit_id}/history", response_model=List[HabitLogResponse])
async def get_history(
    habit_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = HabitRepository(db)
    habit = await repo.get_by_id(habit_id, current_user.id)
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    return await repo.get_history(habit_id)
