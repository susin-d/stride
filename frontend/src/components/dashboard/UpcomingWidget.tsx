import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { tasksService } from '@/services/tasks';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ChevronRight } from 'lucide-react';
import { formatShortDate, formatTime } from '@/utils/dates';

export const UpcomingWidget: React.FC = () => {
  const { data: upcomingTasks = [], isLoading } = useQuery({
    queryKey: ['upcoming-tasks'],
    queryFn: () => tasksService.getUpcomingTasks(7),
  });

  return (
    <div className="neu-card p-5 flex flex-col justify-between h-[310px]">
      <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary dark:text-neutral-200" />
          <h3 className="text-xs font-bold text-primary dark:text-neutral-100 uppercase tracking-wider">Upcoming</h3>
        </div>
        <Link
          to="/upcoming"
          className="flex items-center gap-0.5 text-[11px] font-semibold text-secondary hover:text-primary dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors"
        >
          <span>View All</span>
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-2 space-y-2">
        {isLoading ? (
          <div className="space-y-2 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-black/5 dark:bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : upcomingTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-xs text-secondary dark:text-neutral-400 py-6">
            <Clock className="w-6 h-6 text-neutral-300 dark:text-neutral-600 mb-1.5" />
            <span>No upcoming deadlines in the next 7 days</span>
          </div>
        ) : (
          upcomingTasks.slice(0, 4).map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-surface dark:bg-[#1C1C20] hover:bg-black/5 dark:hover:bg-white/5 transition-colors border border-black/5 dark:border-white/10"
            >
              <div className="truncate pr-2">
                <p className="text-xs font-semibold text-primary dark:text-neutral-100 truncate">{task.title}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-secondary dark:text-neutral-400 mt-0.5">
                  <span>{formatShortDate(task.due_date)}</span>
                  {task.due_time && <span>• {formatTime(task.due_time)}</span>}
                </div>
              </div>
              <span
                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                  task.priority === 'high'
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                    : task.priority === 'medium'
                    ? 'bg-neutral-300 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200'
                    : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                }`}
              >
                {task.priority}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
