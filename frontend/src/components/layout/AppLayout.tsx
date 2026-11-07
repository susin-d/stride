import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { HeaderBar } from './HeaderBar';
import { SearchModal } from '@/components/shared/SearchModal';
import { ToastContainer } from '@/components/shared/ToastContainer';
import { TaskModal } from '@/components/tasks/TaskModal';
import { ProjectModal } from '@/components/projects/ProjectModal';
import { GoalModal } from '@/components/goals/GoalModal';
import { HabitModal } from '@/components/habits/HabitModal';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background dark:bg-[#0F0F11] text-primary dark:text-[#F4F4F6] transition-colors duration-200">
      {/* 1. Left Sidebar */}
      <Sidebar />

      {/* 2. Main Workspace (HeaderBar directly connected to sidebar + scrollable body) */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden bg-background dark:bg-[#0F0F11]">
        {/* Top Header Bar seamlessly connected to the right border of Sidebar */}
        <HeaderBar />

        {/* Workspace Body: Center Content */}
        <main className="flex-1 overflow-y-auto min-w-0 p-4 md:p-6 lg:p-8 bg-background dark:bg-[#0F0F11]">
          <div className="max-w-7xl 2xl:max-w-[1600px] w-full mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <SearchModal />
      <ToastContainer />
      <TaskModal />
      <ProjectModal />
      <GoalModal />
      <HabitModal />
    </div>
  );
};
