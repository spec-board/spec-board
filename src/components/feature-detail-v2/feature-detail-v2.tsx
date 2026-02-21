'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Feature, Task } from '@/types';
import type { FeatureDetailV2Props, DocumentType } from './types';
import { groupTasksByUserStory } from './types';
import { UserStoryPanel } from './user-story-panel';
import { DocumentPanel } from './document-panel';
import { ClarifyModal } from './stages/clarify-modal';
import { useProjectStore } from '@/lib/store';

export function FeatureDetailV2({
  feature,
  onClose,
  onDelete,
  initialDocument = 'spec',
}: FeatureDetailV2Props) {
  const [selectedDocument, setSelectedDocument] = useState<DocumentType>(initialDocument);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [highlightTaskId, setHighlightTaskId] = useState<string | null>(null);
  const [showClarifyModal, setShowClarifyModal] = useState(false);
  const [localFeature, setLocalFeature] = useState(feature);
  const contentRef = useRef<HTMLDivElement>(null);

  // Get project from store for API calls
  const project = useProjectStore(state => state.project);
  // Use project name (slug) for API calls like /api/project/${name}/data
  const projectSlug = project?.name;

  // Update local feature when prop changes
  useEffect(() => {
    setLocalFeature(feature);
  }, [feature]);

  // Ref to always get latest localFeature for callbacks
  const localFeatureRef = useRef(localFeature);
  localFeatureRef.current = localFeature;

  // Callback to refresh feature data from database after saving
  const handleRefreshFeature = useCallback(async () => {
    if (!projectSlug) return;
    // Use ref to get latest values to avoid stale closure
    const featureIdToFind = localFeatureRef.current.id;
    const featureIdDbToFind = localFeatureRef.current.featureId;
    try {
      const response = await fetch(`/api/project/${projectSlug}/data`);
      if (response.ok) {
        const data = await response.json();
        // Find feature by both id and featureId for robustness
        const updatedFeature = data.features.find((f: Feature) =>
          f.id === featureIdToFind || f.featureId === featureIdDbToFind
        );
        if (updatedFeature) {
          setLocalFeature(updatedFeature);
        } else {
          console.warn('Updated feature not found in response', { featureIdToFind, featureIdDbToFind });
        }
      }
    } catch (error) {
      console.error('Failed to refresh feature:', error);
    }
  }, [projectSlug]);

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

  // Calculate total cards (user stories + uncategorized if exists)
  const totalCards = feature.userStories.length + (orphanTasks.length > 0 ? 1 : 0);

  // Handle task click - show context in doc panel
  const handleTaskClick = useCallback((task: Task, userStoryId: string | null) => {
    setSelectedTaskId(task.id);

    // Switch to tasks document and highlight the task
    setSelectedDocument('tasks');
    setHighlightTaskId(task.id);

    // Clear highlight after animation
    setTimeout(() => setHighlightTaskId(null), 2500);
  }, []);

  // Handle document change
  const handleDocumentChange = useCallback((doc: DocumentType) => {
    setSelectedDocument(doc);
    setHighlightTaskId(null); // Clear highlight when switching docs
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're in an input element
      const activeElement = document.activeElement;
      if (activeElement) {
        const tagName = activeElement.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
          return;
        }
      }

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
          
        case 'Tab':
          e.preventDefault();
          // Toggle between panels
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
          
        case 'Enter':
          // Enter is handled by UserStoryPanel for expand/collapse
          break;
          
        case ' ':
          // Space is handled by TaskRow for toggle checkbox
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, focusedPanel, totalCards]);

  // Focus the appropriate panel when focusedPanel changes
  useEffect(() => {
    if (focusedPanel === 'left' && leftPanelRef.current) {
      leftPanelRef.current.focus();
    } else if (focusedPanel === 'right' && rightPanelRef.current) {
      rightPanelRef.current.focus();
    }
  }, [focusedPanel]);

  // Handle click outside to close modal
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div
        className={cn(
          'bg-[var(--card)] rounded-lg shadow-2xl overflow-hidden',
          'w-[95vw] h-[90vh] max-w-7xl',
          'flex flex-col'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feature-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-[var(--border)] flex items-center gap-3 bg-[var(--card)]">
          <div className="flex-1 min-w-0">
            <h1
              id="feature-detail-title"
              className="text-lg font-semibold text-[var(--card-foreground)] truncate"
            >
              {feature.name}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs text-[var(--muted-foreground)]">
                {feature.featureId && `Feature ${feature.featureId} • `}{feature.stage}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[var(--muted)] transition-colors text-[var(--muted-foreground)]"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Keyboard navigation hint */}
        <div className="sr-only">
          Use Tab to switch between panels. Use arrow keys to navigate cards. Press Enter to expand or collapse.
        </div>

        {/* Two-panel layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left panel - User Stories & Tasks (40%) */}
          <div 
            ref={leftPanelRef}
            tabIndex={0}
            className={cn(
              "w-[40%] border-r border-gray-200 overflow-hidden outline-none",
              focusedPanel === 'left' && 'ring-2 ring-inset ring-blue-500/20'
            )}
            aria-label="User stories panel"
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
            aria-label="Document panel"
          >
            <DocumentPanel
              feature={localFeature}
              selectedDocument={selectedDocument}
              onDocumentChange={handleDocumentChange}
              highlightTaskId={highlightTaskId}
              contentRef={contentRef}
              onEditClarifications={() => setShowClarifyModal(true)}
            />
          </div>
        </div>

        {/* Footer with delete button - absolute bottom left */}
        {onDelete && (
          <div className="absolute bottom-0 left-0 p-3">
            <button
              onClick={onDelete}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-red-500/10 transition-colors text-[var(--muted-foreground)] hover:text-red-500 text-sm"
              aria-label="Delete feature"
            >
              <Trash2 className="w-4 h-4" />
              Delete Feature
            </button>
          </div>
        )}
      </div>

      {/* Clarify Modal for editing clarifications */}
      {showClarifyModal && (
        <ClarifyModal
          feature={localFeature}
          onClose={() => setShowClarifyModal(false)}
          onStageChange={(stage) => {
            // Update local feature stage when stage changes
            setLocalFeature(prev => ({ ...prev, stage }));
            setShowClarifyModal(false);
          }}
          onRefresh={handleRefreshFeature}
        />
      )}
    </div>
  );
}
