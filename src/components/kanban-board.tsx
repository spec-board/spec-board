'use client';

import { forwardRef, useEffect, useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn, getFeatureKanbanColumn, getKanbanColumnLabel, type KanbanColumn } from '@/lib/utils';
import type { Feature, KanbanColumnType } from '@/types';
import { GitBranch, CheckCircle2, Plus, Settings } from 'lucide-react';
import { announce } from '@/lib/accessibility';
import { useProjectStore } from '@/lib/store';
import { useSettingsStore } from '@/lib/settings-store';
import { toast } from 'sonner';
import { CreateFeatureModal } from './create-feature-modal';
import { CircularProgress, DualCircularProgress } from './circular-progress';

const COLUMNS: KanbanColumn[] = ['backlog', 'specs', 'plan', 'tasks'];

// Get status dot style based on progress percentage (Jira-style 3-state)
// Uses CSS variables: --status-not-started (0%), --status-in-progress (1-79%), --status-complete (80%+)
function getStatusDotStyle(percentage: number, hasItems: boolean): React.CSSProperties {
  if (!hasItems || percentage === 0) return { backgroundColor: 'var(--status-not-started)' };
  if (percentage < 80) return { backgroundColor: 'var(--status-in-progress)' };
  return { backgroundColor: 'var(--status-complete)' };
}

function getStatusLabel(percentage: number, hasItems: boolean): string {
  if (!hasItems || percentage === 0) return 'Not started';
  if (percentage < 80) return 'In progress';
  if (percentage < 100) return 'Nearly done';
  return 'Complete';
}

interface FeatureCardProps {
  feature: Feature;
  onClick: () => void;
  isFocused?: boolean;
  onDragStart?: (feature: Feature) => void;
  onDragEnd?: () => void;
  targetStage?: KanbanColumn | null; // Stage this feature is being moved to
}

// Extract spec number from feature id (e.g., "012" from "012-ui-ux-rebrand")
function getSpecNumber(featureId: string): string | null {
  const match = featureId.match(/^(\d+)/);
  return match ? match[1] : null;
}

// Count checklist files from additionalFiles
function getChecklistCount(feature: Feature): number {
  return feature.additionalFiles?.filter(f => f.type === 'checklist' && f.exists).length ?? 0;
}

