import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics';
import { CheckCircle2, Clock, Target, TrendingUp, TrendingDown } from 'lucide-react';
import { CircularProgress } from '@/components/shared/CircularProgress';

export const StatCards: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: analyticsService.getDashboardStats,
  });

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="neu-card p-5 h-28 animate-pulse bg-surface/50" />
        ))}
      </div>
    );
  }

  const { tasks_today, focus_time, goal_progress } = stats;
  const taskPercent =
    tasks_today.total > 0 ? Math.round((tasks_today.completed / tasks_today.total) * 100) : 0;

  const yesterdayDiff = tasks_today.completed - tasks_today.yesterday_completed;
  const focusDiffMinutes = focus_time.today_minutes - focus_time.yesterday_minutes;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* 1. Tasks Today Card */}
      <div className="neu-card p-5 flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-secondary dark:text-neutral-500 uppercase tracking-wider block">
            Tasks Today
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-primary dark:text-neutral-100">{tasks_today.completed}</span>
            <span className="text-xs text-secondary dark:text-neutral-500 font-medium">/ {tasks_today.total} tasks</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-medium text-secondary dark:text-neutral-500 pt-0.5">
            {yesterdayDiff >= 0 ? (
              <span className="text-neutral-800 dark:text-neutral-200 flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +{yesterdayDiff}
              </span>
            ) : (
              <span className="text-neutral-500 flex items-center">
                <TrendingDown className="w-3 h-3 mr-0.5" /> {yesterdayDiff}
              </span>
            )}
            <span>vs yesterday</span>
          </div>
        </div>
        <CircularProgress value={taskPercent} size={50} strokeWidth={4.5} showText />
      </div>

      {/* 2. Focus Time Card */}
      <div className="neu-card p-5 flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-secondary dark:text-neutral-500 uppercase tracking-wider block">
            Focus Time
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-primary dark:text-neutral-100">{focus_time.today_minutes}</span>
            <span className="text-xs text-secondary dark:text-neutral-500 font-medium">minutes</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-medium text-secondary dark:text-neutral-500 pt-0.5">
            {focusDiffMinutes >= 0 ? (
              <span className="text-neutral-800 dark:text-neutral-200 flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +{focusDiffMinutes}m
              </span>
            ) : (
              <span className="text-neutral-500 flex items-center">
                <TrendingDown className="w-3 h-3 mr-0.5" /> {focusDiffMinutes}m
              </span>
            )}
            <span>vs yesterday</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/10 flex items-center justify-center text-primary dark:text-neutral-200">
          <Clock className="w-6 h-6 stroke-[1.75]" />
        </div>
      </div>

      {/* 3. Goal Progress Card */}
      <div className="neu-card p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-secondary dark:text-neutral-500 uppercase tracking-wider">
            Goal Progress
          </span>
          <div className="w-6 h-6 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center text-primary dark:text-neutral-200">
            <Target className="w-3.5 h-3.5 stroke-[2]" />
          </div>
        </div>

        <div className="my-2">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-2xl font-bold text-primary dark:text-neutral-100">
              {Math.round(goal_progress.overall_percent)}%
            </span>
            <span className="text-xs text-secondary dark:text-neutral-500 font-medium">
              {goal_progress.completed} / {goal_progress.total} achieved
            </span>
          </div>
          {/* Horizontal Progress Bar */}
          <div className="w-full h-2 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary dark:bg-neutral-200 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, goal_progress.overall_percent))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
