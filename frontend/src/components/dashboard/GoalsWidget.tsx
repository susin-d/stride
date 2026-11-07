import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { goalsService } from '@/services/goals';
import { Goal } from '@/types';
import { Link } from 'react-router-dom';
import { Target, ChevronRight, Plus } from 'lucide-react';
import { CircularProgress } from '@/components/shared/CircularProgress';
import { useUIStore } from '@/store/uiStore';
import { GoalModal } from '@/components/goals/GoalModal';
import { formatShortDate } from '@/utils/dates';

export const GoalsWidget: React.FC = () => {
  const { setCreateGoalModalOpen } = useUIStore();
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: goalsService.getGoals,
  });

  return (
    <div className="neu-card p-5 flex flex-col justify-between h-[310px]">
      <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary dark:text-neutral-200" />
          <h3 className="text-xs font-bold text-primary dark:text-neutral-100 uppercase tracking-wider">Goals</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateGoalModalOpen(true)}
            className="p-1 text-secondary hover:text-primary dark:text-neutral-400 dark:hover:text-neutral-100 rounded-lg transition-colors"
            title="Add Goal"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <Link
            to="/goals"
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
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-black/5 dark:bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-xs text-secondary dark:text-neutral-400 py-6">
            <Target className="w-6 h-6 text-neutral-300 dark:text-neutral-600 mb-1.5" />
            <span>No active goals set</span>
          </div>
        ) : (
          goals.slice(0, 3).map((goal) => (
            <div
              key={goal.id}
              onClick={() => setEditingGoal(goal)}
              className="flex items-center justify-between p-3 rounded-xl bg-surface dark:bg-[#1C1C20] hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer border border-black/5 dark:border-white/10"
            >
              <div className="pr-3 flex-1 min-w-0">
                <p className="text-xs font-semibold text-primary dark:text-neutral-100 truncate">{goal.title}</p>
                <div className="flex items-center gap-2 text-[10px] text-secondary dark:text-neutral-400 mt-1">
                  <span className="font-semibold text-primary dark:text-neutral-200">
                    {goal.current_value} / {goal.target_value}
                  </span>
                  {goal.deadline && (
                    <span>• Due {formatShortDate(goal.deadline)}</span>
                  )}
                </div>
              </div>
              <CircularProgress
                value={goal.progress_percent}
                size={40}
                strokeWidth={3.5}
                showText
              />
            </div>
          ))
        )}
      </div>

      <GoalModal
        goalToEdit={editingGoal}
        isOpen={!!editingGoal}
        onClose={() => setEditingGoal(null)}
      />
    </div>
  );
};
