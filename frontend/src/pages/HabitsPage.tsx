import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { habitsService } from '@/services/habits';
import { Habit } from '@/types';
import { HabitModal } from '@/components/habits/HabitModal';
import { Flame, Plus, Check, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';

export const HabitsPage: React.FC = () => {
  const { setCreateHabitModalOpen, addToast } = useUIStore();
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: habits = [], isLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: habitsService.getHabits,
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const handleToggleHabit = async (habitId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await habitsService.toggleHabitLog(habitId, todayStr);
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    } catch {
      addToast({ type: 'error', message: 'Failed to update habit' });
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await habitsService.deleteHabit(id);
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      addToast({ type: 'success', message: 'Habit deleted' });
    } catch {
      addToast({ type: 'error', message: 'Failed to delete habit' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#111111] text-white flex items-center justify-center shadow-md">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary dark:text-neutral-100">Habit Tracker</h1>
            <p className="text-xs text-secondary dark:text-neutral-400 mt-0.5">
              Build lasting discipline through daily and weekly consistency streaks.
            </p>
          </div>
        </div>

        <button
          onClick={() => setCreateHabitModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl shadow-md hover:bg-neutral-800 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Habits List / Cards */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="neu-card p-5 h-20 animate-pulse bg-surface/50" />
          ))}
        </div>
      ) : habits.length === 0 ? (
        <div className="neu-card p-12 text-center text-xs text-secondary border-dashed">
          <Flame className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
          <p className="font-semibold text-primary dark:text-neutral-100">No habits being tracked</p>
          <p className="mt-1 dark:text-neutral-500">Add habits like "Daily Workout", "Reading", or "Meditation".</p>
        </div>
      ) : (
        <div className="space-y-4">
          {habits.map((habit) => (
            <div
              key={habit.id}
              onClick={() => setEditingHabit(habit)}
              className="neu-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-neu-raised transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={(e) => handleToggleHabit(habit.id, e)}
                  className={cn(
                    'w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0',
                    habit.completed_today
                      ? 'bg-[#111111] border-[#111111] text-white shadow-sm'
                      : 'border-neutral-400 hover:border-black dark:border-neutral-600 dark:hover:border-neutral-300 bg-white dark:bg-[#1C1C20]'
                  )}
                  title="Toggle completed today"
                >
                  {habit.completed_today && <Check className="w-4 h-4 stroke-[2.5]" />}
                </button>

                <div>
                  <h3
                    className={cn(
                      'text-sm font-bold text-primary dark:text-neutral-100',
                      habit.completed_today && 'line-through text-secondary dark:text-neutral-500'
                    )}
                  >
                    {habit.name}
                  </h3>
                  {habit.description && (
                    <p className="text-xs text-secondary mt-0.5">{habit.description}</p>
                  )}
                </div>
              </div>

              {/* Stats & Actions */}
              <div className="flex items-center justify-between md:justify-end gap-6 pt-2 md:pt-0 border-t md:border-0 border-black/5 dark:border-white/10">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-secondary dark:text-neutral-500 tracking-wider block">
                      Consistency
                    </span>
                    <span className="text-xs font-bold text-primary dark:text-neutral-100">
                      {habit.this_month_count} / {habit.days_in_month} days
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-secondary dark:text-neutral-500 tracking-wider block">
                      Streak
                    </span>
                    <div className="flex items-center gap-1 text-xs font-bold text-primary dark:text-neutral-100">
                      <Flame className="w-3.5 h-3.5 text-neutral-800" />
                      <span>{habit.streak} days</span>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(menuOpenId === habit.id ? null : habit.id);
                    }}
                    className="p-1.5 text-secondary hover:text-primary rounded-lg transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {menuOpenId === habit.id && (
                    <div
                      className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-[#1C1C20] rounded-xl shadow-lg border border-black/5 dark:border-white/10 py-1 z-20 text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setEditingHabit(habit);
                          setMenuOpenId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 text-left text-primary dark:text-neutral-200"
                      >
                        <Edit2 className="w-3 h-3 text-secondary" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={(e) => {
                          handleDelete(habit.id, e);
                          setMenuOpenId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left text-rose-600"
                      >
                        <Trash2 className="w-3 h-3 text-rose-500" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <HabitModal
        habitToEdit={editingHabit}
        isOpen={!!editingHabit}
        onClose={() => setEditingHabit(null)}
      />
    </div>
  );
};
