"""initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-11-07 04:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(1024), nullable=False),
        sa.Column('avatar_url', sa.String(1024), nullable=True),
        sa.Column('timezone', sa.String(64), server_default='Asia/Kolkata', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # 2. workspaces
    op.create_table(
        'workspaces',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('color', sa.String(32), server_default='#111111', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index(op.f('ix_workspaces_user_id'), 'workspaces', ['user_id'])

    # 3. projects
    project_status = sa.Enum('active', 'completed', 'on_hold', 'archived', name='projectstatus')
    op.create_table(
        'projects',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workspaces.id', ondelete='SET NULL'), nullable=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', project_status, server_default='active', nullable=False),
        sa.Column('deadline', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index(op.f('ix_projects_user_id'), 'projects', ['user_id'])

    # 4. tasks
    task_priority = sa.Enum('low', 'medium', 'high', name='priority')
    task_status = sa.Enum('todo', 'in_progress', 'done', name='taskstatus')
    op.create_table(
        'tasks',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('workspace_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workspaces.id', ondelete='SET NULL'), nullable=True),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('projects.id', ondelete='SET NULL'), nullable=True),
        sa.Column('title', sa.String(512), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('priority', task_priority, server_default='medium', nullable=False),
        sa.Column('status', task_status, server_default='todo', nullable=False),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('due_time', sa.Time(), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index(op.f('ix_tasks_user_id'), 'tasks', ['user_id'])
    op.create_index(op.f('ix_tasks_due_date'), 'tasks', ['due_date'])
    op.create_index(op.f('ix_tasks_project_id'), 'tasks', ['project_id'])

    # 5. subtasks
    op.create_table(
        'subtasks',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('task_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tasks.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(512), nullable=False),
        sa.Column('is_completed', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index(op.f('ix_subtasks_task_id'), 'subtasks', ['task_id'])

    # 6. goals
    goal_status = sa.Enum('active', 'completed', 'archived', name='goalstatus')
    op.create_table(
        'goals',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(512), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('target_value', sa.Float(), server_default='100.0', nullable=False),
        sa.Column('current_value', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('deadline', sa.Date(), nullable=True),
        sa.Column('status', goal_status, server_default='active', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index(op.f('ix_goals_user_id'), 'goals', ['user_id'])

    # 7. habits & habit_logs
    habit_frequency = sa.Enum('daily', 'weekly', name='habitfrequency')
    op.create_table(
        'habits',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('frequency', habit_frequency, server_default='daily', nullable=False),
        sa.Column('color', sa.String(32), server_default='#111111', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index(op.f('ix_habits_user_id'), 'habits', ['user_id'])

    op.create_table(
        'habit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('habit_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('habits.id', ondelete='CASCADE'), nullable=False),
        sa.Column('completion_date', sa.Date(), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index(op.f('ix_habit_logs_habit_id'), 'habit_logs', ['habit_id'])

    # 8. focus_sessions
    session_type = sa.Enum('pomodoro', 'deep_work', 'short_break', 'long_break', name='sessiontype')
    session_status = sa.Enum('active', 'paused', 'completed', 'cancelled', name='sessionstatus')
    op.create_table(
        'focus_sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('session_type', session_type, server_default='pomodoro', nullable=False),
        sa.Column('planned_duration', sa.Integer(), nullable=False),
        sa.Column('actual_duration', sa.Integer(), nullable=True),
        sa.Column('paused_duration', sa.Integer(), server_default='0', nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('paused_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', session_status, server_default='active', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index(op.f('ix_focus_sessions_user_id'), 'focus_sessions', ['user_id'])

    # 9. notifications
    op.create_table(
        'notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('is_read', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index(op.f('ix_notifications_user_id'), 'notifications', ['user_id'])

    # 10. calendar_events
    op.create_table(
        'calendar_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(512), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('start_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('color', sa.String(32), server_default='#111111', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index(op.f('ix_calendar_events_user_id'), 'calendar_events', ['user_id'])

    # 11. refresh_tokens
    op.create_table(
        'refresh_tokens',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('token_hash', sa.String(1024), nullable=False, unique=True),
        sa.Column('is_revoked', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index(op.f('ix_refresh_tokens_user_id'), 'refresh_tokens', ['user_id'])


def downgrade() -> None:
    op.drop_table('refresh_tokens')
    op.drop_table('calendar_events')
    op.drop_table('notifications')
    op.drop_table('focus_sessions')
    op.drop_table('habit_logs')
    op.drop_table('habits')
    op.drop_table('goals')
    op.drop_table('subtasks')
    op.drop_table('tasks')
    op.drop_table('projects')
    op.drop_table('workspaces')
    op.drop_table('users')
