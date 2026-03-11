'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeleteProjectModalProps {
  isOpen: boolean;
  projectName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteProjectModal({ isOpen, projectName, onClose, onConfirm }: DeleteProjectModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) setIsDeleting(false);
  }, [isOpen]);

  const handleConfirm = useCallback(async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  }, [onConfirm, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        className="relative w-full max-w-sm mx-4 bg-[var(--card)] border border-[var(--border)] rounded-lg"
        style={{ boxShadow: 'var(--shadow-xl)' }}
        onKeyDown={handleKeyDown}
      >
        <div className="px-5 pt-5 pb-0">
          <h2 className="text-base font-semibold text-[var(--foreground)]">Delete project</h2>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm text-[var(--foreground)]">
            Are you sure you want to delete <strong>{projectName}</strong>?
          </p>
          <p className="text-xs text-[var(--muted-foreground)] mt-1.5">
            This action cannot be undone.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 pb-5">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="btn btn-danger btn-sm border border-red-500/20 hover:border-red-500/30"
          >
            {isDeleting ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...</>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
