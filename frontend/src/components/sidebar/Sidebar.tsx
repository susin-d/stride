import React from 'react';
import { useUIStore } from '@/store/uiStore';
import { NavItem } from './NavItem';
import {
  CalendarDays,
  Inbox,
  Clock,
  FolderKanban,
  Target,
  Flame,
  Calendar,
  BarChart2,
  Settings,
  X,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { tasksService } from '@/services/tasks';
import { cn } from '@/utils/cn';

export const Sidebar: React.FC = () => {
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksService.getTasks(),
  });

  const todayCount = tasks.filter((t) => t.status !== 'done').length;
  const inboxCount = tasks.filter((t) => !t.project_id && t.status !== 'done').length;

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop spacer to preserve layout flow when collapsed */}
      <div className="hidden lg:block w-[72px] shrink-0 pointer-events-none" />

      {/* Sidebar Container: Collapsed normally (72px), expands to full width (256px / w-64) on hover */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 bg-[#F7F7F9] dark:bg-[#18181B] border-r border-black/5 dark:border-white/10 flex flex-col justify-between px-3.5 pb-3.5 pt-0 transition-all duration-300 ease-in-out group/sidebar',
          // Mobile state
          sidebarOpen ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full lg:translate-x-0',
          // Desktop state: collapsed normally, expanded on hover
          'lg:w-[72px] lg:hover:w-64 lg:hover:shadow-2xl'
        )}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Header - matches HeaderBar height and bottom border */}
          <div className="h-14 md:h-16 border-b border-black/5 dark:border-white/10 -mx-3.5 px-3.5 flex items-center justify-between mb-3 shrink-0">
            <div className="flex items-center min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#111111] dark:bg-white flex items-center justify-center text-white dark:text-black font-extrabold text-base shadow-md shrink-0">
                S
              </div>
              <div className="flex flex-col whitespace-nowrap overflow-hidden transition-all duration-200 max-w-full opacity-100 ml-3 lg:max-w-0 lg:opacity-0 lg:ml-0 lg:group-hover/sidebar:max-w-xs lg:group-hover/sidebar:opacity-100 lg:group-hover/sidebar:ml-3">
                <span className="font-bold text-sm tracking-wider text-primary dark:text-white">STRIDE</span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-secondary dark:text-neutral-400 hover:text-primary dark:hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-0.5 no-scrollbar">
            <div className="space-y-1 mb-3">
              <NavItem
                to="/today"
                icon={CalendarDays}
                label="Today"
                count={todayCount}
                onClick={() => setSidebarOpen(false)}
              />
              <NavItem
                to="/inbox"
                icon={Inbox}
                label="Inbox"
                count={inboxCount}
                onClick={() => setSidebarOpen(false)}
              />
              <NavItem
                to="/upcoming"
                icon={Clock}
                label="Upcoming"
                onClick={() => setSidebarOpen(false)}
              />
              <NavItem
                to="/projects"
                icon={FolderKanban}
                label="Projects"
                onClick={() => setSidebarOpen(false)}
              />
              <NavItem
                to="/goals"
                icon={Target}
                label="Goals"
                onClick={() => setSidebarOpen(false)}
              />
              <NavItem
                to="/habits"
                icon={Flame}
                label="Habits"
                onClick={() => setSidebarOpen(false)}
              />
              <NavItem
                to="/calendar"
                icon={Calendar}
                label="Calendar"
                onClick={() => setSidebarOpen(false)}
              />
              <NavItem
                to="/weekly"
                icon={BarChart2}
                label="Weekly Review"
                onClick={() => setSidebarOpen(false)}
              />
            </div>
          </div>

          {/* Bottom Section */}
          <div className="pt-3 border-t border-black/5 dark:border-white/10 space-y-1">
            <NavItem
              to="/settings"
              icon={Settings}
              label="Settings"
              onClick={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      </aside>
    </>
  );
};
