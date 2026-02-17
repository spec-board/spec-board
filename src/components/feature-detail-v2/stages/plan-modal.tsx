'use client';

import { useState, useCallback, useEffect } from 'react';
import { Loader2, FileText, AlertCircle } from 'lucide-react';
import { BaseModal } from '../base/base-modal';
import type { BaseModalProps } from '../base/types';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { useProjectStore } from '@/lib/store';
import { toast } from 'sonner';

interface PlanModalProps extends BaseModalProps {
  onGeneratePlan?: () => Promise<void>;
}

type PlanStatus = 'idle' | 'generating' | 'ready' | 'error';

export function PlanModal({ feature, onClose, onStageChange, onGeneratePlan }: PlanModalProps) {
  const [status, setStatus] = useState<PlanStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  // Get project from store for API calls
  const project = useProjectStore(state => state.project);
  const projectId = project?.projectId;

  // Check state
  const hasPlan = !!feature.planContent;
  const hasSpec = !!feature.specContent;
  const hasClarifications = !!feature.clarificationsContent;

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
      // Call API directly
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

        const data = await response.json();
        setStatus('ready');
        toast.success('Implementation plan generated');
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate plan');
      setStatus('error');
    }
  };

  // Combine spec and clarifications for reference
  const referenceContent = [
    feature.specContent,
    feature.clarificationsContent ? `\n\n---\n\n## Clarifications\n\n${feature.clarificationsContent}` : null
  ].filter(Boolean).join('\n\n');

  return (
    <BaseModal
      feature={feature}
      onClose={onClose}
      onStageChange={onStageChange}
      headerActions={
        <div className="flex items-center gap-2">
          {status !== 'generating' && (
            <button
              onClick={handleGeneratePlan}
              disabled={!hasSpec}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
            >
              <FileText className="w-4 h-4" />
              Generate Plan
            </button>
          )}
        </div>
      }
      showNavigation={hasSpec}
    >
      <div className="flex h-full">
        {/* Left: Spec + Clarifications Reference */}
        <div className="w-[40%] border-r border-[var(--border)] overflow-hidden flex flex-col">
          <div className="flex-shrink-0 px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
            <h3 className="font-medium text-sm text-[var(--foreground)]">
              Spec & Clarifications
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {hasSpec ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <MarkdownRenderer content={referenceContent} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--muted-foreground)]">
                <p>No spec content available. Go back to Specify stage.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Plan Content */}
        <div className="w-[60%] overflow-hidden flex flex-col">
          {status === 'generating' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 mx-auto mb-4 text-blue-500 animate-spin" />
                <p className="text-[var(--foreground)] font-medium mb-2">
                  Generating Implementation Plan
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Analyzing spec and clarifications to create technical plan...
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
            <div className="flex-1 flex items-center justify-center p-4">
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
            <div className="flex-1 overflow-y-auto p-4">
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
      </div>
    </BaseModal>
  );
}
