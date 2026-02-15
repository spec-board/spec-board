'use client';

import { useState } from 'react';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TaskRowProps } from './types';

export function TaskRow({ task, onClick, isSelected, featurePath }: TaskRowProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [optimisticCompleted, setOptimisticCompleted] = useState<boolean | null>(null);

  // Use optimistic state if available, otherwise use actual state
  const isCompleted = optimisticCompleted ?? task.completed;

  const handleCheckboxClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger row click

    if (isToggling) return;

    setIsToggling(true);
    setOptimisticCompleted(!isCompleted);

    try {
      const response = await fetch('/api/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: `${featurePath}/tasks.md`,
          taskId: task.id,
          expectedState: isCompleted, // Current state before toggle
        }),
      });

      if (!response.ok) {
        // Revert optimistic update on error
        setOptimisticCompleted(null);
      }
    } catch {
      // Revert optimistic update on error
      setOptimisticCompleted(null);
    } finally {
      setIsToggling(false);
      // Clear optimistic state after a short delay to allow SSE update
      setTimeout(() => setOptimisticCompleted(null), 1000);
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors',
        'hover:bg-[var(--muted)]',
        isSelected && 'bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]/20'
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Checkbox */}
      <button
        onClick={handleCheckboxClick}
        disabled={isToggling}
        className={cn(
          'flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
          isCompleted
            ? 'bg-[var(--primary)] border-[var(--primary)] text-[var(--primary-foreground)]'
            : 'border-[var(--border)] hover:border-[var(--primary)]',
          isToggling && 'opacity-50'
        )}
        aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {isCompleted && <Check className="w-3 h-3" />}
      </button>

      {/* Task ID */}
      <span className="flex-shrink-0 text-xs font-mono text-[var(--muted-foreground)] w-10">
        {task.id}
      </span>

      {/* Task description */}
      <span
        className={cn(
          'flex-1 text-sm truncate',
          isCompleted ? 'text-[var(--muted-foreground)] line-through' : 'text-[var(--foreground)]'
        )}
      >
        {task.description}
      </span>

      {/* Parallel indicator */}
      {task.parallel && (
        <span className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded bg-[var(--color-phase-purple)]/10 text-[var(--color-phase-purple)] font-medium">
          P
        </span>
      )}
    </div>
  );
}
