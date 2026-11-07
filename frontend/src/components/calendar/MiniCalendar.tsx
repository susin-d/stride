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
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { tasksService } from '@/services/tasks';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';

export const MiniCalendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { setCreateTaskModalOpen } = useUIStore();

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksService.getTasks(),
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Map tasks by date string
  const taskDates = new Set(
    tasks.filter((t) => t.due_date).map((t) => t.due_date!)
  );

  return (
    <div className="neu-card p-4 w-full">
      {/* Month & Nav */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold text-primary tracking-tight">
          {format(currentMonth, 'MMMM yyyy')}
        </h4>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1 text-secondary hover:text-primary hover:bg-black/5 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1 text-secondary hover:text-primary hover:bg-black/5 rounded-lg transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {weekDays.map((wd) => (
          <span key={wd} className="text-[10px] font-semibold text-secondary py-1">
            {wd}
          </span>
        ))}
      </div>

      {/* Day Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((day, idx) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isCurrentToday = isToday(day);
          const hasTasks = taskDates.has(dateStr);

          return (
            <button
              key={idx}
              onClick={() => setSelectedDate(day)}
              className={cn(
                'relative h-7 w-7 mx-auto rounded-lg text-[11px] font-medium flex flex-col items-center justify-center transition-all',
                !isCurrentMonth && 'text-neutral-300',
                isCurrentMonth && !isSelected && 'text-primary hover:bg-black/5',
                isSelected && 'bg-[#111111] text-white font-bold shadow-sm',
                isCurrentToday && !isSelected && 'border border-primary font-bold'
              )}
            >
              <span>{format(day, 'd')}</span>
              {hasTasks && (
                <span
                  className={cn(
                    'absolute bottom-0.5 w-1 h-1 rounded-full',
                    isSelected ? 'bg-white' : 'bg-primary'
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Add Task for Selected Date */}
      <div className="mt-3 pt-3 border-t border-black/5 flex items-center justify-between">
        <span className="text-[11px] text-secondary font-medium">
          {format(selectedDate, 'EEE, MMM d')}
        </span>
        <button
          onClick={() => setCreateTaskModalOpen(true)}
          className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
        >
          <Plus className="w-3 h-3" />
          <span>Add Task</span>
        </button>
      </div>
    </div>
  );
};
