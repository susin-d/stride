import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tasksService } from '@/services/tasks';
import { Task, Priority } from '@/types';
import { TaskItem } from '@/components/tasks/TaskItem';
import { TaskModal } from '@/components/tasks/TaskModal';
import { useUIStore } from '@/store/uiStore';
import { Plus, Filter, ArrowUpDown } from 'lucide-react';

export const TasksCard: React.FC = () => {
  const { setCreateTaskModalOpen } = useUIStore();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'done'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created' | 'priority'>('created');

  const { data: allTasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => tasksService.getTasks(),
  });

  const tasks = allTasks;

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter tasks (Today's tasks or overdue/undated pending)
  const filteredTasks = tasks.filter((task) => {
    // Only show today's tasks or uncompleted tasks on Today's view
    const isTodayTask = task.due_date === todayStr || (!task.due_date && task.status !== 'done');
    if (!isTodayTask) return false;

    if (statusFilter === 'todo' && task.status === 'done') return false;
    if (statusFilter === 'done' && task.status !== 'done') return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    return true;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'priority') {
      const order: Record<Priority, number> = { high: 3, medium: 2, low: 1 };
      return order[b.priority] - order[a.priority];
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="neu-card p-6 mb-6">
      {/* Header with Title & Add Task */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base font-bold text-primary dark:text-neutral-100 tracking-tight">Today's Tasks</h2>
          <p className="text-xs text-secondary dark:text-neutral-500 mt-0.5">
            {tasks.filter((t) => t.status === 'done').length} of {tasks.length} tasks completed
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center p-1 bg-black/5 dark:bg-white/10 rounded-xl text-xs font-medium">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                statusFilter === 'all' ? 'bg-white dark:bg-[#2A2A2E] text-primary dark:text-neutral-100 font-bold shadow-xs' : 'text-secondary dark:text-neutral-400 hover:text-primary dark:hover:text-neutral-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('todo')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                statusFilter === 'todo' ? 'bg-white dark:bg-[#2A2A2E] text-primary dark:text-neutral-100 font-bold shadow-xs' : 'text-secondary dark:text-neutral-400 hover:text-primary dark:hover:text-neutral-100'
              }`}
            >
              To Do
            </button>
            <button
              onClick={() => setStatusFilter('done')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                statusFilter === 'done' ? 'bg-white dark:bg-[#2A2A2E] text-primary dark:text-neutral-100 font-bold shadow-xs' : 'text-secondary dark:text-neutral-400 hover:text-primary dark:hover:text-neutral-100'
              }`}
            >
              Done
            </button>
          </div>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="neu-button px-2.5 py-1.5 rounded-xl text-xs text-secondary hover:text-primary focus:outline-none bg-surface"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Sort */}
          <button
            onClick={() => setSortBy(sortBy === 'created' ? 'priority' : 'created')}
            className="neu-button p-2 rounded-xl text-secondary hover:text-primary"
            title={`Sort by: ${sortBy}`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>

          {/* Create Button */}
          <button
            onClick={() => setCreateTaskModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold shadow-md hover:bg-neutral-800 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 neu-card-sm animate-pulse bg-surface/50" />
            ))}
          </div>
        ) : sortedTasks.length === 0 ? (
          <div className="text-center py-10 neu-card-sm border-dashed">
            <p className="text-xs font-medium text-secondary">
              No tasks for today. Click <span className="font-semibold text-primary">"Add Task"</span> to get started!
            </p>
          </div>
        ) : (
          sortedTasks.map((task) => (
            <TaskItem key={task.id} task={task} onEdit={(t) => setEditingTask(t)} />
          ))
        )}
      </div>

      <TaskModal
        taskToEdit={editingTask}
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
      />
    </div>
  );
};
