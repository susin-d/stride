from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
from datetime import datetime
import uuid
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.calendar_event import CalendarEvent
from app.schemas.calendar_event import CalendarEventCreate, CalendarEventUpdate, CalendarEventResponse

router = APIRouter(prefix="/calendar", tags=["calendar"])


@router.get("/events", response_model=List[CalendarEventResponse])
async def list_events(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(CalendarEvent).where(CalendarEvent.user_id == current_user.id)
    if year and month:
        from datetime import date
        import calendar as cal
        last_day = cal.monthrange(year, month)[1]
        start = datetime(year, month, 1)
        end = datetime(year, month, last_day, 23, 59, 59)
        q = q.where(and_(CalendarEvent.start_time >= start, CalendarEvent.start_time <= end))
    q = q.order_by(CalendarEvent.start_time.asc())
    result = await db.execute(q)
    return list(result.scalars().all())


@router.post("/events", response_model=CalendarEventResponse, status_code=201)
async def create_event(
    data: CalendarEventCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event = CalendarEvent(user_id=current_user.id, **data.model_dump())
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


@router.patch("/events/{event_id}", response_model=CalendarEventResponse)
async def update_event(
    event_id: uuid.UUID,
    data: CalendarEventUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CalendarEvent).where(
            and_(CalendarEvent.id == event_id, CalendarEvent.user_id == current_user.id)
        )
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    for key, value in data.model_dump(exclude_none=True).items():
        setattr(event, key, value)
    await db.commit()
    await db.refresh(event)
    return event


@router.delete("/events/{event_id}", status_code=204)
async def delete_event(
    event_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CalendarEvent).where(
            and_(CalendarEvent.id == event_id, CalendarEvent.user_id == current_user.id)
        )
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    await db.delete(event)
    await db.commit()
