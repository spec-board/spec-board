'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Loader2, FileText, AlertCircle, ArrowRight } from 'lucide-react';
import { BaseModal } from '../base/base-modal';
import type { BaseModalProps } from '../base/types';
import type { DocumentType } from '../types';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { DocumentSelector } from '../document-selector';
import { getDocumentOptions } from '../types';
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
  const [selectedDoc, setSelectedDoc] = useState<DocumentType>('plan');

  // Get project from store for API calls
  const project = useProjectStore(state => state.project);
  const projectId = project?.projectId;

  // Check state
  const hasPlan = !!feature.planContent;
  const hasSpec = !!feature.specContent;
  const hasClarifications = !!feature.clarificationsContent;

  // Get next stage config
  const currentIndex = STAGES.findIndex(s => s.stage === feature.stage);
  const nextStage = STAGES[currentIndex + 1];
  const nextStageConfig = nextStage ? getStageConfig(nextStage.stage) : null;

  // Get available document options
  const documentOptions = useMemo(() => getDocumentOptions(feature), [feature]);

  // Get content for selected document
  const selectedDocContent = useMemo(() => {
    const option = documentOptions.find(o => o.type === selectedDoc);
    return option?.content || null;
  }, [documentOptions, selectedDoc]);

  // Set initial status
  useEffect(() => {
    if (hasPlan) {
      setStatus('ready');
    } else if (hasSpec) {
      setStatus('idle');
    }
  }, [hasPlan, hasSpec]);

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
        {/* Left: Interactive Panel - Generation UI & Plan Content */}
        <div className="w-[40%] border-r border-[var(--border)] p-6 overflow-y-auto">
          {status === 'generating' && (
            <div className="flex items-center justify-center h-full">
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
          )}

          {status === 'error' && (
            <div className="flex-1 flex items-center justify-center p-4">
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
          )}

          {status === 'idle' && !hasPlan && (
            <div className="flex items-center justify-center h-full">
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
          )}

          {(status === 'ready' || hasPlan) && (
            <div className="h-full">
              {feature.planContent ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <MarkdownRenderer content={feature.planContent} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-[var(--muted-foreground)]">
                  <p>No plan content available.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Document Viewer with Selector */}
        <div className="w-[60%] overflow-hidden flex flex-col">
          <div className="flex-shrink-0 px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
            <DocumentSelector
              options={documentOptions}
              selected={selectedDoc}
              onChange={setSelectedDoc}
            />
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {selectedDocContent ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <MarkdownRenderer content={selectedDocContent} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--muted-foreground)]">
                <p>No content available for this document.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
