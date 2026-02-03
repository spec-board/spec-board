'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserStoryPanelProps } from './types';
import { UserStoryCard } from './user-story-card';
import { TaskRow } from './task-row';

export function UserStoryPanel({
  feature,
  userStories,
  taskGroups,
  orphanTasks,
  onTaskClick,
  selectedTaskId,
  focusedCardIndex,
}: UserStoryPanelProps) {
  // Track which cards are expanded - default all expanded
  const [expandedCards, setExpandedCards] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    userStories.forEach(us => initial.add(us.id));
    if (orphanTasks.length > 0) initial.add('uncategorized');
    return initial;
  });

  // Refs for scrolling focused card into view
  const cardRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());

  // Group tasks by user story
  const tasksByStory = useMemo(() => {
    const map = new Map<string, typeof feature.tasks>();

    // Initialize with empty arrays for each user story
    userStories.forEach(us => map.set(us.id, []));

    // Group tasks
    feature.tasks.forEach(task => {
      if (task.userStory && map.has(task.userStory)) {
        map.get(task.userStory)!.push(task);
      }
    });

    return map;
  }, [feature.tasks, userStories]);

  const toggleExpand = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Scroll focused card into view
  useEffect(() => {
    if (focusedCardIndex !== null && focusedCardIndex !== undefined) {
      const cardElement = cardRefs.current.get(focusedCardIndex);
      if (cardElement) {
        cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [focusedCardIndex]);

  // Handle keyboard Enter to toggle expand
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && focusedCardIndex !== null && focusedCardIndex !== undefined) {
        e.preventDefault();
        // Get the ID of the focused card
        if (focusedCardIndex < userStories.length) {
          const usId = userStories[focusedCardIndex].id;
          toggleExpand(usId);
        } else if (focusedCardIndex === userStories.length && orphanTasks.length > 0) {
          toggleExpand('uncategorized');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedCardIndex, userStories, orphanTasks.length]);

  // Calculate overall progress
  const totalTasks = feature.tasks.length;
  const completedTasks = feature.tasks.filter(t => t.completed).length;

  // Empty state
  if (userStories.length === 0 && orphanTasks.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="text-gray-400 mb-2">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
        </div>
        <p className="text-sm text-gray-500">No user stories defined</p>
        <p className="text-xs text-gray-400 mt-1">Add them to spec.md</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header with overall progress */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-700">User Stories</h2>
          <span className="text-xs text-gray-500">
            {completedTasks}/{totalTasks} tasks
          </span>
        </div>
        {/* Overall progress bar */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              completedTasks === totalTasks && totalTasks > 0
                ? 'bg-green-500'
                : 'bg-blue-500'
            )}
            style={{ width: totalTasks > 0 ? `${(completedTasks / totalTasks) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* Scrollable cards list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* User Story Cards */}
        {userStories.map((us, index) => (
          <div 
            key={us.id} 
            ref={(el) => { cardRefs.current.set(index, el); }}
          >
            <UserStoryCard
              userStory={us}
              tasks={tasksByStory.get(us.id) || []}
              onTaskClick={(task) => onTaskClick(task, us.id)}
              selectedTaskId={selectedTaskId}
              isExpanded={expandedCards.has(us.id)}
              onToggleExpand={() => toggleExpand(us.id)}
              featurePath={feature.path}
              isFocused={focusedCardIndex === index}
            />
          </div>
        ))}

        {/* Uncategorized Tasks Card - shown at bottom per design decision */}
        {orphanTasks.length > 0 && (
          <div 
            ref={(el) => { cardRefs.current.set(userStories.length, el); }}
            className={cn(
              "bg-white rounded-lg shadow-sm border overflow-hidden transition-all",
              focusedCardIndex === userStories.length 
                ? "border-blue-400 ring-2 ring-blue-200" 
                : "border-gray-200"
            )}
          >
            <button
              onClick={() => toggleExpand('uncategorized')}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
            >
              <Package className="w-4 h-4 text-gray-400" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-600">
                  Uncategorized Tasks
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-400 rounded-full transition-all duration-300"
                      style={{
                        width: `${orphanTasks.length > 0
                          ? (orphanTasks.filter(t => t.completed).length / orphanTasks.length) * 100
                          : 0}%`
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                    {orphanTasks.filter(t => t.completed).length}/{orphanTasks.length} tasks
                  </span>
                </div>
              </div>
            </button>

            {expandedCards.has('uncategorized') && (
              <div className="border-t border-gray-100 px-2 py-2 space-y-1 bg-gray-50/50">
                {orphanTasks.map(task => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onClick={() => onTaskClick(task, null)}
                    isSelected={selectedTaskId === task.id}
                    featurePath={feature.path}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