// Format feature name to Title Case (e.g., "ui ux rebrand" → "Ui Ux Rebrand")
function toTitleCase(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

const FeatureCard = forwardRef<HTMLButtonElement, FeatureCardProps>(function FeatureCard(
  { feature, onClick, isFocused, onDragStart, onDragEnd, targetStage },
  ref
) {
  const progressPercentage = feature.totalTasks > 0
    ? Math.round((feature.completedTasks / feature.totalTasks) * 100)
    : 0;

  const checklistProgressPercentage = feature.checklistProgress
    ? Math.round((feature.checklistProgress.completed / feature.checklistProgress.total) * 100)
    : 0;

  const isComplete = progressPercentage === 100;
  const statusDotStyle = getStatusDotStyle(progressPercentage, feature.totalTasks > 0);
  const statusLabel = getStatusLabel(progressPercentage, feature.totalTasks > 0);

  // Extract spec number from featureId (e.g., "001" from "001-user-login")
  // Use featureId if available, fallback to id for backwards compatibility
  const specNumber = getSpecNumber(feature.featureId || feature.id);
  const checklistCount = getChecklistCount(feature);

  // Get label for target stage
  const targetStageLabel = targetStage ? getKanbanColumnLabel(targetStage) : null;

  // Build accessible label - show description only in specs/plan, show task count in tasks
  const isEarlyStage = ['specs', 'plan'].includes(feature.stage);
  const ariaLabel = [
    specNumber ? `${specNumber} ${feature.name}` : feature.name,
    isEarlyStage && feature.description ? feature.description : (feature.totalTasks > 0 ? `${feature.completedTasks} of ${feature.totalTasks} tasks complete` : null),
    checklistCount > 0 ? `${checklistCount} checklists` : null,
  ].filter(Boolean).join(', ');

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      featureId: feature.id,
      featureName: feature.name,
      currentColumn: feature.stage
    }));
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.(feature);
  };

  const handleDragEnd = () => {
    // Clear drag state when drag ends - call the callback prop
    onDragEnd?.();
  };

  return (
    <button
      ref={ref}
      onClick={onClick}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      aria-label={ariaLabel}
      className={cn(
        'w-full text-left rounded-md transition-all',
        'bg-[var(--card)] border border-[var(--border)]',
        'hover:bg-[var(--card-hover)] hover:border-[var(--border-hover)] hover:-translate-y-0.5',
        'focus-ring',
        isFocused && 'ring-2 ring-[var(--ring)] ring-offset-2 ring-offset-[var(--background)]'
      )}
      style={{
        padding: 'var(--space-4)', // 16px padding
        borderRadius: 'var(--radius)', // 6px
        transitionDuration: 'var(--transition-base)', // 150ms ease-out
      }}
    >
      {/* Title row with status dot */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <h4 className="font-medium text-sm text-[var(--foreground)] truncate flex-1">
          {/* Spec number prefix */}
          {specNumber && (
            <span className="text-[var(--muted-foreground)] font-mono">{specNumber} </span>
          )}
          <span>{toTitleCase(feature.name)}</span>
        </h4>
        <div className="flex items-center gap-1">
          {/* Target stage indicator - shows when feature is being dragged to new column */}
          {targetStageLabel && (
            <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-500 rounded font-medium">
              → {targetStageLabel}
            </span>
          )}
          {/* Status indicator - checkmark when complete */}
          {isComplete ? (
            <CheckCircle2
              className="w-4 h-4 text-green-500 flex-shrink-0"
              aria-label="Complete"
            />
          ) : null}
        </div>
      </div>

      {/* Progress rings + description */}
      <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Description (if exists) */}
          {feature.description && (
            <span className="truncate flex-1" title={feature.description}>
              {feature.description}
            </span>
          )}

          {/* Progress rings - show when has tasks or checklist */}
          {(feature.totalTasks > 0 || feature.checklistProgress) && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Task ring - primary color with "T" label */}
              {feature.totalTasks > 0 && (
                <div className="flex items-center gap-1" title={`Tasks: ${feature.completedTasks}/${feature.totalTasks}`}>
                  <CircularProgress
                    value={progressPercentage}
                    size={20}
                    strokeWidth={2.5}
                    color="var(--primary)"
                    label="T"
                  />
                </div>
              )}

              {/* Checklist ring - green color with "C" label */}
              {feature.checklistProgress && (
                <div className="flex items-center gap-1" title={`Checklist: ${feature.checklistProgress.completed}/${feature.checklistProgress.total}`}>
                  <CircularProgress
                    value={checklistProgressPercentage}
                    size={20}
                    strokeWidth={2.5}
                    color="var(--color-success)"
                    label="C"
                  />
                </div>
              )}
            </div>
          )}

          {/* No tasks, no description */}
          {!feature.description && feature.totalTasks === 0 && !feature.checklistProgress && (
            <span className="tabular-nums">0 tasks</span>
          )}
        </div>

        {/* Branch icon (shown if exists) */}
        {feature.branch && (
          <div className="flex items-center gap-1 opacity-60">
            <GitBranch className="w-3 h-3" />
          </div>
        )}
      </div>
    </button>
  );
});

interface EmptyColumnProps {
  column: KanbanColumn;
}

function EmptyColumn({ column }: EmptyColumnProps) {
  const hints: Record<KanbanColumn, string> = {
    backlog: 'Add feature ideas here',
    specs: 'Spec and clarifications in progress',
    plan: 'Plan and checklist being created',
    tasks: 'Tasks with analysis',
  };

  return (
    <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-[var(--border)] rounded-lg text-[var(--muted-foreground)]">
      <span className="text-xs">{hints[column]}</span>
    </div>
  );
}

