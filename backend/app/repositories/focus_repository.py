import uuid
from typing import Optional, List
from datetime import datetime, timezone, date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, cast, Date, extract
from app.models.focus import FocusSession, SessionStatus


class FocusRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, user_id: uuid.UUID, limit: int = 50) -> List[FocusSession]:
        result = await self.db.execute(
            select(FocusSession)
            .where(FocusSession.user_id == user_id)
            .order_by(FocusSession.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_active(self, user_id: uuid.UUID) -> Optional[FocusSession]:
        result = await self.db.execute(
            select(FocusSession).where(
                and_(
                    FocusSession.user_id == user_id,
                    FocusSession.status.in_([SessionStatus.active, SessionStatus.paused]),
                )
            )
        )
        return result.scalar_one_or_none()

    async def get_by_id(self, session_id: uuid.UUID, user_id: uuid.UUID) -> Optional[FocusSession]:
        result = await self.db.execute(
            select(FocusSession).where(
                and_(FocusSession.id == session_id, FocusSession.user_id == user_id)
            )
        )
        return result.scalar_one_or_none()

    async def create(self, user_id: uuid.UUID, **kwargs) -> FocusSession:
        session = FocusSession(user_id=user_id, **kwargs)
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)
        return session

    async def update(self, session: FocusSession, **kwargs) -> FocusSession:
        for key, value in kwargs.items():
            setattr(session, key, value)
        await self.db.commit()
        await self.db.refresh(session)
        return session

    async def get_statistics(self, user_id: uuid.UUID) -> dict:
        today = date.today()
        week_start = today - timedelta(days=today.weekday())

        # Today's focus time (completed sessions only)
        today_result = await self.db.execute(
            select(func.coalesce(func.sum(FocusSession.actual_duration), 0)).where(
                and_(
                    FocusSession.user_id == user_id,
                    FocusSession.status == SessionStatus.completed,
                    cast(FocusSession.started_at, Date) == today,
                )
            )
        )
        today_seconds = today_result.scalar() or 0

        # Week focus time
        week_result = await self.db.execute(
            select(func.coalesce(func.sum(FocusSession.actual_duration), 0)).where(
                and_(
                    FocusSession.user_id == user_id,
                    FocusSession.status == SessionStatus.completed,
                    cast(FocusSession.started_at, Date) >= week_start,
                )
            )
        )
        week_seconds = week_result.scalar() or 0

        # Yesterday focus time
        yesterday = today - timedelta(days=1)
        yesterday_result = await self.db.execute(
            select(func.coalesce(func.sum(FocusSession.actual_duration), 0)).where(
                and_(
                    FocusSession.user_id == user_id,
                    FocusSession.status == SessionStatus.completed,
                    cast(FocusSession.started_at, Date) == yesterday,
                )
            )
        )
        yesterday_seconds = yesterday_result.scalar() or 0

        # Session counts
        total_result = await self.db.execute(
            select(func.count(FocusSession.id)).where(FocusSession.user_id == user_id)
        )
        completed_result = await self.db.execute(
            select(func.count(FocusSession.id)).where(
                and_(
                    FocusSession.user_id == user_id,
                    FocusSession.status == SessionStatus.completed,
                )
            )
        )
        today_count_result = await self.db.execute(
            select(func.count(FocusSession.id)).where(
                and_(
                    FocusSession.user_id == user_id,
                    cast(FocusSession.started_at, Date) == today,
                )
            )
        )

        return {
            "today_minutes": today_seconds // 60,
            "yesterday_minutes": yesterday_seconds // 60,
            "week_minutes": week_seconds // 60,
            "total_sessions": total_result.scalar() or 0,
            "completed_sessions": completed_result.scalar() or 0,
            "today_sessions": today_count_result.scalar() or 0,
        }
