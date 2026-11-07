from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from datetime import datetime, timezone
import uuid
from app.core.dependencies import get_db, get_current_user_id
from app.repositories.focus_repository import FocusRepository
from app.models.focus import SessionStatus
from app.schemas.focus import FocusSessionCreate, FocusSessionUpdate, FocusSessionResponse, FocusStatistics

router = APIRouter(prefix="/focus", tags=["focus"])


@router.get("/sessions", response_model=List[FocusSessionResponse])
async def list_sessions(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    repo = FocusRepository(db)
    return await repo.get_all(user_id)


@router.get("/active", response_model=FocusSessionResponse | None)
async def get_active_session(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    repo = FocusRepository(db)
    return await repo.get_active(user_id)


@router.post("/sessions", response_model=FocusSessionResponse, status_code=201)
async def start_session(
    data: FocusSessionCreate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    repo = FocusRepository(db)
    # Cancel any existing active sessions
    active = await repo.get_active(user_id)
    if active:
        await repo.update(
            active,
            status=SessionStatus.cancelled,
            ended_at=datetime.now(timezone.utc),
        )
    session = await repo.create(
        user_id=user_id,
        session_type=data.session_type,
        planned_duration=data.planned_duration,
        started_at=datetime.now(timezone.utc),
        status=SessionStatus.active,
    )
    return session


@router.patch("/sessions/{session_id}", response_model=FocusSessionResponse)
async def update_session(
    session_id: uuid.UUID,
    data: FocusSessionUpdate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    repo = FocusRepository(db)
    session = await repo.get_by_id(session_id, user_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    updates = {}
    now = datetime.now(timezone.utc)

    if data.status == SessionStatus.paused and session.status == SessionStatus.active:
        updates["status"] = SessionStatus.paused
        updates["paused_at"] = now
    elif data.status == SessionStatus.active and session.status == SessionStatus.paused:
        # Resume: accumulate paused duration
        if session.paused_at:
            paused_secs = int((now - session.paused_at).total_seconds())
            updates["paused_duration"] = session.paused_duration + paused_secs
        updates["status"] = SessionStatus.active
        updates["paused_at"] = None
    elif data.status == SessionStatus.completed:
        if session.paused_at:
            paused_secs = int((now - session.paused_at).total_seconds())
            updates["paused_duration"] = session.paused_duration + paused_secs
        elapsed = int((now - session.started_at).total_seconds()) - (updates.get("paused_duration") or session.paused_duration)
        updates["status"] = SessionStatus.completed
        updates["ended_at"] = now
        updates["actual_duration"] = max(0, elapsed)
    elif data.status == SessionStatus.cancelled:
        updates["status"] = SessionStatus.cancelled
        updates["ended_at"] = now

    return await repo.update(session, **updates)


@router.get("/statistics", response_model=FocusStatistics)
async def get_statistics(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    repo = FocusRepository(db)
    stats = await repo.get_statistics(user_id)
    return FocusStatistics(**stats)
