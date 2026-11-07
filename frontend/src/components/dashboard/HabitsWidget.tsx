import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { habitsService } from '@/services/habits';
import { Habit } from '@/types';
import { Link } from 'react-router-dom';
import { Flame, Check, ChevronRight, Plus } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { HabitModal } from '@/components/habits/HabitModal';
import { cn } from '@/utils/cn';

export const HabitsWidget: React.FC = () => {
  const { setCreateHabitModalOpen, addToast } = useUIStore();
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const queryClient = useQueryClient();

  const { data: habits = [], isLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: habitsService.getHabits,
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const handleToggleHabit = async (habitId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Optimistic update
    queryClient.setQueryData<Habit[]>(['habits'], (old) => {
      if (!old) return old;
      return old.map((h) => {
        if (h.id !== habitId) return h;
        const newCompleted = !h.completed_today;
        return {
          ...h,
          completed_today: newCompleted,
          this_month_count: newCompleted ? h.this_month_count + 1 : Math.max(0, h.this_month_count - 1),
          streak: newCompleted ? h.streak + 1 : Math.max(0, h.streak - 1),
        };
      });
    });

    try {
      await habitsService.toggleHabitLog(habitId, todayStr);
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    } catch {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      addToast({ type: 'error', message: 'Failed to update habit' });
    }
  };

  return (
    <div className="neu-card p-5 flex flex-col justify-between h-[310px]">
      <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-primary dark:text-neutral-200" />
          <h3 className="text-xs font-bold text-primary dark:text-neutral-100 uppercase tracking-wider">Habits</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateHabitModalOpen(true)}
            className="p-1 text-secondary hover:text-primary dark:text-neutral-400 dark:hover:text-neutral-100 rounded-lg transition-colors"
            title="Add Habit"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <Link
            to="/habits"
            className="flex items-center gap-0.5 text-[11px] font-semibold text-secondary hover:text-primary dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2 space-y-2">
        {isLoading ? (
          <div className="space-y-2 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-black/5 dark:bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : habits.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-xs text-secondary dark:text-neutral-400 py-6">
            <Flame className="w-6 h-6 text-neutral-300 dark:text-neutral-600 mb-1.5" />
            <span>No habits created yet</span>
          </div>
        ) : (
          habits.slice(0, 4).map((habit) => (
            <div
              key={habit.id}
              onClick={() => setEditingHabit(habit)}
              className="flex items-center justify-between p-2.5 rounded-xl bg-surface dark:bg-[#1C1C20] hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer border border-black/5 dark:border-white/10"
            >
              <div className="flex items-center gap-2.5 truncate pr-2">
                <button
                  onClick={(e) => handleToggleHabit(habit.id, e)}
                  className={cn(
                    'w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0',
                    habit.completed_today
                      ? 'bg-[#111111] border-[#111111] text-white shadow-xs'
                      : 'border-neutral-400 hover:border-black dark:border-neutral-600 dark:hover:border-neutral-300 bg-white dark:bg-[#1C1C20]'
                  )}
                >
                  {habit.completed_today && <Check className="w-3 h-3 stroke-[2.5]" />}
                </button>
                <div className="truncate">
                  <p
                    className={cn(
                      'text-xs font-semibold text-primary dark:text-neutral-100 truncate',
                      habit.completed_today && 'line-through text-secondary dark:text-neutral-500'
                    )}
                  >
                    {habit.name}
                  </p>
                  <p className="text-[10px] text-secondary dark:text-neutral-400">
                    {habit.this_month_count}/{habit.days_in_month} days this month
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-bold text-primary dark:text-neutral-100 shrink-0">
                <Flame className="w-3.5 h-3.5 text-neutral-800 dark:text-neutral-200" />
                <span>{habit.streak}d</span>
              </div>
            </div>
          ))
        )}
      </div>

      <HabitModal
        habitToEdit={editingHabit}
        isOpen={!!editingHabit}
        onClose={() => setEditingHabit(null)}
      />
    </div>
  );
};
