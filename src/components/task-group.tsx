'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, Circle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PriorityBadge } from '@/components/priority-badge';
import type { Task, TaskGroup as TaskGroupType, UserStory } from '@/types';

// Number of task groups to expand by default in the list view
const DEFAULT_EXPANDED_GROUPS = 3;

interface TaskItemProps {
  task: Task;
}

function TaskItem({ task }: TaskItemProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3',
        task.completed ? 'bg-[var(--color-success)]/10' : 'hover:bg-[var(--secondary)]'
      )}
      style={{ padding: 'var(--space-1)', borderRadius: 'var(--radius)', transition: 'var(--transition-base)' }}
      role="listitem"
    >
      {task.completed ? (
        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--tag-text-success)' }} aria-hidden="true" />
      ) : (
        <Circle className="w-4 h-4 text-[var(--muted-foreground)] mt-0.5 flex-shrink-0" aria-hidden="true" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[var(--muted-foreground)]" style={{ fontSize: 'var(--text-xs)' }}>
            {task.id}
          </span>
          {task.parallel && (
            <span
              className="bg-[var(--color-info)]/20 px-1.5 py-0.5 flex items-center gap-1"
              style={{ fontSize: 'var(--text-xs)', color: 'var(--tag-text-info)', borderRadius: 'var(--radius)' }}
            >
              <Zap className="w-3 h-3" aria-hidden="true" />
              Parallel
            </span>
          )}
        </div>
        <p
          className={cn(
            'mt-1',
            task.completed && 'text-[var(--muted-foreground)] line-through'
          )}
          style={{ fontSize: 'var(--text-sm)' }}
        >
          {task.description}
        </p>
        {task.filePath && (
          <p className="text-[var(--muted-foreground)] mt-1 font-mono" style={{ fontSize: 'var(--text-xs)' }}>
            {task.filePath}
          </p>
        )}
      </div>
    </div>
  );
}

interface TaskGroupHeaderProps {
  storyId: string | null;
  storyTitle: string;
  completedCount: number;
  totalCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  priority?: 'P1' | 'P2' | 'P3';
}

function TaskGroupHeader({
  storyId,
  storyTitle,
  completedCount,
  totalCount,
  isExpanded,
  onToggle,
  priority,
}: TaskGroupHeaderProps) {
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 bg-[var(--secondary)]/50 hover:bg-[var(--secondary)] focus-ring"
      style={{ padding: 'var(--space-1-5)', borderRadius: 'var(--radius)', transition: 'var(--transition-base)' }}
      aria-expanded={isExpanded}
      aria-label={`${storyTitle}, ${completedCount} of ${totalCount} tasks completed, ${percentage}%`}
    >
      {isExpanded ? (
        <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
      ) : (
        <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
      )}

      <div className="flex-1 flex items-center gap-2 min-w-0">
        {priority && <PriorityBadge priority={priority} />}
        {storyId && (
          <span
            className="text-xs font-mono bg-purple-500/20 px-1.5 py-0.5 rounded"
            style={{ color: 'var(--tag-text-purple)' }}
          >
            {storyId}
          </span>
        )}
        <span className="font-medium text-sm truncate">{storyTitle}</span>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <div
          className="w-24 h-1.5 bg-[var(--secondary)] overflow-hidden"
          style={{ borderRadius: 'var(--radius)' }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${percentage}% complete`}
        >
          <div
            className="h-full bg-[var(--color-success)]"
            style={{ width: `${percentage}%`, transition: 'var(--transition-base)' }}
          />
        </div>
        <span className="text-[var(--muted-foreground)] tabular-nums w-16 text-right" style={{ fontSize: 'var(--text-xs)' }}>
          {completedCount}/{totalCount} ({percentage}%)
        </span>
      </div>
    </button>
  );
}

interface TaskGroupProps {
  group: TaskGroupType;
  userStory?: UserStory;
  defaultExpanded?: boolean;
}

export function TaskGroup({ group, userStory, defaultExpanded = true }: TaskGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div
      className="mb-4"
      style={{ lineHeight: 'var(--leading-normal)' }}
    >
      <TaskGroupHeader
        storyId={group.storyId}
        storyTitle={group.storyTitle}
        completedCount={group.completedCount}
        totalCount={group.totalCount}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
        priority={userStory?.priority}
      />

      {isExpanded && (
        <div className="mt-2 ml-4 pl-4 border-l-2 border-[var(--border)] space-y-1">
          {group.tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}

interface TaskGroupListProps {
  groups: TaskGroupType[];
  userStories: UserStory[];
}

export function TaskGroupList({ groups, userStories }: TaskGroupListProps) {
  // Create a map of user stories by ID for quick lookup
  const storyMap = new Map(userStories.map((s) => [s.id, s]));

  // Sort groups: user story groups first (by priority), then "Other Tasks" last
  const sortedGroups = [...groups].sort((a, b) => {
    if (!a.storyId && b.storyId) return 1;
    if (a.storyId && !b.storyId) return -1;
    if (!a.storyId && !b.storyId) return 0;

    const storyA = storyMap.get(a.storyId!);
    const storyB = storyMap.get(b.storyId!);
    if (!storyA || !storyB) return 0;

    const priorityOrder = { P1: 1, P2: 2, P3: 3 };
    return priorityOrder[storyA.priority] - priorityOrder[storyB.priority];
  });

  if (sortedGroups.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--muted-foreground)]">
        <p>No tasks defined yet</p>
      </div>
    );
  }

  return (
    <div>
      {sortedGroups.map((group, index) => (
        <TaskGroup
          key={group.storyId || `other-${index}`}
          group={group}
          userStory={group.storyId ? storyMap.get(group.storyId) : undefined}
          defaultExpanded={index < DEFAULT_EXPANDED_GROUPS}
        />
      ))}
    </div>
  );
}
