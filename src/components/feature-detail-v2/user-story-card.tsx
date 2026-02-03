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

  // Priority badge colors
  const priorityColors: Record<string, string> = {
    P1: 'bg-red-100 text-red-700 border-red-200',
    P2: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    P3: 'bg-green-100 text-green-700 border-green-200',
  };

  return (
    <div className={cn(
      "bg-white rounded-lg shadow-sm border overflow-hidden transition-all",
      isFocused ? "border-blue-400 ring-2 ring-blue-200" : "border-gray-200"
    )}>
      {/* Card Header - Clickable to expand/collapse */}
      <button
        onClick={onToggleExpand}
        className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left"
      >
        {/* Expand/Collapse icon */}
        <span className="flex-shrink-0 mt-0.5 text-gray-400">
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
            <span className="text-xs font-mono text-gray-400">{userStory.id}</span>
            <span
              className={cn(
                'text-xs px-1.5 py-0.5 rounded border font-medium',
                priorityColors[userStory.priority] || 'bg-gray-100 text-gray-600'
              )}
            >
              {userStory.priority}
            </span>
          </div>

          {/* User story title */}
          <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
            {userStory.title}
          </h3>

          {/* Progress bar */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  progressPercent === 100
                    ? 'bg-green-500'
                    : progressPercent > 0
                    ? 'bg-blue-500'
                    : 'bg-gray-200'
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
              {completedCount}/{totalCount} tasks
            </span>
          </div>
        </div>
      </button>

      {/* Tasks list - shown when expanded */}
      {isExpanded && tasks.length > 0 && (
        <div className="border-t border-gray-100 px-2 py-2 space-y-1 bg-gray-50/50">
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
        <div className="border-t border-gray-100 px-4 py-3 text-sm text-gray-400 italic bg-gray-50/50">
          No tasks linked to this user story
        </div>
      )}
    </div>
  );
}
