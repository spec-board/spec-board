'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Loader2, FileText, AlertCircle, ArrowRight } from 'lucide-react';
import { BaseModal } from '../base/base-modal';
import type { BaseModalProps } from '../base/types';
import { ChecklistPanel } from '../checklist-panel';
import { DocumentPanel } from '../document-panel';
import { useProjectStore } from '@/lib/store';
import { toast } from 'sonner';
import { STAGES, getStageConfig } from '../base/types';

interface PlanModalProps extends BaseModalProps {
  onGeneratePlan?: () => Promise<void>;
  onRefresh?: () => void;
}

type PlanStatus = 'idle' | 'generating' | 'ready' | 'error';

export function PlanModal({ feature, onClose, onStageChange, onDelete, onGeneratePlan, onRefresh }: PlanModalProps) {
  const [status, setStatus] = useState<PlanStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<string>('plan');
  const contentRef = useRef<HTMLDivElement>(null);

  // Get project from store for API calls
  const project = useProjectStore(state => state.project);
  const projectId = project?.projectId;

  // Check state
  const hasPlan = !!feature.planContent;
  const hasSpec = !!feature.specContent;
  const hasChecklist = !!feature.checklistsContent;

  // Get next stage config
  const currentIndex = STAGES.findIndex(s => s.stage === feature.stage);
  const nextStage = STAGES[currentIndex + 1];
  const nextStageConfig = nextStage ? getStageConfig(nextStage.stage) : null;

  // Set initial status
  useEffect(() => {
    if (hasPlan) {
      setStatus('ready');
    } else if (hasSpec) {
      setStatus('idle');
    }
  }, [hasPlan, hasSpec]);

  // Handle saving checklist content
  const handleSaveChecklist = useCallback(async (content: string) => {
    if (!projectId) return;

    try {
      const response = await fetch(`/api/features/${feature.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklistsContent: content }),
      });

      if (!response.ok) {
        throw new Error('Failed to save checklist');
      }

      toast.success('Checklist saved');
      onRefresh?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save checklist');
    }
  }, [projectId, feature.id, onRefresh]);

  const handleGeneratePlan = async () => {
    if (!projectId) {
      setError('Project not found');
      setStatus('error');
      return;
    }

    if (!onGeneratePlan) {
      // Call Plan API (includes design generation - like /speckit.plan)
      try {
        setStatus('generating');
        setError(null);

        const response = await fetch('/api/spec-workflow/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            featureId: feature.id,
            name: feature.name,
            specContent: feature.specContent,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate plan');
        }

        setStatus('ready');
        toast.success('Plan and design artifacts generated');
        onRefresh?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate plan');
        setStatus('error');
      }
      return;
    }

    setStatus('generating');
    setError(null);

    try {
      await onGeneratePlan();
      setStatus('ready');
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate plan');
      setStatus('error');
    }
  };

  // Handle "Continue to Next Stage" button click
  const handleContinueToNextStage = () => {
    if (onStageChange && nextStageConfig) {
      onStageChange(nextStage.stage as any);
    }
  };

  // Handle document change
  const handleDocumentChange = useCallback((doc: string) => {
    setSelectedDocument(doc);
  }, []);

  return (
    <BaseModal
      feature={feature}
      onClose={onClose}
      onStageChange={onStageChange}
      onDelete={onDelete}
      headerActions={
        <div className="flex items-center gap-2">
          {hasPlan && nextStageConfig ? (
            <button
              onClick={handleContinueToNextStage}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors"
            >
              {nextStageConfig.label}
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : status !== 'generating' && (
            <button
              onClick={handleGeneratePlan}
              disabled={!hasSpec}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
            >
              <FileText className="w-4 h-4" />
              Generate Plan + Design
            </button>
          )}
        </div>
      }
      showNavigation={hasSpec}
    >
      <div className="flex h-full">
        {/* Left: Interactive Checklist Panel */}
        <div className="w-[40%] border-r border-[var(--border)] overflow-y-auto">
          {status === 'generating' ? (
            <div className="flex items-center justify-center h-full p-6">
              <div className="text-center">
                <Loader2 className="w-8 h-8 mx-auto mb-4 text-blue-500 animate-spin" />
                <p className="text-[var(--foreground)] font-medium mb-2">
                  Generating Plan + Design
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Creating plan, research, data model, quickstart, and contracts...
                </p>
              </div>
            </div>
          ) : status === 'error' ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 max-w-md">
                <div className="flex items-center gap-2 text-red-500 mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Generation Failed</span>
                </div>
                <p className="text-sm text-[var(--muted-foreground)] mb-4">
                  {error || 'An error occurred while generating the plan.'}
                </p>
                <button
                  onClick={handleGeneratePlan}
                  className="text-sm text-blue-500 hover:text-blue-400"
                >
                  Try again →
                </button>
              </div>
            </div>
          ) : !feature.checklistsContent ? (
            <div className="flex items-center justify-center h-full p-6">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-[var(--foreground)] font-medium mb-2">
                  Create Implementation Plan
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Click "Generate Plan" to create a technical implementation plan based on your spec and clarifications.
                </p>
              </div>
            </div>
          ) : (
            <ChecklistPanel
              feature={feature}
              checklistsContent={feature.checklistsContent}
              onSave={handleSaveChecklist}
            />
          )}
        </div>

        {/* Right: Document Panel with tabs */}
        <div className="w-[60%] overflow-hidden">
          <DocumentPanel
            feature={feature}
            selectedDocument={selectedDocument as any}
            onDocumentChange={handleDocumentChange as any}
            highlightTaskId={null}
            contentRef={contentRef}
          />
        </div>
      </div>
    </BaseModal>
  );
}
