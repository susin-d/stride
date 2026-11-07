export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'archived';
export type GoalStatus = 'active' | 'completed' | 'archived';
export type HabitFrequency = 'daily' | 'weekly';
export type SessionType = 'pomodoro' | 'deep_work' | 'short_break' | 'long_break';
export type SessionStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  timezone: string;
  created_at: string;
}

export interface Workspace {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  workspace_id?: string | null;
  project_id?: string | null;
  title: string;
  description?: string | null;
  priority: Priority;
  status: TaskStatus;
  due_date?: string | null;
  due_time?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  subtasks: Subtask[];
}

export interface Project {
  id: string;
  user_id: string;
  workspace_id?: string | null;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  deadline?: string | null;
  task_count: number;
  completed_task_count: number;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  target_value: number;
  current_value: number;
  progress_percent: number;
  deadline?: string | null;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  frequency: HabitFrequency;
  color: string;
  streak: number;
  this_month_count: number;
  days_in_month: number;
  completed_today: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  completion_date: string;
  completed_at: string;
}

export interface FocusSession {
  id: string;
  user_id: string;
  session_type: SessionType;
  planned_duration: number; // in seconds
  actual_duration?: number | null; // in seconds
  paused_duration: number;
  started_at: string;
  paused_at?: string | null;
  ended_at?: string | null;
  status: SessionStatus;
  created_at: string;
}

export interface FocusStatistics {
  today_minutes: number;
  yesterday_minutes: number;
  week_minutes: number;
  total_sessions: number;
  completed_sessions: number;
  today_sessions: number;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface DashboardStats {
  tasks_today: {
    total: number;
    completed: number;
    yesterday_completed: number;
  };
  focus_time: {
    today_minutes: number;
    yesterday_minutes: number;
  };
  goal_progress: {
    overall_percent: number;
    total: number;
    completed: number;
  };
}

export interface WeeklyStats {
  tasks_completed: number;
  tasks_remaining: number;
  focus_minutes: number;
  goal_completion_percent: number;
  habit_consistency_percent: number;
  daily_completions: { date: string; completed: number }[];
}

export interface ProductivityStats {
  daily_averages: {
    date: string;
    tasks_completed: number;
    focus_minutes: number;
  }[];
}
