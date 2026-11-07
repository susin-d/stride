import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics';
import { useUIStore } from '@/store/uiStore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { BarChart2, CheckCircle, Clock, Target, Flame } from 'lucide-react';
import { formatShortDate } from '@/utils/dates';

export const WeeklyReviewPage: React.FC = () => {
  const { theme } = useUIStore();
  const { data: weekly, isLoading } = useQuery({
    queryKey: ['weekly-analytics'],
    queryFn: analyticsService.getWeeklyStats,
  });

  if (isLoading || !weekly) {
    return (
      <div className="space-y-6">
        <div className="neu-card p-6 h-28 animate-pulse bg-surface/50" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="neu-card p-5 h-28 animate-pulse bg-surface/50" />
          ))}
        </div>
      </div>
    );
  }

  const chartData = weekly.daily_completions.map((item) => ({
    name: formatShortDate(item.date),
    completed: item.completed,
  }));

  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#111111] dark:bg-white text-white dark:text-black flex items-center justify-center shadow-md">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary dark:text-neutral-100">Weekly Review</h1>
            <p className="text-xs text-secondary dark:text-neutral-400 mt-0.5">
              Reflect on your achievements and measure weekly output consistency.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Tasks completed */}
        <div className="neu-card p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-secondary dark:text-neutral-400 uppercase tracking-wider">
              Completed
            </span>
            <CheckCircle className="w-4 h-4 text-primary dark:text-neutral-200" />
          </div>
          <p className="text-2xl font-bold text-primary dark:text-neutral-100">{weekly.tasks_completed}</p>
          <p className="text-[11px] text-secondary dark:text-neutral-400">{weekly.tasks_remaining} tasks remaining</p>
        </div>

        {/* Focus time */}
        <div className="neu-card p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-secondary dark:text-neutral-400 uppercase tracking-wider">
              Focus Time
            </span>
            <Clock className="w-4 h-4 text-primary dark:text-neutral-200" />
          </div>
          <p className="text-2xl font-bold text-primary dark:text-neutral-100">{weekly.focus_minutes}m</p>
          <p className="text-[11px] text-secondary dark:text-neutral-400">
            {(weekly.focus_minutes / 60).toFixed(1)} hours logged
          </p>
        </div>

        {/* Goal progress */}
        <div className="neu-card p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-secondary dark:text-neutral-400 uppercase tracking-wider">
              Goal Progress
            </span>
            <Target className="w-4 h-4 text-primary dark:text-neutral-200" />
          </div>
          <p className="text-2xl font-bold text-primary dark:text-neutral-100">
            {Math.round(weekly.goal_completion_percent)}%
          </p>
          <p className="text-[11px] text-secondary dark:text-neutral-400">Overall average</p>
        </div>

        {/* Habit consistency */}
        <div className="neu-card p-5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-secondary dark:text-neutral-400 uppercase tracking-wider">
              Habit Score
            </span>
            <Flame className="w-4 h-4 text-primary dark:text-neutral-200" />
          </div>
          <p className="text-2xl font-bold text-primary dark:text-neutral-100">
            {Math.round(weekly.habit_consistency_percent)}%
          </p>
          <p className="text-[11px] text-secondary dark:text-neutral-400">Weekly adherence</p>
        </div>
      </div>

      {/* Chart: Daily Task Completion */}
      <div className="neu-card p-6">
        <h3 className="text-xs font-bold text-primary dark:text-neutral-100 uppercase tracking-wider mb-6">
          Daily Tasks Completed (Last 7 Days)
        </h3>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#27272A' : '#E5E5EA'} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: isDark ? '#A1A1AA' : '#77777D' }}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: isDark ? '#A1A1AA' : '#77777D' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#27272A' : '#111111',
                  borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.1)',
                  borderRadius: '0.75rem',
                  fontSize: '11px',
                  color: '#FFFFFF',
                }}
                itemStyle={{ color: '#FFFFFF' }}
              />
              <Bar dataKey="completed" fill={isDark ? '#F4F4F6' : '#111111'} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
