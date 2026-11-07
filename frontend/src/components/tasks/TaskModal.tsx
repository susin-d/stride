import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/shared/Modal';
import { useUIStore } from '@/store/uiStore';
import { tasksService } from '@/services/tasks';
import { projectsService } from '@/services/projects';
import { Task, Project, Priority } from '@/types';
import { useQueryClient } from '@tanstack/react-query';

interface TaskModalProps {
  taskToEdit?: Task | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ taskToEdit, isOpen, onClose }) => {
  const { createTaskModalOpen, setCreateTaskModalOpen, addToast } = useUIStore();
  const queryClient = useQueryClient();

  const open = isOpen !== undefined ? isOpen : createTaskModalOpen;
  const handleClose = onClose || (() => setCreateTaskModalOpen(false));

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (open) {
      projectsService.getProjects().then(setProjects).catch(console.error);

      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setDescription(taskToEdit.description || '');
        setPriority(taskToEdit.priority);
        setDueDate(taskToEdit.due_date || '');
        setDueTime(taskToEdit.due_time || '');
        setProjectId(taskToEdit.project_id || '');
      } else {
        setTitle('');
        setDescription('');
        setPriority('medium');
        setDueDate(new Date().toISOString().split('T')[0]);
        setDueTime('');
        setProjectId('');
      }
    }
  }, [open, taskToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      if (taskToEdit) {
        await tasksService.updateTask(taskToEdit.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          due_date: dueDate || undefined,
          due_time: dueTime || undefined,
          project_id: projectId || undefined,
        });
        addToast({ type: 'success', message: 'Task updated successfully' });
      } else {
        await tasksService.createTask({
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          due_date: dueDate || undefined,
          due_time: dueTime || undefined,
          project_id: projectId || undefined,
        });
        addToast({ type: 'success', message: 'Task created successfully' });
      }

      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      handleClose();
    } catch {
      addToast({ type: 'error', message: 'Failed to save task' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={handleClose} title={taskToEdit ? 'Edit Task' : 'New Task'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-primary dark:text-neutral-200 mb-1">Title</label>
          <input
            type="text"
            required
            placeholder="e.g. Finish project documentation"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2 neu-input rounded-xl text-xs text-primary dark:text-neutral-100 placeholder:text-secondary dark:placeholder:text-neutral-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-primary dark:text-neutral-200 mb-1">Description</label>
          <textarea
            rows={2}
            placeholder="Add relevant notes or details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 neu-input rounded-xl text-xs text-primary dark:text-neutral-100 placeholder:text-secondary dark:placeholder:text-neutral-500 focus:outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-primary dark:text-neutral-200 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 neu-input rounded-xl text-xs text-primary dark:text-neutral-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary dark:text-neutral-200 mb-1">Due Time (optional)</label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="w-full px-3 py-2 neu-input rounded-xl text-xs text-primary dark:text-neutral-100 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-primary dark:text-neutral-200 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full px-3 py-2 neu-input rounded-xl text-xs text-primary dark:text-neutral-100 focus:outline-none bg-surface dark:bg-[#141417]"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary dark:text-neutral-200 mb-1">Project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 neu-input rounded-xl text-xs text-primary dark:text-neutral-100 focus:outline-none bg-surface dark:bg-[#141417]"
            >
              <option value="">None</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-medium text-secondary hover:text-primary dark:text-neutral-400 dark:hover:text-neutral-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-medium text-white bg-primary hover:bg-neutral-800 rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : taskToEdit ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
