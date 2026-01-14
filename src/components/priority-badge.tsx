'use client';

import { cn } from '@/lib/utils';

interface PriorityBadgeProps {
  priority: 'P1' | 'P2' | 'P3';
  className?: string;
}

const priorityStyles: Record<'P1' | 'P2' | 'P3', React.CSSProperties> = {
  P1: {
    backgroundColor: 'color-mix(in srgb, var(--priority-p1) 20%, transparent)',
    color: 'var(--priority-p1)',
    borderColor: 'color-mix(in srgb, var(--priority-p1) 30%, transparent)',
  },
  P2: {
    backgroundColor: 'color-mix(in srgb, var(--priority-p2) 20%, transparent)',
    color: 'var(--priority-p2)',
    borderColor: 'color-mix(in srgb, var(--priority-p2) 30%, transparent)',
  },
  P3: {
    backgroundColor: 'color-mix(in srgb, var(--priority-p3) 20%, transparent)',
    color: 'var(--priority-p3)',
    borderColor: 'color-mix(in srgb, var(--priority-p3) 30%, transparent)',
  },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const priorityLabels: Record<'P1' | 'P2' | 'P3', string> = {
    P1: 'Priority 1 - Critical',
    P2: 'Priority 2 - High',
    P3: 'Priority 3 - Normal',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 font-medium border',
        className
      )}
      style={{ ...priorityStyles[priority], fontSize: 'var(--text-xs)', borderRadius: 'var(--radius)' }}
      role="status"
      aria-label={priorityLabels[priority]}
    >
      {priority}
    </span>
  );
}
