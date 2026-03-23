'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { ArrowRight, Loader2, BarChart3, AlertCircle, CheckCircle, AlertTriangle, FileText, List, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Feature, Task } from '@/types';
import type { BaseModalProps } from '../base/types';
import { BaseModal } from '../base/base-modal';
import { groupTasksByUserStory } from '../types';
import { UserStoryPanel } from '../user-story-panel';
import { DocumentPanel } from '../document-panel';
import { STAGES, getStageConfig } from '../base/types';
import { useProjectStore } from '@/lib/store';
import { toast } from 'sonner';

type TasksStatus = 'idle' | 'generating' | 'ready' | 'error';

export function TasksModal({ feature, onClose, onStageChange, onDelete }: BaseModalProps) {
  const [selectedDocument, setSelectedDocument] = useState<string>('tasks');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [highlightTaskId, setHighlightTaskId] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Analysis state
  const [analysisStatus, setAnalysisStatus] = useState<TasksStatus>('idle');
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Keyboard navigation state
  const [focusedPanel, setFocusedPanel] = useState<'left' | 'right'>('left');
  const [focusedCardIndex, setFocusedCardIndex] = useState<number>(0);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  // Get project from store
  const project = useProjectStore(state => state.project);
  const projectId = project?.projectId;

  // Check state
  const hasAnalysis = !!feature.analysisContent;
  const hasSpec = !!feature.specContent;
  const hasPlan = !!feature.planContent;
  const hasTasks = !!feature.tasksContent;
  const hasAllDocs = hasSpec && hasPlan && hasTasks;

  // Group tasks by user story
  const { orphans: orphanTasks } = useMemo(
    () => groupTasksByUserStory(feature.tasks, feature.userStories),
    [feature.tasks, feature.userStories]
  );

  const totalCards = feature.userStories.length + (orphanTasks.length > 0 ? 1 : 0);

  // Get next stage config (tasks is now the final stage, no next stage)
  const currentIndex = STAGES.findIndex(s => s.stage === feature.stage);
  const hasNextStage = currentIndex >= 0 && currentIndex < STAGES.length - 1;
  const nextStage = hasNextStage ? STAGES[currentIndex + 1] : undefined;
  const nextStageConfig = nextStage ? getStageConfig(nextStage.stage) : null;

  // Set initial analysis status
  useEffect(() => {
    if (hasAnalysis) {
      setAnalysisStatus('ready');
    } else if (hasAllDocs) {
      setAnalysisStatus('idle');
    }
  }, [hasAnalysis, hasAllDocs]);

  // Handle run analysis
  const handleRunAnalysis = async () => {
    if (!projectId) {
      setAnalysisError('Project not found');
      setAnalysisStatus('error');
      return;
    }

    try {
      setAnalysisStatus('generating');
      setAnalysisError(null);

      const response = await fetch('/api/spec-workflow/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          featureId: feature.id,
          specContent: feature.specContent,
          planContent: feature.planContent,
          tasksContent: feature.tasksContent,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate analysis');
      }

      setAnalysisStatus('ready');
      toast.success('Analysis complete');
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Failed to analyze');
      setAnalysisStatus('error');
    }
  };

  // Handle continue to next stage
  const handleContinueToNextStage = useCallback(() => {
    if (onStageChange && nextStageConfig && nextStage) {
      onStageChange(nextStage.stage as any);
    }
  }, [onStageChange, nextStageConfig, nextStage]);

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
      onDelete={onDelete}
      headerActions={
        hasAnalysis ? (
          <div className="text-sm text-[var(--foreground)] font-medium">
            Analysis Complete
          </div>
        ) : analysisStatus !== 'generating' ? (
          <button
            onClick={handleRunAnalysis}
            disabled={!hasAllDocs}
            className="btn btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Run Analysis
          </button>
        ) : null
      }
    >
      <div className="flex h-full">
        {/* Left panel - User Stories & Tasks (40%) */}
        <div
          ref={leftPanelRef}
          tabIndex={0}
          className={cn(
            "w-[40%] border-r border-[var(--border)] overflow-hidden outline-none",
            focusedPanel === 'left' && 'ring-2 ring-inset ring-[var(--ring)]'
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
            focusedPanel === 'right' && 'ring-2 ring-inset ring-[var(--ring)]'
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
