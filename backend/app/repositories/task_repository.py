import uuid
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, cast, Date
from sqlalchemy.orm import selectinload
from datetime import date, datetime, timezone
from app.models.task import Task, Subtask, TaskStatus, Priority


class TaskRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(
        self,
        user_id: uuid.UUID,
        status: Optional[TaskStatus] = None,
        priority: Optional[Priority] = None,
        project_id: Optional[uuid.UUID] = None,
        workspace_id: Optional[uuid.UUID] = None,
        due_date: Optional[date] = None,
        search: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Task]:
        q = select(Task).options(selectinload(Task.subtasks)).where(Task.user_id == user_id)
        if status:
            q = q.where(Task.status == status)
        if priority:
            q = q.where(Task.priority == priority)
        if project_id:
            q = q.where(Task.project_id == project_id)
        if workspace_id:
            q = q.where(Task.workspace_id == workspace_id)
        if due_date:
            q = q.where(Task.due_date == due_date)
        if search:
            q = q.where(
                or_(
                    Task.title.ilike(f"%{search}%"),
                    Task.description.ilike(f"%{search}%"),
                )
            )
        q = q.order_by(Task.created_at.desc()).limit(limit).offset(offset)
        result = await self.db.execute(q)
        return list(result.scalars().all())

    async def get_by_id(self, task_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Task]:
        result = await self.db.execute(
            select(Task)
            .options(selectinload(Task.subtasks))
            .where(and_(Task.id == task_id, Task.user_id == user_id))
        )
        return result.scalar_one_or_none()

    async def create(self, user_id: uuid.UUID, **kwargs) -> Task:
        task = Task(user_id=user_id, **kwargs)
        self.db.add(task)
        await self.db.commit()
        created = await self.get_by_id(task.id, user_id)
        return created or task

    async def update(self, task: Task, **kwargs) -> Task:
        for key, value in kwargs.items():
            setattr(task, key, value)
        await self.db.commit()
        updated = await self.get_by_id(task.id, task.user_id)
        return updated or task

    async def toggle_complete(self, task_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Task]:
        task = await self.get_by_id(task_id, user_id)
        if not task:
            return None
        now = datetime.now(timezone.utc)
        if task.status == TaskStatus.done:
            task.status = TaskStatus.todo
            task.completed_at = None
        else:
            task.status = TaskStatus.done
            task.completed_at = now
        task.updated_at = now
        await self.db.commit()
        return await self.get_by_id(task_id, user_id)

    async def delete(self, task: Task) -> None:
        await self.db.delete(task)
        await self.db.commit()

    async def get_today_tasks(self, user_id: uuid.UUID) -> List[Task]:
        today = date.today()
        result = await self.db.execute(
            select(Task)
            .options(selectinload(Task.subtasks))
            .where(and_(Task.user_id == user_id, Task.due_date == today))
            .order_by(Task.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_upcoming_tasks(self, user_id: uuid.UUID, days: int = 7) -> List[Task]:
        from datetime import timedelta
        today = date.today()
        end = today + timedelta(days=days)
        result = await self.db.execute(
            select(Task)
            .options(selectinload(Task.subtasks))
            .where(
                and_(
                    Task.user_id == user_id,
                    Task.due_date >= today,
                    Task.due_date <= end,
                    Task.status != TaskStatus.done,
                )
            )
            .order_by(Task.due_date.asc())
            .limit(10)
        )
        return list(result.scalars().all())

    async def add_subtask(self, task_id: uuid.UUID, title: str) -> Subtask:
        subtask = Subtask(task_id=task_id, title=title)
        self.db.add(subtask)
        await self.db.commit()
        await self.db.refresh(subtask)
        return subtask
