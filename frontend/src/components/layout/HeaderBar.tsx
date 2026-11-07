import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { notificationsService } from '@/services/notifications';
import { NotificationItem } from '@/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Sun,
  Moon,
  ChevronDown,
  Settings,
  LogOut,
  Menu,
  Bell,
  Check,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { cn } from '@/utils/cn';

interface AnimatedClockIconProps {
  continuousSeconds: number;
  className?: string;
}

const AnimatedClockIcon: React.FC<AnimatedClockIconProps> = ({
  continuousSeconds,
  className = 'w-4 h-4 text-primary dark:text-neutral-200 shrink-0',
}) => {
  const secondDeg = continuousSeconds * 6;
  const minuteDeg = (continuousSeconds / 60) * 6;
  const hourDeg = (continuousSeconds / 3600) * 30;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Outer dial */}
      <circle cx="12" cy="12" r="10" strokeWidth="2" />

      {/* Hour hand */}
      <line
        x1="12"
        y1="12"
        x2="12"
        y2="6.5"
        strokeWidth="2"
        style={{
          transformOrigin: '12px 12px',
          transform: `rotate(${hourDeg}deg)`,
        }}
      />

      {/* Minute hand */}
      <line
        x1="12"
        y1="12"
        x2="12"
        y2="4.5"
        strokeWidth="1.6"
        style={{
          transformOrigin: '12px 12px',
          transform: `rotate(${minuteDeg}deg)`,
        }}
      />

      {/* Ticking second hand */}
      <line
        x1="12"
        y1="13.5"
        x2="12"
        y2="3"
        strokeWidth="1.1"
        className="text-secondary dark:text-neutral-400 opacity-90"
        style={{
          transformOrigin: '12px 12px',
          transform: `rotate(${secondDeg}deg)`,
          transition: 'transform 0.2s cubic-bezier(0.4, 2.08, 0.55, 0.44)',
        }}
      />

      {/* Center pivot */}
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
};

