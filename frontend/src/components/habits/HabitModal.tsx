import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/shared/Modal';
import { useUIStore } from '@/store/uiStore';
import { habitsService } from '@/services/habits';
import { Habit, HabitFrequency } from '@/types';
import { useQueryClient } from '@tanstack/react-query';

interface HabitModalProps {
  habitToEdit?: Habit | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export const HabitModal: React.FC<HabitModalProps> = ({ habitToEdit, isOpen, onClose }) => {
  const { createHabitModalOpen, setCreateHabitModalOpen, addToast } = useUIStore();
  const queryClient = useQueryClient();

  const open = isOpen !== undefined ? isOpen : createHabitModalOpen;
  const handleClose = onClose || (() => setCreateHabitModalOpen(false));

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (habitToEdit) {
        setName(habitToEdit.name);
        setDescription(habitToEdit.description || '');
        setFrequency(habitToEdit.frequency);
      } else {
        setName('');
        setDescription('');
        setFrequency('daily');
      }
    }
  }, [open, habitToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      if (habitToEdit) {
        await habitsService.updateHabit(habitToEdit.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          frequency,
        });
        addToast({ type: 'success', message: 'Habit updated' });
      } else {
        await habitsService.createHabit({
          name: name.trim(),
          description: description.trim() || undefined,
          frequency,
        });
        addToast({ type: 'success', message: 'Habit created' });
      }

      queryClient.invalidateQueries({ queryKey: ['habits'] });
      handleClose();
    } catch {
      addToast({ type: 'error', message: 'Failed to save habit' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={handleClose} title={habitToEdit ? 'Edit Habit' : 'New Habit'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-primary dark:text-neutral-200 mb-1">Habit Name</label>
          <input
            type="text"
            required
            placeholder="e.g. Read for 30 minutes, Workout, Meditate"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2 neu-input rounded-xl text-xs text-primary dark:text-neutral-100 placeholder:text-secondary dark:placeholder:text-neutral-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-primary dark:text-neutral-200 mb-1">Description (optional)</label>
          <textarea
            rows={2}
            placeholder="Any specific instructions or cues..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 neu-input rounded-xl text-xs text-primary dark:text-neutral-100 placeholder:text-secondary dark:placeholder:text-neutral-500 focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-primary dark:text-neutral-200 mb-1">Frequency</label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as HabitFrequency)}
            className="w-full px-3 py-2 neu-input rounded-xl text-xs text-primary dark:text-neutral-100 focus:outline-none bg-surface dark:bg-[#141417]"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
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
            {isSubmitting ? 'Saving...' : habitToEdit ? 'Save Changes' : 'Create Habit'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
