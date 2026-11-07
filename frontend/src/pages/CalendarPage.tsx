import React, { useState } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { tasksService } from '@/services/tasks';
import { calendarService } from '@/services/calendar';
import { TaskModal } from '@/components/tasks/TaskModal';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Check } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';

export const CalendarPage: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { setCreateTaskModalOpen } = useUIStore();

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksService.getTasks(),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['calendar-events', currentMonth.getFullYear(), currentMonth.getMonth() + 1],
    queryFn: () =>
      calendarService.getEvents(currentMonth.getFullYear(), currentMonth.getMonth() + 1),
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Selected date's tasks
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedDateTasks = tasks.filter((t) => t.due_date === selectedDateStr);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#111111] text-white flex items-center justify-center shadow-md">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary dark:text-neutral-100">Calendar</h1>
            <p className="text-xs text-secondary dark:text-neutral-400 mt-0.5">
              Comprehensive schedule and monthly timeline view.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 neu-card p-1">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1.5 text-secondary hover:text-primary dark:text-neutral-400 dark:hover:text-neutral-100 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-primary dark:text-neutral-100 min-w-32 text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1.5 text-secondary hover:text-primary dark:text-neutral-400 dark:hover:text-neutral-100 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setCreateTaskModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl shadow-md hover:bg-neutral-800 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Task</span>
          </button>
        </div>
      </div>

      {/* Main Calendar Grid */}
      <div className="neu-card p-5">
        <div className="grid grid-cols-7 gap-px mb-2 text-center">
          {weekDays.map((wd) => (
            <span key={wd} className="text-xs font-bold text-secondary dark:text-neutral-500 py-2">
              {wd.slice(0, 3)}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((day, idx) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayTasks = tasks.filter((t) => t.due_date === dateStr);
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isCurrentToday = isToday(day);

            return (
              <div
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  'min-h-24 p-2 rounded-xl transition-all cursor-pointer flex flex-col justify-between border',
                  !isCurrentMonth ? 'bg-black/[0.01] dark:bg-white/[0.01] border-transparent text-neutral-300 dark:text-neutral-700' : 'bg-surface dark:bg-[#1C1C20] border-black/5 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20',
                  isSelected && 'ring-2 ring-primary dark:ring-neutral-300 shadow-sm bg-white dark:bg-[#252528]',
                  isCurrentToday && !isSelected && 'border-primary/50 dark:border-neutral-300/50'
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-md',
                      isCurrentToday ? 'bg-primary text-white' : 'text-primary'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] text-secondary font-medium">
                      {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
                    </span>
                  )}
                </div>

                <div className="space-y-1 mt-1 overflow-hidden">
                  {dayTasks.slice(0, 2).map((t) => (
                    <div
                      key={t.id}
                      className={cn(
                        'text-[10px] font-medium px-1.5 py-0.5 rounded truncate',
                        t.status === 'done'
                          ? 'line-through text-neutral-400 dark:text-neutral-500 bg-black/5 dark:bg-white/10'
                          : 'bg-primary text-white'
                      )}
                    >
                      {t.title}
                    </div>
                  ))}
                  {dayTasks.length > 2 && (
                    <span className="text-[9px] text-secondary block pl-1">
                      +{dayTasks.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Task Detail Drawer */}
      <div className="neu-card p-5">
        <h3 className="text-xs font-bold text-primary dark:text-neutral-100 uppercase tracking-wider mb-3">
          Tasks Scheduled for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </h3>

        {selectedDateTasks.length === 0 ? (
          <p className="text-xs text-secondary dark:text-neutral-500 py-3">No tasks scheduled for this day.</p>
        ) : (
          <div className="space-y-2">
            {selectedDateTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 rounded-xl bg-surface dark:bg-[#1C1C20] border border-black/5 dark:border-white/10"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full',
                      task.status === 'done' ? 'bg-neutral-300 dark:bg-neutral-600' : 'bg-primary'
                    )}
                  />
                  <span
                    className={cn(
                      'text-xs font-medium text-primary dark:text-neutral-100',
                      task.status === 'done' && 'line-through text-secondary dark:text-neutral-500'
                    )}
                  >
                    {task.title}
                  </span>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary dark:text-neutral-500">
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <TaskModal />
    </div>
  );
};
