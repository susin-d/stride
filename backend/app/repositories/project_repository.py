import uuid
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.models.project import Project
from app.models.task import Task, TaskStatus


class ProjectRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, user_id: uuid.UUID) -> List[Project]:
        result = await self.db.execute(
            select(Project).where(Project.user_id == user_id).order_by(Project.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_id(self, project_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Project]:
        result = await self.db.execute(
            select(Project).where(and_(Project.id == project_id, Project.user_id == user_id))
        )
        return result.scalar_one_or_none()

    async def create(self, user_id: uuid.UUID, **kwargs) -> Project:
        project = Project(user_id=user_id, **kwargs)
        self.db.add(project)
        await self.db.commit()
        await self.db.refresh(project)
        return project

    async def update(self, project: Project, **kwargs) -> Project:
        for key, value in kwargs.items():
            setattr(project, key, value)
        await self.db.commit()
        await self.db.refresh(project)
        return project

    async def delete(self, project: Project) -> None:
        await self.db.delete(project)
        await self.db.commit()

    async def get_task_counts(self, project_id: uuid.UUID) -> dict:
        total_result = await self.db.execute(
            select(func.count(Task.id)).where(Task.project_id == project_id)
        )
        done_result = await self.db.execute(
            select(func.count(Task.id)).where(
                and_(Task.project_id == project_id, Task.status == TaskStatus.done)
            )
        )
        return {
            "task_count": total_result.scalar() or 0,
            "completed_task_count": done_result.scalar() or 0,
        }
