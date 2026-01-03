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
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 text-xs font-medium rounded border',
        className
      )}
      style={priorityStyles[priority]}
    >
      {priority}
    </span>
  );
}
