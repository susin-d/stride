import React from 'react';
import { FocusTimer } from '@/components/timer/FocusTimer';
import { MiniCalendar } from '@/components/calendar/MiniCalendar';

export const RightPanel: React.FC = () => {
  return (
    <aside className="w-80 shrink-0 flex flex-col gap-5 p-5 border-l border-black/5 bg-[#F7F7F9] overflow-y-auto">
      <FocusTimer />
      <MiniCalendar />
    </aside>
  );
};
