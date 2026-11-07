from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, tasks, projects, goals, habits, focus,
    calendar, workspaces, notifications, analytics,
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(tasks.router)
api_router.include_router(projects.router)
api_router.include_router(goals.router)
api_router.include_router(habits.router)
api_router.include_router(focus.router)
api_router.include_router(calendar.router)
api_router.include_router(workspaces.router)
api_router.include_router(notifications.router)
api_router.include_router(analytics.router)
