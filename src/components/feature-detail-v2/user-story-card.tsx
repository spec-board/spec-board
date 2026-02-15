'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserStoryCardProps } from './types';
import { TaskRow } from './task-row';

export function UserStoryCard({
  userStory,
  tasks,
  onTaskClick,
  selectedTaskId,
  isExpanded,
  onToggleExpand,
  featurePath,
  isFocused,
}: UserStoryCardProps) {
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Priority badge colors - using CSS variables for dark mode support
  const priorityColors: Record<string, string> = {
    P1: 'bg-[var(--color-error)]/10 text-[var(--priority-p1)] border-[var(--priority-p1)]/20',
    P2: 'bg-[var(--color-warning)]/10 text-[var(--priority-p2)] border-[var(--priority-p2)]/20',
    P3: 'bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)]',
  };

  return (
    <div className={cn(
      "bg-[var(--card)] rounded-lg shadow-sm border overflow-hidden transition-all",
      isFocused ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20" : "border-[var(--border)]"
    )}>
      {/* Card Header - Clickable to expand/collapse */}
      <button
        onClick={onToggleExpand}
        className="w-full px-4 py-3 flex items-start gap-3 hover:bg-[var(--muted)] transition-colors text-left"
      >
        {/* Expand/Collapse icon */}
        <span className="flex-shrink-0 mt-0.5 text-[var(--muted-foreground)]">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-[var(--muted-foreground)]">{userStory.id}</span>
            <span
              className={cn(
                'text-xs px-1.5 py-0.5 rounded border font-medium',
                priorityColors[userStory.priority] || 'bg-[var(--muted)] text-[var(--muted-foreground)]'
              )}
            >
              {userStory.priority}
            </span>
          </div>

          {/* User story title */}
          <h3 className="text-sm font-medium text-[var(--foreground)] line-clamp-2">
            {userStory.title}
          </h3>

          {/* Progress bar */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  progressPercent === 100
                    ? 'bg-[var(--color-success)]'
                    : progressPercent > 0
                    ? 'bg-[var(--primary)]'
                    : 'bg-[var(--muted-foreground)]'
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs text-[var(--muted-foreground)] font-medium whitespace-nowrap">
              {completedCount}/{totalCount} tasks
            </span>
          </div>
        </div>
      </button>

      {/* Tasks list - shown when expanded */}
      {isExpanded && tasks.length > 0 && (
        <div className="border-t border-[var(--border)] px-2 py-2 space-y-1 bg-[var(--muted)]/50">
          {tasks.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
              isSelected={selectedTaskId === task.id}
              featurePath={featurePath}
            />
          ))}
        </div>
      )}

      {/* Empty state when expanded but no tasks */}
      {isExpanded && tasks.length === 0 && (
        <div className="border-t border-[var(--border)] px-4 py-3 text-sm text-[var(--muted-foreground)] italic bg-[var(--muted)]/50">
          No tasks linked to this user story
        </div>
      )}
    </div>
  );
}
