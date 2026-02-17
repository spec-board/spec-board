'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { Feature, Task } from '@/types';
import type { BaseModalProps } from '../base/types';
import { BaseModal } from '../base/base-modal';
import { groupTasksByUserStory } from '../types';
import { UserStoryPanel } from '../user-story-panel';
import { DocumentPanel } from '../document-panel';

export function TasksModal({ feature, onClose, onStageChange }: BaseModalProps) {
  const [selectedDocument, setSelectedDocument] = useState<string>('tasks');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [highlightTaskId, setHighlightTaskId] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation state
  const [focusedPanel, setFocusedPanel] = useState<'left' | 'right'>('left');
  const [focusedCardIndex, setFocusedCardIndex] = useState<number>(0);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  // Group tasks by user story
  const { orphans: orphanTasks } = useMemo(
    () => groupTasksByUserStory(feature.tasks, feature.userStories),
    [feature.tasks, feature.userStories]
  );

  const totalCards = feature.userStories.length + (orphanTasks.length > 0 ? 1 : 0);

  // Handle task click
  const handleTaskClick = useCallback((task: Task, userStoryId: string | null) => {
    setSelectedTaskId(task.id);
    setSelectedDocument('tasks');
    setHighlightTaskId(task.id);
    setTimeout(() => setHighlightTaskId(null), 2500);
  }, []);

  // Handle document change
  const handleDocumentChange = useCallback((doc: string) => {
    setSelectedDocument(doc);
    setHighlightTaskId(null);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (activeElement?.tagName.toLowerCase() === 'input' ||
          activeElement?.tagName.toLowerCase() === 'textarea' ||
          activeElement?.tagName.toLowerCase() === 'select') {
        return;
      }

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'Tab':
          e.preventDefault();
          setFocusedPanel(prev => prev === 'left' ? 'right' : 'left');
          break;
        case 'ArrowUp':
          if (focusedPanel === 'left' && totalCards > 0) {
            e.preventDefault();
            setFocusedCardIndex(prev => Math.max(0, prev - 1));
          }
          break;
        case 'ArrowDown':
          if (focusedPanel === 'left' && totalCards > 0) {
            e.preventDefault();
            setFocusedCardIndex(prev => Math.min(totalCards - 1, prev + 1));
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, focusedPanel, totalCards]);

  // Focus panel
  useEffect(() => {
    if (focusedPanel === 'left' && leftPanelRef.current) {
      leftPanelRef.current.focus();
    } else if (focusedPanel === 'right' && rightPanelRef.current) {
      rightPanelRef.current.focus();
    }
  }, [focusedPanel]);

  return (
    <BaseModal
      feature={feature}
      onClose={onClose}
      onStageChange={onStageChange}
      showNavigation
    >
      <div className="flex h-full">
        {/* Left panel - User Stories & Tasks (40%) */}
        <div
          ref={leftPanelRef}
          tabIndex={0}
          className={cn(
            "w-[40%] border-r border-[var(--border)] overflow-hidden outline-none",
            focusedPanel === 'left' && 'ring-2 ring-inset ring-blue-500/20'
          )}
        >
          <UserStoryPanel
            feature={feature}
            userStories={feature.userStories}
            taskGroups={feature.taskGroups}
            orphanTasks={orphanTasks}
            onTaskClick={handleTaskClick}
            selectedTaskId={selectedTaskId}
            focusedCardIndex={focusedPanel === 'left' ? focusedCardIndex : null}
          />
        </div>

        {/* Right panel - Document viewer (60%) */}
        <div
          ref={rightPanelRef}
          tabIndex={0}
          className={cn(
            "w-[60%] overflow-hidden outline-none",
            focusedPanel === 'right' && 'ring-2 ring-inset ring-blue-500/20'
          )}
        >
          <DocumentPanel
            feature={feature}
            selectedDocument={selectedDocument as any}
            onDocumentChange={handleDocumentChange as any}
            highlightTaskId={highlightTaskId}
            contentRef={contentRef}
          />
        </div>
      </div>
    </BaseModal>
  );
}
