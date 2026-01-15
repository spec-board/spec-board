'use client';

import { cn } from '@/lib/utils';

export type StatusState = 'not-started' | 'in-progress' | 'complete';

interface StatusDotProps {
  status: StatusState;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Calculate status from completion percentage
 * - 0%: not-started (blue)
 * - 1-79%: in-progress (yellow)
 * - 80-100%: complete (green)
 */
export function getStatusFromCompletion(completed: number, total: number): StatusState {
  if (total === 0 || completed === 0) return 'not-started';
  if ((completed / total) * 100 >= 80) return 'complete';
  return 'in-progress';
}

/**
 * StatusDot - A simple 8px circular status indicator
 * Replaces verbose progress bars with Jira-style status dots
 */
export function StatusDot({ status, size = 'md', className }: StatusDotProps) {
  const sizeClass = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  const colorVar = {
    'not-started': 'var(--status-not-started)',
    'in-progress': 'var(--status-in-progress)',
    'complete': 'var(--status-complete)',
  }[status];

  return (
    <div
      className={cn('rounded-full flex-shrink-0', sizeClass, className)}
      style={{ backgroundColor: colorVar }}
      role="img"
      aria-label={`Status: ${status.replace('-', ' ')}`}
    />
  );
}
