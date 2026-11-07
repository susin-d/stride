import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/shared/Modal';
import { useUIStore } from '@/store/uiStore';
import { goalsService } from '@/services/goals';
import { Goal } from '@/types';
import { useQueryClient } from '@tanstack/react-query';

interface GoalModalProps {
  goalToEdit?: Goal | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export const GoalModal: React.FC<GoalModalProps> = ({ goalToEdit, isOpen, onClose }) => {
  const { createGoalModalOpen, setCreateGoalModalOpen, addToast } = useUIStore();
  const queryClient = useQueryClient();

  const open = isOpen !== undefined ? isOpen : createGoalModalOpen;
  const handleClose = onClose || (() => setCreateGoalModalOpen(false));

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetValue, setTargetValue] = useState('10');
  const [currentValue, setCurrentValue] = useState('0');
  const [deadline, setDeadline] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (goalToEdit) {
        setTitle(goalToEdit.title);
        setDescription(goalToEdit.description || '');
        setTargetValue(goalToEdit.target_value.toString());
        setCurrentValue(goalToEdit.current_value.toString());
        setDeadline(goalToEdit.deadline || '');
      } else {
        setTitle('');
        setDescription('');
        setTargetValue('10');
        setCurrentValue('0');
        setDeadline('');
      }
    }
  }, [open, goalToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      if (goalToEdit) {
        await goalsService.updateGoal(goalToEdit.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          target_value: parseFloat(targetValue) || 10,
          current_value: parseFloat(currentValue) || 0,
          deadline: deadline || undefined,
        });
        addToast({ type: 'success', message: 'Goal updated' });
      } else {
        await goalsService.createGoal({
          title: title.trim(),
          description: description.trim() || undefined,
          target_value: parseFloat(targetValue) || 10,
          current_value: parseFloat(currentValue) || 0,
          deadline: deadline || undefined,
        });
        addToast({ type: 'success', message: 'Goal created' });
      }

      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      handleClose();
    } catch {
      addToast({ type: 'error', message: 'Failed to save goal' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={handleClose} title={goalToEdit ? 'Edit Goal' : 'New Goal'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-primary dark:text-neutral-200 mb-1">Goal Title</label>
          <input
            type="text"
            required
            placeholder="e.g. Complete 10 projects this month"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2 neu-input rounded-xl text-xs text-primary dark:text-neutral-100 placeholder:text-secondary dark:placeholder:text-neutral-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-primary dark:text-neutral-200 mb-1">Description</label>
          <textarea
            rows={2}
            placeholder="Why is this goal important?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 neu-input rounded-xl text-xs text-primary dark:text-neutral-100 placeholder:text-secondary dark:placeholder:text-neutral-500 focus:outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-primary dark:text-neutral-200 mb-1">Current Value</label>
            <input
              type="number"
              step="any"
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              className="w-full px-3 py-2 neu-input rounded-xl text-xs text-primary dark:text-neutral-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-primary dark:text-neutral-200 mb-1">Target Value</label>
            <input
              type="number"
              step="any"
              required
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              className="w-full px-3 py-2 neu-input rounded-xl text-xs text-primary dark:text-neutral-100 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-primary dark:text-neutral-200 mb-1">Deadline (optional)</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full px-3 py-2 neu-input rounded-xl text-xs text-primary dark:text-neutral-100 focus:outline-none"
          />
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
            {isSubmitting ? 'Saving...' : goalToEdit ? 'Save Changes' : 'Create Goal'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
