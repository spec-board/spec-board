'use client';

import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
  const [isMounted, setIsMounted] = useState(false);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && cancelButtonRef.current) {
      setTimeout(() => cancelButtonRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isMounted || !isOpen) return null;

  const variantStyles = {
    danger: {
      icon: 'bg-[var(--accent)] text-[var(--foreground)]',
      button: '',
    },
    warning: {
      icon: 'bg-[var(--accent)] text-[var(--foreground)]',
      button: '',
    },
    info: {
      icon: 'bg-[var(--accent)] text-[var(--foreground)]',
      button: '',
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        className={cn(
          'relative z-10 w-full max-w-md mx-4 p-6',
          'bg-[var(--background)] border border-[var(--border)] rounded-xl',
          'shadow-2xl animate-in fade-in zoom-in-95 duration-200'
        )}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        {/* Icon */}
        <div className={cn('w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto', variantStyles[variant].icon)}>
          <AlertTriangle className="w-6 h-6" />
        </div>

        {/* Title */}
        <h2 id="dialog-title" className="text-lg font-semibold mb-2 text-center">
          {title}
        </h2>

        {/* Message */}
        <p id="dialog-description" className="text-sm text-[var(--muted-foreground)] mb-6 text-center">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button
            ref={cancelButtonRef}
            onClick={onCancel}
            disabled={isLoading}
            className="btn btn-secondary btn-sm"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'btn btn-sm',
              variant === 'danger' && 'btn-danger border border-red-500/20',
              variant === 'warning' && 'btn-primary',
              variant === 'info' && 'btn-primary',
            )}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
