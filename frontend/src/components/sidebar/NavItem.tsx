import React from 'react';
import { NavLink } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

interface NavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  count?: number;
  onClick?: () => void;
}

export const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, count, onClick }) => {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      title={label}
      className={({ isActive }) =>
        cn(
          'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group overflow-hidden',
          isActive
            ? 'bg-[#111111] dark:bg-white text-white dark:text-black shadow-md'
            : 'text-secondary dark:text-neutral-400 hover:text-primary dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
        )
      }
    >
      {({ isActive }) => (
        <>
          <div className="flex items-center min-w-0">
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              <Icon
                className={cn(
                  'w-4 h-4 transition-colors',
                  isActive
                    ? 'text-white dark:text-black'
                    : 'text-secondary dark:text-neutral-400 group-hover:text-primary dark:group-hover:text-white'
                )}
              />
            </div>
            <span className="whitespace-nowrap overflow-hidden transition-all duration-200 max-w-full opacity-100 ml-3 lg:max-w-0 lg:opacity-0 lg:ml-0 lg:group-hover/sidebar:max-w-xs lg:group-hover/sidebar:opacity-100 lg:group-hover/sidebar:ml-3">
              {label}
            </span>
          </div>

          {count !== undefined && count > 0 && (
            <span
              className={cn(
                'text-[10px] font-semibold px-1.5 py-0.5 rounded-md min-w-5 text-center shrink-0 whitespace-nowrap overflow-hidden transition-all duration-200 max-w-full opacity-100 lg:max-w-0 lg:opacity-0 lg:group-hover/sidebar:max-w-xs lg:group-hover/sidebar:opacity-100',
                isActive
                  ? 'bg-white/20 dark:bg-black/20 text-white dark:text-black'
                  : 'bg-black/5 dark:bg-white/10 text-secondary dark:text-neutral-300 group-hover:text-primary dark:group-hover:text-white'
              )}
            >
              {count}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
};
