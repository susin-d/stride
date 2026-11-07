import uuid
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.models.goal import Goal, GoalStatus


class GoalRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, user_id: uuid.UUID) -> List[Goal]:
        result = await self.db.execute(
            select(Goal).where(Goal.user_id == user_id).order_by(Goal.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, goal_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Goal]:
        result = await self.db.execute(
            select(Goal).where(and_(Goal.id == goal_id, Goal.user_id == user_id))
        )
        return result.scalar_one_or_none()

    async def create(self, user_id: uuid.UUID, **kwargs) -> Goal:
        goal = Goal(user_id=user_id, **kwargs)
        self.db.add(goal)
        await self.db.commit()
        await self.db.refresh(goal)
        return goal

    async def update(self, goal: Goal, **kwargs) -> Goal:
        for key, value in kwargs.items():
            setattr(goal, key, value)
        await self.db.commit()
        await self.db.refresh(goal)
        return goal

    async def delete(self, goal: Goal) -> None:
        await self.db.delete(goal)
        await self.db.commit()

    async def get_overall_progress(self, user_id: uuid.UUID) -> dict:
        result = await self.db.execute(
            select(Goal).where(and_(Goal.user_id == user_id, Goal.status == GoalStatus.active))
        )
        goals = result.scalars().all()
        if not goals:
            return {"overall_percent": 0, "total": 0, "completed": 0}
        completed = sum(1 for g in goals if g.current_value >= g.target_value)
        avg_percent = sum(g.progress_percent for g in goals) / len(goals)
        return {
            "overall_percent": round(avg_percent, 1),
            "total": len(goals),
            "completed": completed,
        }
