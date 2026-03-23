'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Loader2, HelpCircle, Save, Play, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { BaseModal } from '../base/base-modal';
import type { BaseModalProps } from '../base/types';
import type { DocumentType } from '../types';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { ClarificationForm } from '../clarification-form';
import { DocumentSelector } from '../document-selector';
import { getDocumentOptions } from '../types';
import { toast } from 'sonner';
import { useProjectStore } from '@/lib/store';
import { STAGES, getStageConfig } from '../base/types';

interface ClarifyModalProps extends BaseModalProps {
  onGenerateQuestions?: () => Promise<void>;
  onRefresh?: () => Promise<void>;
}

type ClarifyStatus = 'idle' | 'generating' | 'ready' | 'error';

export function ClarifyModal({ feature, onClose, onStageChange, onDelete, onGenerateQuestions, onRefresh }: ClarifyModalProps) {
  const [status, setStatus] = useState<ClarifyStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocumentType>('clarifications');
  const [allAnswered, setAllAnswered] = useState(false);

  // Get project from store for API calls (projectId is optional - clarify API mainly uses featureId)
  const project = useProjectStore(state => state.project);
  // Use projectId if available, otherwise will use featureId for API calls
  const projectId = project?.projectId;

  // Check if clarifications already exist
  const hasClarifications = !!feature.clarificationsContent;
  const hasSpec = !!feature.specContent;

  // Determine if form should be editable
  // Allow editing as long as feature is still in specs stage (merged from clarify)
  const isEditable = feature.stage === 'specs';

  // Handle all answered state change from ClarificationForm
  const handleAllAnsweredChange = useCallback((answered: boolean) => {
    setAllAnswered(answered);
  }, []);

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

  // Set initial status based on existing content
  useEffect(() => {
    if (hasClarifications) {
      setStatus('ready');
    } else if (hasSpec) {
      setStatus('idle');
    }
  }, [hasClarifications, hasSpec]);

  const handleGenerateQuestions = async () => {
    // Note: projectId is optional - clarify API mainly uses featureId
    // The API doesn't actually require projectId

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
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to generate clarification questions');
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
        status !== 'generating' && (
          <button
            onClick={handleGenerateQuestions}
            disabled={!hasSpec}
            className="btn btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate Questions
          </button>
        )
      }
      showNavigation={hasSpec}
    >
      <div className="flex h-full">
        {/* Left: Interactive Panel - Clarification Form */}
        <div className="w-[40%] border-r border-[var(--border)] p-6 overflow-y-auto">
          {status === 'generating' && (
            <div className="flex items-center justify-center h-full">
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
            <div className="flex items-center justify-center p-4">
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
            <div className="flex items-center justify-center h-full">
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

          {(status === 'ready' || hasClarifications) && (
            <ClarificationForm
              content={feature.clarificationsContent || ''}
              featureId={feature.id}
              projectId={projectId || ''}
              onSaved={handleSaveSuccess}
              readOnly={!isEditable}
              onAllAnsweredChange={handleAllAnsweredChange}
            />
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
