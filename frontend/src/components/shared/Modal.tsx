import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          'relative w-full max-w-lg neu-card p-6 z-10 animate-in zoom-in-95 duration-200 dark:bg-[#18181B]',
          className
        )}
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-black/5 dark:border-white/10">
          {title && <h3 className="text-base font-semibold text-primary dark:text-neutral-100">{title}</h3>}
          <button
            onClick={onClose}
            className="p-1.5 text-secondary hover:text-primary dark:text-neutral-400 dark:hover:text-neutral-100 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors ml-auto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
