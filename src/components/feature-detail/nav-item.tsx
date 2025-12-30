'use client';

import { CheckCircle2, Circle, GripVertical, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SectionStatus, SectionId } from './types';

interface NavItemProps {
  id: SectionId;
  label: string;
  status: SectionStatus;
  isActive: boolean;
  isSelected: boolean;
  taskCount?: { completed: number; total: number };
  onClick: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  shortcutKey?: number;
}

// Status indicator component
function StatusIcon({ status }: { status: SectionStatus }) {
  if (status === 'complete') {
    return <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />;
  }
  if (status === 'in-progress') {
    return (
      <div className="w-3.5 h-3.5 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin flex-shrink-0" />
    );
  }
  if (status === 'pending') {
    return <Circle className="w-3.5 h-3.5 text-[var(--muted-foreground)] flex-shrink-0" />;
  }
  if (status === 'none') {
    return <Minus className="w-3.5 h-3.5 text-[var(--muted-foreground)]/50 flex-shrink-0" />;
  }
  return null;
}

export function NavItem({
  id,
  label,
  status,
  isActive,
  isSelected,
  taskCount,
  onClick,
  onDragStart,
  onDragEnd,
  shortcutKey,
}: NavItemProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart();
  };

  const handleDragEnd = () => {
    onDragEnd();
  };

  return (
    <button
      onClick={onClick}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors group focus-ring',
        isActive
          ? 'bg-blue-500/20 text-blue-400'
          : isSelected
          ? 'bg-[var(--secondary)] text-[var(--foreground)]'
          : 'text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Drag handle - visible on hover */}
      <GripVertical className="w-3.5 h-3.5 text-[var(--muted-foreground)]/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab flex-shrink-0" />

      {/* Status icon */}
      <StatusIcon status={status} />

      {/* Label */}
      <span className="flex-1 text-left truncate">{label}</span>

      {/* Task count badge */}
      {taskCount && taskCount.total > 0 && (
        <span className={cn(
          'text-xs px-1.5 py-0.5 rounded',
          taskCount.completed === taskCount.total
            ? 'bg-green-500/20 text-green-400'
            : 'bg-[var(--secondary)] text-[var(--muted-foreground)]'
        )}>
          {taskCount.completed}/{taskCount.total}
        </span>
      )}

      {/* Keyboard shortcut hint */}
      {shortcutKey !== undefined && (
        <span className="text-xs text-[var(--muted-foreground)]/50 opacity-0 group-hover:opacity-100 transition-opacity">
          {shortcutKey}
        </span>
      )}
    </button>
  );
}