export const HeaderBar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme, setSearchOpen, toggleSidebar } = useUIStore();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [continuousSeconds, setContinuousSeconds] = useState(() => {
    const now = new Date();
    return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery<NotificationItem[]>({
    queryKey: ['notifications'],
    queryFn: notificationsService.getNotifications,
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    await notificationsService.markAllAsRead();
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      const currentSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      setContinuousSeconds((prev) => {
        const diff = ((currentSecs - (prev % 86400)) + 86400) % 86400;
        return prev + (diff === 0 ? 1 : diff);
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#header-profile-dropdown')) {
        setProfileDropdownOpen(false);
      }
      if (!target.closest('#header-notif-dropdown')) {
        setNotifDropdownOpen(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full h-14 md:h-16 px-4 md:px-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between gap-4 backdrop-blur-md bg-[#F7F7F9]/90 dark:bg-[#18181B]/90 transition-colors duration-200 shrink-0">
      {/* 1. Left: Mobile menu & Live Real-Time Clock */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 text-secondary hover:text-primary rounded-xl neu-button"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Live Digital Clock */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 neu-button rounded-xl bg-surface dark:bg-[#1C1C20] border border-black/5 dark:border-white/10 transition-colors">
          <AnimatedClockIcon continuousSeconds={continuousSeconds} />

          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 leading-none">
            <span className="text-xs font-bold font-mono tracking-tight text-primary dark:text-white">
              {format(currentTime, 'hh:mm:ss a')}
            </span>
            <span className="text-[10px] font-medium text-secondary dark:text-neutral-400 hidden md:inline">
              • {format(currentTime, 'EEE, MMM d, yyyy')}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Center/Right: Search Bar, Theme Switch, Notifications, and Profile */}
      <div className="flex items-center gap-3">
        {/* Search Bar / Trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2.5 px-3.5 py-1.5 neu-button rounded-xl text-xs text-secondary hover:text-primary dark:text-neutral-400 dark:hover:text-white transition-all w-36 sm:w-56 md:w-64"
          title="Search anything (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1 text-left truncate text-xs">Search STRIDE...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-black/5 dark:bg-white/10 text-secondary dark:text-neutral-400 rounded">
            ⌘K
          </kbd>
        </button>

        {/* White Mode / Black Mode Switch */}
        <div
          onClick={toggleTheme}
          className="cursor-pointer select-none relative flex items-center p-1 rounded-xl neu-button bg-surface dark:bg-[#1C1C20] border border-black/5 dark:border-white/10 h-8.5 w-28 transition-colors"
          title={`Switch to ${theme === 'light' ? 'Black' : 'White'} Mode`}
        >
          {/* Sliding Pill Indicator */}
          <div
            className={cn(
              'absolute top-1 bottom-1 w-[52px] rounded-lg transition-transform duration-200 ease-out shadow-xs bg-white',
              theme === 'light' ? 'translate-x-0' : 'translate-x-[52px]'
            )}
          />

          {/* White option */}
          <div
            className={cn(
              'relative z-10 w-1/2 flex items-center justify-center gap-1 text-[11px] font-semibold transition-colors',
              theme === 'light' ? 'text-black font-bold' : 'text-neutral-400'
            )}
          >
            <Sun className={cn('w-3 h-3', theme === 'light' ? 'text-amber-500' : 'text-neutral-500')} />
            <span>White</span>
          </div>

          {/* Black option */}
          <div
            className={cn(
              'relative z-10 w-1/2 flex items-center justify-center gap-1 text-[11px] font-semibold transition-colors',
              theme === 'dark' ? 'text-black font-bold' : 'text-neutral-400'
            )}
          >
            <Moon className={cn('w-3 h-3', theme === 'dark' ? 'text-indigo-600' : 'text-neutral-500')} />
            <span>Black</span>
          </div>
        </div>

        {/* Notification Bell */}
        <div className="relative" id="header-notif-dropdown">
          <button
            onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
            className="relative p-2 rounded-xl neu-button text-secondary hover:text-primary dark:text-neutral-300 dark:hover:text-white transition-all"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#18181B]" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {notifDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 neu-card p-3 shadow-2xl z-40 animate-in fade-in zoom-in-95 duration-150 bg-white dark:bg-[#18181B] border border-black/5 dark:border-white/10">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/5 dark:border-white/10">
                <span className="text-xs font-bold text-primary dark:text-white">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-[11px] text-secondary hover:text-primary dark:text-neutral-400 dark:hover:text-white font-medium"
                  >
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1.5">
                {notifications.length === 0 ? (
                  <p className="text-center py-4 text-xs text-secondary dark:text-neutral-400">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        'p-2.5 rounded-xl text-xs transition-colors',
                        n.is_read
                          ? 'bg-transparent text-secondary dark:text-neutral-400'
                          : 'bg-black/5 dark:bg-white/5 text-primary dark:text-neutral-200 font-medium'
                      )}
                    >
                      <p className="text-xs font-semibold">{n.title}</p>
                      <p className="text-[11px] text-secondary dark:text-neutral-400 mt-0.5">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile with Avatar and Dropdown */}
        <div className="relative" id="header-profile-dropdown">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl neu-button hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-[#111111] dark:bg-white text-white dark:text-black flex items-center justify-center text-xs font-bold shadow-xs shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'S'}
            </div>
            <div className="hidden sm:block max-w-[90px] truncate leading-tight">
              <span className="text-xs font-bold text-primary dark:text-white block truncate">
                {user?.name?.split(' ')[0] || 'User'}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-secondary dark:text-neutral-400 shrink-0" />
          </button>

          {/* Profile Dropdown Menu */}
          {profileDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 neu-card p-2 shadow-2xl z-40 text-xs border border-black/5 dark:border-white/10 animate-in fade-in zoom-in-95 duration-150 bg-white dark:bg-[#18181B]">
              <div className="px-3 py-2 border-b border-black/5 dark:border-white/10 mb-1">
                <p className="font-bold text-primary dark:text-white truncate">
                  {user?.name || 'Susindran'}
                </p>
                <p className="text-[10px] text-secondary dark:text-neutral-400 truncate">
                  {user?.email || 'demo@stride.app'}
                </p>
              </div>

              <button
                onClick={() => {
                  navigate('/settings');
                  setProfileDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-primary dark:text-neutral-200 transition-colors text-left"
              >
                <Settings className="w-3.5 h-3.5 text-secondary dark:text-neutral-400" />
                <span>Account & Settings</span>
              </button>

              <button
                onClick={() => {
                  toggleTheme();
                  setProfileDropdownOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-primary dark:text-neutral-200 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  {theme === 'light' ? (
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-sky-400" />
                  )}
                  <span>Theme</span>
                </div>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-secondary">
                  {theme === 'light' ? 'White' : 'Black'}
                </span>
              </button>

              <div className="my-1 border-t border-black/5 dark:border-white/10" />

              <button
                onClick={() => {
                  logout();
                  setProfileDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