interface KanbanColumnComponentProps {
  column: KanbanColumn;
  features: Feature[];
  onFeatureClick: (feature: Feature) => void;
  focusedFeatureId: string | null;
  setCardRef: (featureId: string, element: HTMLButtonElement | null) => void;
  onCreateFeature?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent) => void;
  isDropTarget?: boolean;
  onDragStartCard?: (feature: Feature) => void;
  onDragEndCard?: () => void;
  dragTargetColumn?: KanbanColumn | null; // Column being dragged over (for showing target stage)
}

function KanbanColumnComponent({
  column,
  features,
  onFeatureClick,
  focusedFeatureId,
  setCardRef,
  onCreateFeature,
  onDragOver,
  onDragLeave,
  onDrop,
  isDropTarget,
  onDragStartCard,
  onDragEndCard,
  dragTargetColumn,
}: KanbanColumnComponentProps) {
  const columnLabel = getKanbanColumnLabel(column);

  return (
    <div
      className="flex flex-col flex-1 min-w-[250px] max-w-[350px]"
      role="region"
      aria-label={`${columnLabel} column`}
    >
      {/* Column header */}
      <div 
        className="flex items-center justify-between border-b-2 border-[var(--border)]
          bg-gradient-to-b from-[var(--card)] to-transparent"
        style={{
          paddingLeft: 'var(--space-3)', // 12px
          paddingRight: 'var(--space-3)', // 12px
          paddingTop: 'var(--space-4)', // 16px
          paddingBottom: 'var(--space-4)', // 16px
        }}
      >
        <div className="flex items-center gap-2">
          <h3
            className="font-semibold uppercase tracking-wide text-[var(--foreground)]"
            id={`column-${column}-heading`}
            style={{
              fontSize: 'var(--text-sm)', // 14px
            }}
          >
            {columnLabel}
          </h3>
          <span
            className="font-medium text-[var(--muted-foreground)] tabular-nums
              bg-[var(--secondary)] rounded-full"
            aria-label={`${features.length} features`}
            style={{
              fontSize: 'var(--text-xs)', // 12px
              paddingLeft: 'var(--space-2)', // 8px
              paddingRight: 'var(--space-2)', // 8px
              paddingTop: 'calc(var(--space-1) / 2)', // 2px
              paddingBottom: 'calc(var(--space-1) / 2)', // 2px
            }}
          >
            {features.length}
          </span>
        </div>
        {/* Inline create feature button for Backlog column */}
        {column === 'backlog' && onCreateFeature && (
          <button
            onClick={onCreateFeature}
            className="btn btn-primary btn-xs"
            aria-label="Create new feature"
          >
            Create Feature
          </button>
        )}
      </div>

      {/* Column content */}
      <div
        className={cn(
          'flex-1 min-h-[200px]',
          isDropTarget && 'ring-2 ring-blue-500 ring-inset bg-blue-500/5'
        )}
        role="list"
        aria-labelledby={`column-${column}-heading`}
        aria-label={`${columnLabel} features, ${features.length} items`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{
          paddingTop: 'var(--space-3)', // 12px
          gap: 'var(--space-3)', // 12px between cards
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {features.length === 0 ? (
          <EmptyColumn column={column} />
        ) : (
          features.map((feature) => {
            const isFocused = feature.id === focusedFeatureId;
            return (
              <div key={feature.id} role="listitem" className="w-full">
                <FeatureCard
                  ref={(el) => setCardRef(feature.id, el)}
                  feature={feature}
                  onClick={() => {
                    announce(`Opening ${feature.name} details`);
                    onFeatureClick(feature);
                  }}
                  isFocused={isFocused}
                  onDragStart={onDragStartCard}
                  targetStage={isDropTarget ? column : null}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  features: Feature[];
  onFeatureClick: (feature: Feature) => void;
  projectPath: string;
  projectId?: string;
  onFeaturesChange?: (features: Feature[]) => void;  // Callback for parent to update features
  onRefresh?: () => void;  // Optional direct refresh callback from parent
}

export function KanbanBoard({ features, onFeatureClick, projectPath, projectId, onFeaturesChange, onRefresh }: KanbanBoardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [dropTargetColumn, setDropTargetColumn] = useState<KanbanColumn | null>(null);
  const [dragSourceColumn, setDragSourceColumn] = useState<KanbanColumn | null>(null);
  const [showAIConfigDialog, setShowAIConfigDialog] = useState(false);

  const router = useRouter();
  const { focusState, setFocusState, clearFocusState } = useProjectStore();
  const { aiSettings } = useSettingsStore();
  const cardRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());
  const boardRef = useRef<HTMLElement>(null);

  // Get column index for ordering
  const getColumnIndex = (column: KanbanColumn) => COLUMNS.indexOf(column);

  // Handle card drag start - track source column
  const handleCardDragStart = useCallback((feature: Feature) => {
    const sourceColumn = getFeatureKanbanColumn(feature);
    setDragSourceColumn(sourceColumn);
  }, []);

  // Handle drag over column - only allow next step
  const handleDragOver = useCallback((column: KanbanColumn) => (e: React.DragEvent) => {
    if (!dragSourceColumn) return;

    const sourceIndex = getColumnIndex(dragSourceColumn);
    const targetIndex = getColumnIndex(column);
    const isNextStep = targetIndex === sourceIndex + 1;

    if (isNextStep) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDropTargetColumn(column);
    }
    // If not next step, don't set drop target (won't highlight)
  }, [dragSourceColumn]);

  // Handle drag leave
  const handleDragLeave = useCallback(() => {
    setDropTargetColumn(null);
  }, []);

  // Helper to refresh data after drop - use onRefresh callback if provided, otherwise dispatch event
  const refreshData = useCallback(() => {
    // Option B: Use direct callback if provided (more reliable than event)
    if (onRefresh) {
      onRefresh();
    } else {
      // Fallback: dispatch event for smooth refresh - parent listens and re-fetches
      window.dispatchEvent(new CustomEvent('features-updated'));
    }
  }, [onRefresh]);


  // Handle drop - trigger background job via BullMQ
  const handleDrop = useCallback((targetColumn: KanbanColumn) => async (e: React.DragEvent) => {
    e.preventDefault();
    setDropTargetColumn(null);
    setDragSourceColumn(null);

    // Check if AI provider is configured before proceeding
    if (!aiSettings.hasApiKey && !aiSettings.apiKey) {
      setShowAIConfigDialog(true);
      return;
    }

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const { featureId, currentColumn } = data;

      const sourceIndex = getColumnIndex(currentColumn as KanbanColumn);
      const targetIndex = getColumnIndex(targetColumn);

      // Only allow forward movement to the NEXT step (no skipping)
      const isNextStep = targetIndex === sourceIndex + 1;

      if (!isNextStep) {
        // Can only move to the next step, not skip
        alert('Can only move to the next step. Please complete this step first.');
        return;
      }

      // Backward movement (targetIndex < sourceIndex) - just reload
      if (targetIndex < sourceIndex) {
        refreshData();
        return;
      }

      // Find the feature
      const feature = features.find(f => f.id === featureId);
      if (!feature) return;

      // Trigger background job via BullMQ API
      setIsLoading(true);
      setLoadingMessage('Queuing background job...');

      const response = await fetch('/api/stage-transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureId: feature.id,
          fromStage: currentColumn,
          toStage: targetColumn,
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to trigger background job');
      }

      const result = await response.json();

      // Show toast that job was queued
      toast.success(`Feature queued for ${targetColumn} - refresh (F5) to see updates when complete`);

      // NOTE: No auto-refresh - user manually refreshes (F5) after job completes

    } catch (err) {
      console.error('Drop error:', err);
      alert(err instanceof Error ? err.message : 'Failed to process drop');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [features, projectId, refreshData, aiSettings]);

  // Group features by kanban column (using new function that considers checklists)
  const featuresByColumn = COLUMNS.reduce((acc, column) => {
    acc[column] = features.filter((f) => getFeatureKanbanColumn(f) === column);
    return acc;
  }, {} as Record<KanbanColumn, Feature[]>);

  // Calculate totals for screen reader summary
  const totalFeatures = features.length;

  // Initialize focus to first card if no focus and user starts navigating
  const initializeFocus = useCallback(() => {
    if (focusState.featureId) return; // Already focused

    // Find first non-empty column
    for (const column of COLUMNS) {
      const columnFeatures = featuresByColumn[column];
      if (columnFeatures.length > 0) {
        setFocusState({
          column: column as KanbanColumnType,
          cardIndex: 0,
          featureId: columnFeatures[0].id,
        });
        announce(`Focused on ${columnFeatures[0].name} in ${column.replace('_', ' ')} column`, 'polite');
        return;
      }
    }
  }, [focusState.featureId, featuresByColumn, setFocusState]);

  // Navigate within column (up/down)
  const navigateVertical = useCallback((direction: 'up' | 'down') => {
    if (!focusState.column) {
      initializeFocus();
      return;
    }

    const columnFeatures = featuresByColumn[focusState.column];
    if (columnFeatures.length === 0) return;

    const currentIndex = focusState.cardIndex ?? 0;
    const newIndex = direction === 'up'
      ? Math.max(0, currentIndex - 1)
      : Math.min(columnFeatures.length - 1, currentIndex + 1);

    if (newIndex !== currentIndex) {
      const newFeature = columnFeatures[newIndex];
      setFocusState({
        cardIndex: newIndex,
        featureId: newFeature.id,
      });
      announce(`${newFeature.name}`, 'polite');
    }
  }, [focusState, featuresByColumn, setFocusState, initializeFocus]);

  // Navigate between columns (left/right)
  const navigateHorizontal = useCallback((direction: 'left' | 'right') => {
    if (!focusState.column) {
      initializeFocus();
      return;
    }

    const currentColIndex = COLUMNS.indexOf(focusState.column);
    const newColIndex = direction === 'left'
      ? Math.max(0, currentColIndex - 1)
      : Math.min(COLUMNS.length - 1, currentColIndex + 1);

    if (newColIndex !== currentColIndex) {
      const newColumn = COLUMNS[newColIndex] as KanbanColumnType;
      const columnFeatures = featuresByColumn[newColumn];

      // Try to maintain similar position, or go to first/last card
      const newIndex = columnFeatures.length > 0
        ? Math.min(focusState.cardIndex ?? 0, columnFeatures.length - 1)
        : null;

      setFocusState({
        column: newColumn,
        cardIndex: newIndex,
        featureId: newIndex !== null ? columnFeatures[newIndex]?.id ?? null : null,
      });

      const columnLabel = getKanbanColumnLabel(newColumn);
      if (columnFeatures.length > 0 && newIndex !== null) {
        announce(`${columnLabel} column, ${columnFeatures[newIndex].name}`, 'polite');
      } else {
        announce(`${columnLabel} column, empty`, 'polite');
      }
    }
  }, [focusState, featuresByColumn, setFocusState, initializeFocus]);

  // Open focused card
  const openFocusedCard = useCallback(() => {
    if (!focusState.featureId) return;

    const feature = features.find(f => f.id === focusState.featureId);
    if (feature) {
      announce(`Opening ${feature.name}`, 'polite');
      onFeatureClick(feature);
    }
  }, [focusState.featureId, features, onFeatureClick]);

  // Keyboard event handler - scoped to board element
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>) => {
    // Check if we're in an editable element
    const activeElement = document.activeElement;
    if (activeElement) {
      const tagName = activeElement.tagName.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
        return;
      }
      if (activeElement.getAttribute('contenteditable') === 'true') {
        return;
      }
    }

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        navigateVertical('up');
        break;
      case 'ArrowDown':
        e.preventDefault();
        navigateVertical('down');
        break;
      case 'ArrowLeft':
        if (e.shiftKey) {
          // Shift+Left: Move card (not supported in read-only mode)
          if (focusState.featureId) {
            e.preventDefault();
            announce('Card movement is not available. Feature status is determined by spec-kit files.', 'polite');
          }
        } else {
          e.preventDefault();
          navigateHorizontal('left');
        }
        break;
      case 'ArrowRight':
        if (e.shiftKey) {
          // Shift+Right: Move card (not supported in read-only mode)
          if (focusState.featureId) {
            e.preventDefault();
            announce('Card movement is not available. Feature status is determined by spec-kit files.', 'polite');
          }
        } else {
          e.preventDefault();
          navigateHorizontal('right');
        }
        break;
      case 'Enter':
        if (focusState.featureId) {
          e.preventDefault();
          openFocusedCard();
        }
        break;
      case 'Escape':
        if (focusState.featureId) {
          e.preventDefault();
          clearFocusState();
          announce('Focus cleared', 'polite');
        }
        break;
    }
  }, [navigateVertical, navigateHorizontal, openFocusedCard, focusState.featureId, clearFocusState]);

  // Focus the card element when focusState changes (FR-008)
  useEffect(() => {
    if (focusState.featureId) {
      const cardElement = cardRefs.current.get(focusState.featureId);
      if (cardElement) {
        cardElement.focus({ preventScroll: false });
      }
    }
  }, [focusState.featureId]);

  // Store card refs using callback ref pattern
  const setCardRef = useCallback((featureId: string, element: HTMLButtonElement | null) => {
    if (element) {
      cardRefs.current.set(featureId, element);
    } else {
      cardRefs.current.delete(featureId);
    }
  }, []);

  return (
    <>
    <section
      ref={boardRef}
      aria-label="Feature board"
      className="flex overflow-x-auto pb-4"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        gap: 'var(--space-6)', // 24px gap between columns
      }}
    >
      {/* Screen reader summary */}
      <div className="sr-only" aria-live="polite">
        {totalFeatures} total features: {featuresByColumn['backlog'].length} in backlog, {featuresByColumn['specs'].length} in specs,
        {featuresByColumn['plan'].length} in plan, {featuresByColumn['tasks'].length} in tasks
      </div>

      {/* Keyboard navigation hint */}
      <div className="sr-only">
        Use arrow keys to navigate between cards. Press Enter to open a card. Press Escape to clear focus.
      </div>

      {COLUMNS.map((column) => (
        <KanbanColumnComponent
          key={column}
          column={column}
          features={featuresByColumn[column]}
          onFeatureClick={onFeatureClick}
          focusedFeatureId={focusState.featureId}
          setCardRef={setCardRef}
          onCreateFeature={column === 'backlog' ? () => setIsModalOpen(true) : undefined}
          onDragOver={handleDragOver(column)}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop(column)}
          isDropTarget={dropTargetColumn === column}
          onDragStartCard={handleCardDragStart}
          onDragEndCard={() => setDragSourceColumn(null)}
        />
      ))}
    </section>

    {projectId && (
      <CreateFeatureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={projectId}
        projectPath={projectPath}
        onFeatureCreated={(feature) => {
          console.log('Feature created:', feature);
          // Reload the page to fetch new data - use smooth refresh
          refreshData();
        }}
      />
    )}

    {/* Loading overlay during drag-drop generation */}
    {isLoading && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] transition-opacity duration-200">
        <div className="bg-[var(--card)] rounded-lg px-8 py-6 flex flex-col items-center gap-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="relative">
            <svg className="animate-spin w-8 h-8 text-[var(--foreground)]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[var(--foreground)]">{loadingMessage}</p>
        </div>
      </div>
    )}

    {/* AI Provider not configured dialog */}
    {showAIConfigDialog && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
        <div
          className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-md mx-4 shadow-2xl"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center">
                <Settings className="w-5 h-5 text-[var(--foreground)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                AI Provider Required
              </h3>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
              To generate specs, plans, and tasks automatically, you need to configure an AI provider with a valid API key. This is required for stage transitions.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 px-6 pb-6 pt-2">
            <button
              onClick={() => setShowAIConfigDialog(false)}
              className="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowAIConfigDialog(false);
                router.push('/settings');
              }}
              className="btn btn-primary btn-sm"
            >
              Go to Settings
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
