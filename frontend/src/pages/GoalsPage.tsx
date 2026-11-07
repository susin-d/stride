import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { goalsService } from '@/services/goals';
import { Goal } from '@/types';
import { GoalModal } from '@/components/goals/GoalModal';
import { CircularProgress } from '@/components/shared/CircularProgress';
import { Target, Plus, MoreVertical, Edit2, Trash2, Calendar, PlusCircle, MinusCircle } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { formatShortDate } from '@/utils/dates';

export const GoalsPage: React.FC = () => {
  const { setCreateGoalModalOpen, addToast } = useUIStore();
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: goalsService.getGoals,
  });

  const handleUpdateProgress = async (goal: Goal, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newValue = Math.max(0, goal.current_value + delta);
    try {
      await goalsService.updateGoal(goal.id, { current_value: newValue });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    } catch {
      addToast({ type: 'error', message: 'Failed to update progress' });
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await goalsService.deleteGoal(id);
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      addToast({ type: 'success', message: 'Goal deleted' });
    } catch {
      addToast({ type: 'error', message: 'Failed to delete goal' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#111111] text-white flex items-center justify-center shadow-md">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary dark:text-neutral-100">Personal Goals</h1>
            <p className="text-xs text-secondary dark:text-neutral-400 mt-0.5">
              Set quantitative targets and track your personal milestones.
            </p>
          </div>
        </div>

        <button
          onClick={() => setCreateGoalModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl shadow-md hover:bg-neutral-800 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Goals Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="neu-card p-5 h-44 animate-pulse bg-surface/50" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="neu-card p-12 text-center text-xs text-secondary border-dashed">
          <Target className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
          <p className="font-semibold text-primary dark:text-neutral-100">No goals set yet</p>
          <p className="mt-1 dark:text-neutral-500">Define clear measurable targets to guide your progress.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
          {goals.map((goal) => (
            <div
              key={goal.id}
              onClick={() => setEditingGoal(goal)}
              className="neu-card p-5 flex flex-col justify-between hover:shadow-neu-raised transition-all cursor-pointer group relative"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-black/5 dark:bg-white/10 text-primary dark:text-neutral-200 rounded-md">
                    {goal.status}
                  </span>

                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpenId === goal.id ? null : goal.id);
                      }}
                      className="p-1 text-secondary hover:text-primary rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {menuOpenId === goal.id && (
                      <div
                        className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-[#1C1C20] rounded-xl shadow-lg border border-black/5 dark:border-white/10 py-1 z-20 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setEditingGoal(goal);
                            setMenuOpenId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 text-left text-primary dark:text-neutral-200"
                        >
                          <Edit2 className="w-3 h-3 text-secondary" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={(e) => {
                            handleDelete(goal.id, e);
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

                <div className="flex items-center justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-primary dark:text-neutral-100 group-hover:underline">
                      {goal.title}
                    </h3>
                    {goal.description && (
                      <p className="text-xs text-secondary dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                        {goal.description}
                      </p>
                    )}
                  </div>
                  <CircularProgress
                    value={goal.progress_percent}
                    size={46}
                    strokeWidth={4}
                    showText
                  />
                </div>
              </div>

              {/* Progress counter & +/- buttons */}
              <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-primary dark:text-neutral-100">
                    {goal.current_value} / {goal.target_value}
                  </div>
                  {goal.deadline && (
                    <div className="flex items-center gap-1 text-[10px] text-secondary dark:text-neutral-400 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>Due {formatShortDate(goal.deadline)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleUpdateProgress(goal, -1, e)}
                    disabled={goal.current_value <= 0}
                    className="p-1 text-secondary hover:text-primary dark:text-neutral-400 dark:hover:text-neutral-100 disabled:opacity-30 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                    title="Decrease"
                  >
                    <MinusCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => handleUpdateProgress(goal, 1, e)}
                    className="p-1 text-secondary hover:text-primary dark:text-neutral-400 dark:hover:text-neutral-100 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                    title="Increase"
                  >
                    <PlusCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <GoalModal
        goalToEdit={editingGoal}
        isOpen={!!editingGoal}
        onClose={() => setEditingGoal(null)}
      />
    </div>
  );
};
