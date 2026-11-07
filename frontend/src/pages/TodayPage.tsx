import React from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatCards } from '@/components/dashboard/StatCards';
import { TasksCard } from '@/components/dashboard/TasksCard';
import { UpcomingWidget } from '@/components/dashboard/UpcomingWidget';
import { GoalsWidget } from '@/components/dashboard/GoalsWidget';
import { HabitsWidget } from '@/components/dashboard/HabitsWidget';
import { QuoteCard } from '@/components/dashboard/QuoteCard';

export const TodayPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Dynamic Header */}
      <DashboardHeader />

      {/* 3 Productivity Statistics Cards */}
      <StatCards />

      {/* Main Today's Tasks */}
      <TasksCard />

      {/* 4 Bottom Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <UpcomingWidget />
        <GoalsWidget />
        <HabitsWidget />
        <QuoteCard />
      </div>
    </div>
  );
};
