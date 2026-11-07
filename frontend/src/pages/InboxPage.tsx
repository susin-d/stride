import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksService } from '@/services/tasks';
import { TaskItem } from '@/components/tasks/TaskItem';
import { TaskModal } from '@/components/tasks/TaskModal';
import { Task } from '@/types';
import { Inbox, Plus } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';

export const InboxPage: React.FC = () => {
  const [quickTitle, setQuickTitle] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', 'inbox'],
    queryFn: () => tasksService.getTasks(),
  });

  // Filter tasks that have no project assigned
  const inboxTasks = tasks.filter((t) => !t.project_id);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    try {
      await tasksService.createTask({
        title: quickTitle.trim(),
        priority: 'medium',
      });
      setQuickTitle('');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      addToast({ type: 'success', message: 'Task added to Inbox' });
    } catch {
      addToast({ type: 'error', message: 'Failed to add task' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#111111] text-white flex items-center justify-center shadow-md">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary dark:text-neutral-100">Inbox</h1>
            <p className="text-xs text-secondary dark:text-neutral-400 mt-0.5">
              Quickly capture ideas and unorganized tasks to sort later.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Add Bar */}
      <form onSubmit={handleQuickAdd} className="neu-card p-3 flex items-center gap-3">
        <Plus className="w-4 h-4 text-secondary ml-1" />
        <input
          type="text"
          placeholder="Capture a thought or task... Press Enter to save"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          className="flex-1 bg-transparent text-xs font-medium text-primary placeholder:text-secondary focus:outline-none"
        />
        <button
          type="submit"
          disabled={!quickTitle.trim()}
          className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl shadow-sm hover:bg-neutral-800 transition-all disabled:opacity-40"
        >
          Add
        </button>
      </form>

      {/* Task List */}
      <div className="neu-card p-6">
        <h2 className="text-sm font-bold text-primary dark:text-neutral-100 mb-4">
          All Unsorted Tasks ({inboxTasks.length})
        </h2>

        <div className="space-y-2.5">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-black/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : inboxTasks.length === 0 ? (
            <div className="text-center py-12 text-xs text-secondary dark:text-neutral-500 border-dashed neu-card-sm">
              <Inbox className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
              <p className="font-medium">Inbox zero! Everything is organized.</p>
            </div>
          ) : (
            inboxTasks.map((task) => (
              <TaskItem key={task.id} task={task} onEdit={(t) => setEditingTask(t)} />
            ))
          )}
        </div>
      </div>

      <TaskModal
        taskToEdit={editingTask}
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
      />
    </div>
  );
};
