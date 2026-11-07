import React, { useState } from 'react';
import { Task, Priority } from '@/types';
import { tasksService } from '@/services/tasks';
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/store/uiStore';
import {
  Check,
  Clock,
  MoreVertical,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { formatShortDate, formatTime } from '@/utils/dates';
import { cn } from '@/utils/cn';

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onEdit }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [subtasksOpen, setSubtasksOpen] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  const isDone = task.status === 'done';

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = isDone ? 'todo' : 'done';

    // Optimistic update in cache for immediate 0ms UI feedback
    queryClient.setQueryData<Task[]>(['tasks'], (old) => {
      if (!old) return old;
      return old.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t));
    });

    try {
      await tasksService.toggleComplete(task.id);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    } catch {
      // Revert if API failed
      queryClient.setQueryData<Task[]>(['tasks'], (old) => {
        if (!old) return old;
        return old.map((t) => (t.id === task.id ? { ...t, status: task.status } : t));
      });
      addToast({ type: 'error', message: 'Failed to update task' });
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await tasksService.deleteTask(task.id);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      addToast({ type: 'success', message: 'Task deleted' });
    } catch {
      addToast({ type: 'error', message: 'Failed to delete task' });
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    try {
      await tasksService.addSubtask(task.id, newSubtaskTitle.trim());
      setNewSubtaskTitle('');
      setIsAddingSubtask(false);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch {
      addToast({ type: 'error', message: 'Failed to add subtask' });
    }
  };

  const priorityStyles: Record<Priority, { label: string; class: string }> = {
    high: { label: 'High', class: 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900' },
    medium: { label: 'Medium', class: 'bg-neutral-300 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200' },
    low: { label: 'Low', class: 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400' },
  };

  const completedSubtasks = task.subtasks.filter((s) => s.is_completed).length;

  return (
    <div
      className={cn(
        'group neu-card-sm p-3.5 transition-all duration-200 hover:shadow-neu-raised-sm',
        isDone && 'opacity-60 bg-surface/50'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Custom Checkbox & Content */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            onClick={handleToggleComplete}
            className={cn(
              'mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0',
              isDone
                ? 'bg-[#111111] border-[#111111] text-white shadow-xs'
                : 'border-neutral-400 hover:border-black dark:border-neutral-600 dark:hover:border-neutral-300 bg-white dark:bg-[#1C1C20]'
            )}
          >
            {isDone && <Check className="w-3 h-3 stroke-[2.5]" />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  'text-xs font-semibold text-primary dark:text-neutral-100 break-words',
                  isDone && 'line-through text-secondary dark:text-neutral-500'
                )}
              >
                {task.title}
              </span>

              {/* Priority badge */}
              <span
                className={cn(
                  'text-[9px] font-semibold px-1.5 py-0.5 rounded-md uppercase tracking-wider',
                  priorityStyles[task.priority]?.class
                )}
              >
                {priorityStyles[task.priority]?.label}
              </span>
            </div>

            {task.description && (
              <p className="text-[11px] text-secondary dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}

            {/* Metadata (due date, due time, subtasks) */}
            <div className="flex items-center gap-3 mt-2 text-[10px] text-secondary dark:text-neutral-400 font-medium">
              {task.due_date && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatShortDate(task.due_date)}</span>
                  {task.due_time && <span>• {formatTime(task.due_time)}</span>}
                </div>
              )}

              {task.subtasks.length > 0 && (
                <button
                  onClick={() => setSubtasksOpen(!subtasksOpen)}
                  className="flex items-center gap-1 hover:text-primary dark:hover:text-neutral-100 transition-colors"
                >
                  {subtasksOpen ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                  <span>
                    {completedSubtasks}/{task.subtasks.length} subtasks
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Context Action Menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 text-secondary hover:text-primary dark:text-neutral-400 dark:hover:text-neutral-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-[#1C1C20] rounded-xl shadow-lg border border-black/5 dark:border-white/10 py-1 z-20 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  onEdit(task);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 text-left text-primary dark:text-neutral-200"
              >
                <Edit2 className="w-3 h-3 text-secondary dark:text-neutral-400" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => {
                  setIsAddingSubtask(true);
                  setSubtasksOpen(true);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 text-left text-primary dark:text-neutral-200"
              >
                <Plus className="w-3 h-3 text-secondary dark:text-neutral-400" />
                <span>Add Subtask</span>
              </button>
              <button
                onClick={(e) => {
                  handleDelete(e);
                  setMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left text-rose-600"
              >
                <Trash2 className="w-3 h-3 text-rose-500" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Subtasks Accordion */}
      {subtasksOpen && (
        <div className="mt-3 pl-7 pr-2 space-y-1.5 border-t border-black/5 dark:border-white/10 pt-2">
          {task.subtasks.map((st) => (
            <div key={st.id} className="flex items-center gap-2 text-xs text-secondary dark:text-neutral-400">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-600" />
              <span className={st.is_completed ? 'line-through text-neutral-400 dark:text-neutral-500' : 'text-primary dark:text-neutral-200'}>{st.title}</span>
            </div>
          ))}

          {isAddingSubtask ? (
            <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                autoFocus
                placeholder="Subtask title..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                className="flex-1 px-2.5 py-1 bg-white dark:bg-[#141417] text-primary dark:text-neutral-100 placeholder:text-secondary dark:placeholder:text-neutral-500 rounded-lg text-xs neu-input focus:outline-none"
              />
              <button
                type="submit"
                className="px-2 py-1 bg-primary text-white text-[10px] font-semibold rounded-lg"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setIsAddingSubtask(false)}
                className="text-[10px] text-secondary hover:text-primary dark:text-neutral-400 dark:hover:text-neutral-100"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingSubtask(true)}
              className="flex items-center gap-1 text-[11px] text-secondary hover:text-primary dark:text-neutral-400 dark:hover:text-neutral-100 font-medium pt-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add subtask</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
