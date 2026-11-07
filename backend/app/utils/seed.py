"""
Demo data seeder for STRIDE.
Run as: python -m app.utils.seed
Or called automatically at container startup.
"""
import asyncio
import sys
import os

# Add backend to path when run directly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from datetime import date, datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select

from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User
from app.models.workspace import Workspace
from app.models.project import Project, ProjectStatus
from app.models.task import Task, Priority, TaskStatus
from app.models.goal import Goal, GoalStatus
from app.models.habit import Habit, HabitLog, HabitFrequency
from app.models.focus import FocusSession, SessionType, SessionStatus
from app.models.notification import Notification
from app.db.base import Base  # ensure all models are registered


async def seed():
    if not settings.SEED_DEMO_DATA:
        print("Seed skipped (SEED_DEMO_DATA=false)")
        return

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        # Check if demo user already exists
        result = await db.execute(select(User).where(User.email == settings.DEMO_USER_EMAIL))
        existing = result.scalar_one_or_none()
        if existing:
            print(f"Demo user {settings.DEMO_USER_EMAIL} already exists. Skipping seed.")
            await engine.dispose()
            return

        print(f"Seeding demo data for {settings.DEMO_USER_EMAIL}...")

        # Create demo user
        user = User(
            name=settings.DEMO_USER_NAME,
            email=settings.DEMO_USER_EMAIL,
            password_hash=hash_password(settings.DEMO_USER_PASSWORD),
            timezone="Asia/Kolkata",
        )
        db.add(user)
        await db.flush()

        # Workspaces
        ws_coding = Workspace(user_id=user.id, name="Coding & Side Projects", color="#111111")
        ws_personal = Workspace(user_id=user.id, name="Personal", color="#555555")
        db.add_all([ws_coding, ws_personal])
        await db.flush()

        # Projects
        proj1 = Project(
            user_id=user.id,
            workspace_id=ws_coding.id,
            name="STRIDE App",
            description="Building the STRIDE productivity application",
            status=ProjectStatus.active,
            deadline=date.today() + timedelta(days=30),
        )
        proj2 = Project(
            user_id=user.id,
            workspace_id=ws_personal.id,
            name="Health & Fitness",
            description="Personal wellness goals",
            status=ProjectStatus.active,
        )
        db.add_all([proj1, proj2])
        await db.flush()

        today = date.today()

        # Tasks
        tasks_data = [
            Task(user_id=user.id, workspace_id=ws_coding.id, project_id=proj1.id,
                 title="Finish project documentation", description="Write comprehensive README and API docs",
                 priority=Priority.high, status=TaskStatus.todo, due_date=today),
            Task(user_id=user.id, workspace_id=ws_coding.id, project_id=proj1.id,
                 title="Code new feature: Habit streaks", description="Implement streak tracking for habits",
                 priority=Priority.high, status=TaskStatus.in_progress, due_date=today),
            Task(user_id=user.id, workspace_id=ws_coding.id,
                 title="Prepare presentation slides", description="Quarterly review deck",
                 priority=Priority.medium, status=TaskStatus.todo, due_date=today),
            Task(user_id=user.id, workspace_id=ws_coding.id, project_id=proj1.id,
                 title="Plan next sprint roadmap", description="Define tickets and milestones for sprint 4",
                 priority=Priority.medium, status=TaskStatus.todo, due_date=today),
            Task(user_id=user.id, workspace_id=ws_personal.id,
                 title="Read deep learning paper", description="Attention Is All You Need — Vaswani et al.",
                 priority=Priority.low, status=TaskStatus.todo, due_date=today),
            Task(user_id=user.id, workspace_id=ws_personal.id, project_id=proj2.id,
                 title="Workout for 30 minutes", description="Upper body + cardio",
                 priority=Priority.low, status=TaskStatus.done, due_date=today,
                 completed_at=datetime.now(timezone.utc) - timedelta(hours=2)),
            Task(user_id=user.id, workspace_id=ws_personal.id, project_id=proj2.id,
                 title="Go for a short walk", description="15-minute evening walk",
                 priority=Priority.low, status=TaskStatus.todo, due_date=today),
            # Upcoming tasks
            Task(user_id=user.id, workspace_id=ws_coding.id, project_id=proj1.id,
                 title="Deploy to production", priority=Priority.high, status=TaskStatus.todo,
                 due_date=today + timedelta(days=2)),
            Task(user_id=user.id, workspace_id=ws_personal.id,
                 title="Grocery shopping", priority=Priority.medium, status=TaskStatus.todo,
                 due_date=today + timedelta(days=1)),
            Task(user_id=user.id, workspace_id=ws_coding.id,
                 title="Write unit tests", priority=Priority.medium, status=TaskStatus.todo,
                 due_date=today + timedelta(days=3)),
            # Yesterday completed
            Task(user_id=user.id, workspace_id=ws_coding.id,
                 title="Fix authentication bug", priority=Priority.high, status=TaskStatus.done,
                 due_date=today - timedelta(days=1),
                 completed_at=datetime.now(timezone.utc) - timedelta(days=1, hours=3)),
            Task(user_id=user.id, workspace_id=ws_coding.id,
                 title="Code review for PR #42", priority=Priority.medium, status=TaskStatus.done,
                 due_date=today - timedelta(days=1),
                 completed_at=datetime.now(timezone.utc) - timedelta(days=1, hours=5)),
        ]
        db.add_all(tasks_data)
        await db.flush()

        # Goals
        goals_data = [
            Goal(user_id=user.id, title="Complete 10 projects this month",
                 description="Ship meaningful side projects", target_value=10, current_value=7,
                 deadline=date(today.year, today.month,
                               __import__('calendar').monthrange(today.year, today.month)[1]),
                 status=GoalStatus.active),
            Goal(user_id=user.id, title="Read 12 books this year",
                 description="One book per month", target_value=12, current_value=8,
                 deadline=date(today.year, 12, 31), status=GoalStatus.active),
            Goal(user_id=user.id, title="Complete 100 workouts",
                 description="Build consistent exercise habit", target_value=100, current_value=43,
                 deadline=date(today.year, 12, 31), status=GoalStatus.active),
        ]
        db.add_all(goals_data)
        await db.flush()

        # Habits
        habits_data = [
            Habit(user_id=user.id, name="Workout", description="Daily exercise session",
                  frequency=HabitFrequency.daily, color="#111111"),
            Habit(user_id=user.id, name="Read", description="Read for at least 30 minutes",
                  frequency=HabitFrequency.daily, color="#333333"),
            Habit(user_id=user.id, name="Meditate", description="10 minutes mindfulness",
                  frequency=HabitFrequency.daily, color="#555555"),
            Habit(user_id=user.id, name="Drink Water", description="8 glasses per day",
                  frequency=HabitFrequency.daily, color="#777777"),
        ]
        db.add_all(habits_data)
        await db.flush()

        # Seed habit logs (past 30 days)
        habit_completion_days = {
            habits_data[0].id: 12,  # Workout: 12/30
            habits_data[1].id: 18,  # Read: 18/30
            habits_data[2].id: 6,   # Meditate: 6/30
            habits_data[3].id: 22,  # Drink Water: 22/30
        }
        import random
        random.seed(42)
        for habit_id, count in habit_completion_days.items():
            past_30 = [today - timedelta(days=i) for i in range(1, 31)]
            selected = random.sample(past_30, min(count, len(past_30)))
            for d in selected:
                db.add(HabitLog(habit_id=habit_id, completion_date=d))

        # Focus sessions (past 7 days)
        for i in range(1, 8):
            d = datetime.now(timezone.utc) - timedelta(days=i, hours=2)
            duration = random.choice([1500, 3000, 900])  # 25min, 50min, 15min
            db.add(FocusSession(
                user_id=user.id,
                session_type=SessionType.pomodoro,
                planned_duration=1500,
                actual_duration=duration,
                started_at=d,
                ended_at=d + timedelta(seconds=duration),
                status=SessionStatus.completed,
            ))

        # Today's focus session
        db.add(FocusSession(
            user_id=user.id,
            session_type=SessionType.deep_work,
            planned_duration=3000,
            actual_duration=2700,
            started_at=datetime.now(timezone.utc) - timedelta(hours=1),
            ended_at=datetime.now(timezone.utc) - timedelta(minutes=15),
            status=SessionStatus.completed,
        ))

        # Welcome notification
        db.add(Notification(
            user_id=user.id,
            title="Welcome to STRIDE! 👋",
            message="Your productivity journey starts now.",
            is_read=False,
        ))

        await db.commit()
        print("✅ Demo data seeded successfully!")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
