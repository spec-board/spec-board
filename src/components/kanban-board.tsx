'use client';

import { forwardRef, useEffect, useCallback, useRef, useState } from 'react';
import { cn, getFeatureKanbanColumn, getKanbanColumnLabel, type KanbanColumn } from '@/lib/utils';
import type { Feature, KanbanColumnType } from '@/types';
import { GitBranch, CheckCircle2, Plus } from 'lucide-react';
import { announce } from '@/lib/accessibility';
import { useProjectStore } from '@/lib/store';
import { SpecWorkflowWizard } from './spec-workflow-wizard';

const COLUMNS: KanbanColumn[] = ['backlog', 'specify', 'clarify', 'plan', 'tasks', 'analyze'];

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
  { feature, onClick, isFocused },
  ref
) {
  const progressPercentage = feature.totalTasks > 0
    ? Math.round((feature.completedTasks / feature.totalTasks) * 100)
    : 0;

  const isComplete = progressPercentage === 100;
  const statusDotStyle = getStatusDotStyle(progressPercentage, feature.totalTasks > 0);
  const statusLabel = getStatusLabel(progressPercentage, feature.totalTasks > 0);

  // Extract spec number from featureId (e.g., "001" from "001-user-login")
  // Use featureId if available, fallback to id for backwards compatibility
  const specNumber = getSpecNumber(feature.featureId || feature.id);
  const checklistCount = getChecklistCount(feature);

  // Build accessible label
  const ariaLabel = [
    specNumber ? `${specNumber} ${feature.name}` : feature.name,
    feature.totalTasks > 0 ? `${feature.completedTasks} of ${feature.totalTasks} tasks complete` : null,
    checklistCount > 0 ? `${checklistCount} checklists` : null,
  ].filter(Boolean).join(', ');

  return (
    <button
      ref={ref}
      onClick={onClick}
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
        {/* Status indicator - dot or checkmark */}
        {isComplete ? (
          <CheckCircle2
            className="w-4 h-4 text-green-500 flex-shrink-0"
            aria-label="Complete"
          />
        ) : (
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={statusDotStyle}
            aria-label={statusLabel}
            title={statusLabel}
          />
        )}
      </div>

      {/* Compact task count and checklist - Jira style */}
      <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)]">
        <div className="flex items-center gap-3">
          <span className="tabular-nums">
            {feature.completedTasks}/{feature.totalTasks} tasks
          </span>
          {/* Checklist count */}
          {checklistCount > 0 && (
            <span className="tabular-nums text-[var(--color-active)]">
              {checklistCount} {checklistCount === 1 ? 'checklist' : 'checklists'}
            </span>
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
    backlog: 'New features',
    specify: 'Spec being generated',
    clarify: 'Clarifications in progress',
    plan: 'Implementation plan being created',
    tasks: 'Tasks being generated',
    analyze: 'Analyzing complete',
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
}

function KanbanColumnComponent({
  column,
  features,
  onFeatureClick,
  focusedFeatureId,
  setCardRef,
  onCreateFeature,
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
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] text-xs font-medium transition-colors"
            aria-label="Create new feature"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Feature
          </button>
        )}
      </div>

      {/* Column content */}
      <div
        className="flex-1 min-h-[200px]"
        role="list"
        aria-labelledby={`column-${column}-heading`}
        aria-label={`${columnLabel} features, ${features.length} items`}
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
  projectPath?: string;
  projectId?: string;
}

export function KanbanBoard({ features, onFeatureClick, projectPath, projectId }: KanbanBoardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { focusState, setFocusState, clearFocusState } = useProjectStore();
  const cardRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());
  const boardRef = useRef<HTMLElement>(null);

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
        {totalFeatures} total features: {featuresByColumn['backlog'].length} in backlog,
        {featuresByColumn['specify'].length} in specify, {featuresByColumn['clarify'].length} in clarify,
        {featuresByColumn['plan'].length} in plan, {featuresByColumn['tasks'].length} in tasks,
        {featuresByColumn['analyze'].length} in analyze
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
        />
      ))}
    </section>

    {projectId && (
      <SpecWorkflowWizard
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projectId={projectId}
        projectPath={projectPath}
        onFeatureCreated={(feature) => {
          console.log('Feature created:', feature);
          // Reload the page to fetch new data
          window.location.reload();
        }}
      />
    )}
    </>
  );
}
