from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, cast, Date, extract, case
from datetime import date, timedelta
import asyncio
import uuid
from app.core.dependencies import get_db, get_current_user_id
from app.models.task import Task, TaskStatus
from app.models.focus import FocusSession, SessionStatus
from app.models.habit import Habit, HabitLog
from app.models.goal import Goal, GoalStatus

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard")
async def dashboard_stats(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    yesterday = today - timedelta(days=1)

    # 1. Consolidated Tasks Query: Get total today, completed today, completed yesterday in ONE query!
    tasks_stmt = select(
        func.count(case((Task.due_date == today, Task.id))).label("total_today"),
        func.count(case((and_(Task.due_date == today, Task.status == TaskStatus.done), Task.id))).label("done_today"),
        func.count(case((and_(Task.due_date == yesterday, Task.status == TaskStatus.done), Task.id))).label("done_yesterday"),
    ).where(Task.user_id == user_id)

    # 2. Consolidated Focus Query: Today & yesterday minutes in ONE query!
    focus_stmt = select(
        func.coalesce(
            func.sum(
                case(
                    (and_(cast(FocusSession.started_at, Date) == today, FocusSession.status == SessionStatus.completed), FocusSession.actual_duration)
                )
            ),
            0
        ).label("today_seconds"),
        func.coalesce(
            func.sum(
                case(
                    (and_(cast(FocusSession.started_at, Date) == yesterday, FocusSession.status == SessionStatus.completed), FocusSession.actual_duration)
                )
            ),
            0
        ).label("yesterday_seconds"),
    ).where(FocusSession.user_id == user_id)

    # 3. Consolidated Goal Query: Overall progress
    goals_stmt = select(Goal).where(and_(Goal.user_id == user_id, Goal.status == GoalStatus.active))

    # Execute all 3 consolidated queries
    task_res = await db.execute(tasks_stmt)
    task_row = task_res.one()

    focus_res = await db.execute(focus_stmt)
    focus_row = focus_res.one()

    goals_res = await db.execute(goals_stmt)
    goals = goals_res.scalars().all()

    if goals:
        completed_goals = sum(1 for g in goals if g.current_value >= g.target_value)
        avg_percent = sum(g.progress_percent for g in goals) / len(goals)
        goal_data = {
            "overall_percent": round(avg_percent, 1),
            "total": len(goals),
            "completed": completed_goals,
        }
    else:
        goal_data = {"overall_percent": 0.0, "total": 0, "completed": 0}

    return {
        "tasks_today": {
            "total": task_row.total_today or 0,
            "completed": task_row.done_today or 0,
            "yesterday_completed": task_row.done_yesterday or 0,
        },
        "focus_time": {
            "today_minutes": (focus_row.today_seconds or 0) // 60,
            "yesterday_minutes": (focus_row.yesterday_seconds or 0) // 60,
        },
        "goal_progress": goal_data,
    }


@router.get("/weekly")
async def weekly_stats(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    # Consolidated Weekly Query
    agg_stmt = select(
        func.count(case((and_(Task.status == TaskStatus.done, cast(Task.completed_at, Date) >= week_start), Task.id))).label("done_week"),
        func.count(case((and_(Task.status != TaskStatus.done, Task.due_date >= week_start, Task.due_date <= today), Task.id))).label("remaining_week"),
    ).where(Task.user_id == user_id)

    agg_res = await db.execute(agg_stmt)
    agg_row = agg_res.one()

    focus_stmt = select(
        func.coalesce(func.sum(FocusSession.actual_duration), 0)
    ).where(
        and_(
            FocusSession.user_id == user_id,
            FocusSession.status == SessionStatus.completed,
            cast(FocusSession.started_at, Date) >= week_start,
        )
    )
    focus_res = await db.execute(focus_stmt)
    focus_seconds = focus_res.scalar() or 0

    goals_stmt = select(Goal).where(and_(Goal.user_id == user_id, Goal.status == GoalStatus.active))
    goals_res = await db.execute(goals_stmt)
    goals = goals_res.scalars().all()
    avg_goal_percent = sum(g.progress_percent for g in goals) / len(goals) if goals else 0.0

    # Habit consistency
    habits_stmt = select(Habit).where(Habit.user_id == user_id)
    habits_res = await db.execute(habits_stmt)
    habits = habits_res.scalars().all()
    habit_percent = 0.0
    if habits:
        days_so_far = max(1, (today - week_start).days + 1)
        total_possible = len(habits) * days_so_far
        logs_res = await db.execute(
            select(func.count(HabitLog.id))
            .join(Habit, HabitLog.habit_id == Habit.id)
            .where(
                and_(
                    Habit.user_id == user_id,
                    HabitLog.completion_date >= week_start,
                    HabitLog.completion_date <= today,
                )
            )
        )
        total_logs = logs_res.scalar() or 0
        habit_percent = round((total_logs / total_possible) * 100, 1) if total_possible > 0 else 0.0

    # Daily completions (last 7 days in single query)
    seven_days_ago = today - timedelta(days=6)
    daily_stmt = (
        select(cast(Task.completed_at, Date).label("d"), func.count(Task.id).label("cnt"))
        .where(
            and_(
                Task.user_id == user_id,
                Task.status == TaskStatus.done,
                cast(Task.completed_at, Date) >= seven_days_ago,
            )
        )
        .group_by(cast(Task.completed_at, Date))
    )
    daily_res = await db.execute(daily_stmt)
    counts_by_date = {row.d: row.cnt for row in daily_res.all()}

    daily = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        daily.append({"date": str(d), "completed": counts_by_date.get(d, 0)})

    return {
        "tasks_completed": agg_row.done_week or 0,
        "tasks_remaining": agg_row.remaining_week or 0,
        "focus_minutes": focus_seconds // 60,
        "goal_completion_percent": round(avg_goal_percent, 1),
        "habit_consistency_percent": habit_percent,
        "daily_completions": daily,
    }


@router.get("/productivity")
async def productivity_stats(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    thirty_days_ago = today - timedelta(days=29)

    # 1 query for tasks
    t_stmt = (
        select(cast(Task.completed_at, Date).label("d"), func.count(Task.id).label("cnt"))
        .where(
            and_(
                Task.user_id == user_id,
                Task.status == TaskStatus.done,
                cast(Task.completed_at, Date) >= thirty_days_ago,
            )
        )
        .group_by(cast(Task.completed_at, Date))
    )
    t_res = await db.execute(t_stmt)
    tasks_map = {row.d: row.cnt for row in t_res.all()}

    # 1 query for focus
    f_stmt = (
        select(cast(FocusSession.started_at, Date).label("d"), func.sum(FocusSession.actual_duration).label("dur"))
        .where(
            and_(
                FocusSession.user_id == user_id,
                FocusSession.status == SessionStatus.completed,
                cast(FocusSession.started_at, Date) >= thirty_days_ago,
            )
        )
        .group_by(cast(FocusSession.started_at, Date))
    )
    f_res = await db.execute(f_stmt)
    focus_map = {row.d: (row.dur or 0) // 60 for row in f_res.all()}

    daily = []
    for i in range(29, -1, -1):
        d = today - timedelta(days=i)
        daily.append({
            "date": str(d),
            "tasks_completed": tasks_map.get(d, 0),
            "focus_minutes": focus_map.get(d, 0),
        })

    return {"daily_averages": daily}
