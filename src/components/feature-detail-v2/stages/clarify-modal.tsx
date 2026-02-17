'use client';

import { useState, useCallback, useEffect } from 'react';
import { Loader2, HelpCircle, Save, Play, AlertCircle, CheckCircle } from 'lucide-react';
import { BaseModal } from '../base/base-modal';
import type { BaseModalProps } from '../base/types';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { ClarificationForm } from '../clarification-form';
import { toast } from 'sonner';
import { useProjectStore } from '@/lib/store';

interface ClarifyModalProps extends BaseModalProps {
  onGenerateQuestions?: () => Promise<void>;
  onRefresh?: () => Promise<void>;
}

type ClarifyStatus = 'idle' | 'generating' | 'ready' | 'error';

export function ClarifyModal({ feature, onClose, onStageChange, onGenerateQuestions, onRefresh }: ClarifyModalProps) {
  const [status, setStatus] = useState<ClarifyStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  // Get project from store for API calls
  const project = useProjectStore(state => state.project);
  const projectId = project?.projectId;

  // Check if clarifications already exist
  const hasClarifications = !!feature.clarificationsContent;
  const hasSpec = !!feature.specContent;

  // Set initial status based on existing content
  useEffect(() => {
    if (hasClarifications) {
      setStatus('ready');
    } else if (hasSpec) {
      setStatus('idle');
    }
  }, [hasClarifications, hasSpec]);

  const handleGenerateQuestions = async () => {
    if (!projectId) {
      setError('Project not found');
      setStatus('error');
      return;
    }

    if (!onGenerateQuestions) {
      // If no callback, call API directly
      try {
        setStatus('generating');
        setError(null);

        const response = await fetch('/api/spec-workflow/clarify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            featureId: feature.id,
            specContent: feature.specContent,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate clarification questions');
        }

        const data = await response.json();
        setStatus('ready');
        toast.success('Clarification questions generated');
        onRefresh?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate questions');
        setStatus('error');
      }
      return;
    }

    setStatus('generating');
    setError(null);

    try {
      await onGenerateQuestions();
      setStatus('ready');
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate questions');
      setStatus('error');
    }
  };

  const handleSaveSuccess = useCallback(() => {
    // Could trigger a refresh or notify parent
    toast.success('Clarifications saved');
    onRefresh?.();
  }, [onRefresh]);

  return (
    <BaseModal
      feature={feature}
      onClose={onClose}
      onStageChange={onStageChange}
      headerActions={
        <div className="flex items-center gap-2">
          {status !== 'generating' && (
            <button
              onClick={handleGenerateQuestions}
              disabled={!hasSpec}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              Generate Questions
            </button>
          )}
        </div>
      }
      showNavigation={hasSpec}
    >
      <div className="flex h-full">
        {/* Left: Spec Reference */}
        <div className="w-[40%] border-r border-[var(--border)] overflow-hidden flex flex-col">
          <div className="flex-shrink-0 px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
            <h3 className="font-medium text-sm text-[var(--foreground)]">
              Spec Reference
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {hasSpec ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <MarkdownRenderer content={feature.specContent || ''} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--muted-foreground)]">
                <p>No spec content available. Go back to Specify stage.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Clarification Form */}
        <div className="w-[60%] overflow-hidden flex flex-col">
          {status === 'generating' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 mx-auto mb-4 text-blue-500 animate-spin" />
                <p className="text-[var(--foreground)] font-medium mb-2">
                  Generating Clarification Questions
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Analyzing spec to identify areas needing clarification...
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
                  {error || 'An error occurred while generating clarification questions.'}
                </p>
                <button
                  onClick={handleGenerateQuestions}
                  className="text-sm text-blue-500 hover:text-blue-400"
                >
                  Try again →
                </button>
              </div>
            </div>
          )}

          {status === 'idle' && !hasClarifications && (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <HelpCircle className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-[var(--foreground)] font-medium mb-2">
                  Clarify Your Requirements
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Click "Generate Questions" to get clarification questions based on your spec, then answer them to ensure requirements are clear.
                </p>
              </div>
            </div>
          )}

          {(status === 'ready' || hasClarifications) && projectId && (
            <ClarificationForm
              content={feature.clarificationsContent || ''}
              featureId={feature.id}
              projectId={projectId}
              onSaved={handleSaveSuccess}
            />
          )}
        </div>
      </div>
    </BaseModal>
  );
}
