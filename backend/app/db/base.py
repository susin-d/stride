from app.models.base import Base  # noqa: F401

# Import all models so Alembic can discover them
from app.models.user import User  # noqa: F401
from app.models.workspace import Workspace  # noqa: F401
from app.models.project import Project  # noqa: F401
from app.models.task import Task, Subtask  # noqa: F401
from app.models.goal import Goal  # noqa: F401
from app.models.habit import Habit, HabitLog  # noqa: F401
from app.models.focus import FocusSession  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.calendar_event import CalendarEvent  # noqa: F401
from app.models.refresh_token import RefreshToken  # noqa: F401
