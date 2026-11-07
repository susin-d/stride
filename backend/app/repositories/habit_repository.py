import uuid
from typing import Optional, List, Dict
from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, extract
from app.models.habit import Habit, HabitLog


class HabitRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, user_id: uuid.UUID) -> List[Habit]:
        result = await self.db.execute(
            select(Habit).where(Habit.user_id == user_id).order_by(Habit.created_at.asc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, habit_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Habit]:
        result = await self.db.execute(
            select(Habit).where(and_(Habit.id == habit_id, Habit.user_id == user_id))
        )
        return result.scalar_one_or_none()

    async def create(self, user_id: uuid.UUID, **kwargs) -> Habit:
        habit = Habit(user_id=user_id, **kwargs)
        self.db.add(habit)
        await self.db.commit()
        await self.db.refresh(habit)
        return habit

    async def update(self, habit: Habit, **kwargs) -> Habit:
        for key, value in kwargs.items():
            setattr(habit, key, value)
        await self.db.commit()
        await self.db.refresh(habit)
        return habit

    async def delete(self, habit: Habit) -> None:
        await self.db.delete(habit)
        await self.db.commit()

    async def log_completion(self, habit_id: uuid.UUID, completion_date: date) -> Optional[HabitLog]:
        result = await self.db.execute(
            select(HabitLog).where(
                and_(HabitLog.habit_id == habit_id, HabitLog.completion_date == completion_date)
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            await self.db.delete(existing)
            await self.db.commit()
            return None
        log = HabitLog(habit_id=habit_id, completion_date=completion_date)
        self.db.add(log)
        await self.db.commit()
        await self.db.refresh(log)
        return log

    async def get_history(self, habit_id: uuid.UUID, limit: int = 90) -> List[HabitLog]:
        result = await self.db.execute(
            select(HabitLog)
            .where(HabitLog.habit_id == habit_id)
            .order_by(HabitLog.completion_date.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    # OPTIMIZED: Fetch all habit stats for a user in a SINGLE query instead of 3x queries per habit!
    async def get_all_enriched(self, user_id: uuid.UUID) -> List[dict]:
        import calendar as cal
        today = date.today()
        days_in_month = cal.monthrange(today.year, today.month)[1]

        # 1. Fetch habits
        habits = await self.get_all(user_id)
        if not habits:
            return []

        habit_ids = [h.id for h in habits]

        # 2. Fetch all logs for these habits in ONE query
        result = await self.db.execute(
            select(HabitLog.habit_id, HabitLog.completion_date)
            .where(HabitLog.habit_id.in_(habit_ids))
            .order_by(HabitLog.completion_date.desc())
        )
        all_logs = result.fetchall()

        # Group logs by habit_id in memory (instant)
        logs_by_habit: Dict[uuid.UUID, List[date]] = {h.id: [] for h in habits}
        for hid, cdate in all_logs:
            logs_by_habit[hid].append(cdate)

        enriched = []
        for h in habits:
            dates = logs_by_habit.get(h.id, [])
            # Calculate streak in memory
            streak = 0
            check_date = today
            for d in dates:
                if d == check_date or d == check_date - timedelta(days=1):
                    streak += 1
                    check_date = d - timedelta(days=1)
                else:
                    break

            # Calculate month count in memory
            month_count = sum(1 for d in dates if d.month == today.month and d.year == today.year)
            completed_today = today in dates

            enriched.append({
                "habit": h,
                "streak": streak,
                "this_month_count": month_count,
                "days_in_month": days_in_month,
                "completed_today": completed_today,
            })

        return enriched
