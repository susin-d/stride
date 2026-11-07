import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { getGreeting } from '@/utils/dates';
import { Plus } from 'lucide-react';

export const DashboardHeader: React.FC = () => {
  const { user } = useAuthStore();
  const { setCreateTaskModalOpen } = useUIStore();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
      {/* Dynamic Greeting */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-primary dark:text-white">
          {getGreeting()}{' '}
          <span className="font-semibold text-neutral-500 dark:text-neutral-400">
            {user?.name?.split(' ')[0] || 'Susindran'}!
          </span>
        </h1>
      </div>

      {/* Quick Action */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCreateTaskModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111111] dark:bg-white text-white dark:text-black text-xs font-semibold shadow-md hover:opacity-90 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>
    </div>
  );
};
