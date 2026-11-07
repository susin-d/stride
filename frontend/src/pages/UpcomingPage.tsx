import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tasksService } from '@/services/tasks';
import { TaskItem } from '@/components/tasks/TaskItem';
import { TaskModal } from '@/components/tasks/TaskModal';
import { Task } from '@/types';
import { Clock, Plus, Calendar } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { formatDate } from '@/utils/dates';

export const UpcomingPage: React.FC = () => {
  const { setCreateTaskModalOpen } = useUIStore();
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', 'upcoming-all'],
    queryFn: () => tasksService.getUpcomingTasks(14),
  });

  // Group tasks by due date
  const groupedTasks: Record<string, Task[]> = {};
  tasks.forEach((task) => {
    const key = task.due_date || 'No Date';
    if (!groupedTasks[key]) groupedTasks[key] = [];
    groupedTasks[key].push(task);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#111111] text-white flex items-center justify-center shadow-md">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary dark:text-neutral-100">Upcoming Schedule</h1>
            <p className="text-xs text-secondary dark:text-neutral-400 mt-0.5">
              Deadlines and planned activities for the next two weeks.
            </p>
          </div>
        </div>

        <button
          onClick={() => setCreateTaskModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl shadow-md hover:bg-neutral-800 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>
      </div>

      {/* Grouped lists */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="neu-card p-5 h-28 animate-pulse bg-surface/50" />
          ))}
        </div>
      ) : Object.keys(groupedTasks).length === 0 ? (
        <div className="neu-card p-12 text-center text-xs text-secondary border-dashed">
          <Calendar className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
          <p className="font-semibold text-primary dark:text-neutral-100">No upcoming tasks scheduled</p>
          <p className="mt-1 dark:text-neutral-500">Add tasks with due dates to see them timeline here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTasks).map(([dateStr, items]) => (
            <div key={dateStr} className="neu-card p-5">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary dark:text-neutral-200" />
                  <h3 className="text-xs font-bold text-primary dark:text-neutral-100">
                    {dateStr === 'No Date' ? 'Unscheduled' : formatDate(dateStr)}
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-secondary dark:text-neutral-500">
                  {items.length} {items.length === 1 ? 'task' : 'tasks'}
                </span>
              </div>

              <div className="space-y-2">
                {items.map((task) => (
                  <TaskItem key={task.id} task={task} onEdit={(t) => setEditingTask(t)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <TaskModal
        taskToEdit={editingTask}
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
      />
    </div>
  );
};
