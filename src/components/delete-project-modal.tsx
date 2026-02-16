'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeleteProjectModalProps {
  isOpen: boolean;
  projectName: string;
  projectPath: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteProjectModal({ isOpen, projectName, projectPath, onClose, onConfirm }: DeleteProjectModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsDeleting(false);
    }
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

  // Handle keyboard
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md mx-4 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div
          className="flex items-center justify-center border-b border-[var(--border)]"
          style={{ padding: 'var(--space-4)' }}
        >
          <h2
            className="font-semibold"
            style={{ fontSize: 'var(--text-lg)' }}
          >
            Delete Project
          </h2>
        </div>

        {/* Content */}
        <div style={{ padding: 'var(--space-4)' }}>
          <p className="text-sm text-[var(--foreground)]">
            Are you sure you want to delete <strong>{projectName}</strong>?
          </p>
          <p className="text-xs text-[var(--muted-foreground)] mt-2">
            This will remove the project from the database. Your spec-kit files (spec.md, plan.md, tasks.md, etc.) will remain unchanged.
          </p>
          <div
            className="mt-4 p-3 rounded-lg text-xs font-mono"
            style={{
              backgroundColor: 'var(--secondary)',
              color: 'var(--muted-foreground)',
            }}
          >
            {projectPath}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-center gap-3 border-t border-[var(--border)]"
          style={{ padding: 'var(--space-4)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--secondary)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
              'transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
              'bg-red-500 hover:bg-red-600 text-white'
            )}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Removing...
              </>
            ) : (
              'Delete Project'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
