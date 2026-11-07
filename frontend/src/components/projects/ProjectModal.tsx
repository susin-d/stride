import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/shared/Modal';
import { useUIStore } from '@/store/uiStore';
import { projectsService } from '@/services/projects';
import { Project, ProjectStatus } from '@/types';
import { useQueryClient } from '@tanstack/react-query';

interface ProjectModalProps {
  projectToEdit?: Project | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ projectToEdit, isOpen, onClose }) => {
  const { createProjectModalOpen, setCreateProjectModalOpen, addToast } = useUIStore();
  const queryClient = useQueryClient();

  const open = isOpen !== undefined ? isOpen : createProjectModalOpen;
  const handleClose = onClose || (() => setCreateProjectModalOpen(false));

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (projectToEdit) {
        setName(projectToEdit.name);
        setDescription(projectToEdit.description || '');
        setDeadline(projectToEdit.deadline || '');
        setStatus(projectToEdit.status);
      } else {
        setName('');
        setDescription('');
        setDeadline('');
        setStatus('active');
      }
    }
  }, [open, projectToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (projectToEdit) {
        await projectsService.updateProject(projectToEdit.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          deadline: deadline || undefined,
          status,
        });
        addToast({ type: 'success', message: 'Project updated' });
      } else {
        await projectsService.createProject({
          name: name.trim(),
          description: description.trim() || undefined,
          deadline: deadline || undefined,
          status,
        });
        addToast({ type: 'success', message: 'Project created' });
      }

      queryClient.invalidateQueries({ queryKey: ['projects'] });
      handleClose();
    } catch {
      addToast({ type: 'error', message: 'Failed to save project' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={handleClose} title={projectToEdit ? 'Edit Project' : 'New Project'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-primary dark:text-neutral-200 mb-1">Project Name</label>
          <input
            type="text"
            required
            placeholder="e.g. STRIDE App, Design System"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2 neu-input rounded-xl text-xs text-primary dark:text-neutral-100 placeholder:text-secondary dark:placeholder:text-neutral-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-primary dark:text-neutral-200 mb-1">Description</label>
          <textarea
            rows={2}
            placeholder="Overview of the project goals..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 neu-input rounded-xl text-xs text-primary dark:text-neutral-100 placeholder:text-secondary dark:placeholder:text-neutral-500 focus:outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-primary dark:text-neutral-200 mb-1">Deadline</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 neu-input rounded-xl text-xs text-primary dark:text-neutral-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary dark:text-neutral-200 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="w-full px-3 py-2 neu-input rounded-xl text-xs text-primary dark:text-neutral-100 focus:outline-none bg-surface dark:bg-[#141417]"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="archived">Archived</option>
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
            {isSubmitting ? 'Saving...' : projectToEdit ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
