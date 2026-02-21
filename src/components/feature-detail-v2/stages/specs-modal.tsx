'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Loader2, HelpCircle, Play, AlertCircle, ArrowRight } from 'lucide-react';
import { BaseModal } from '../base/base-modal';
import type { BaseModalProps } from '../base/types';
import type { DocumentType } from '../types';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { ClarificationForm } from '../clarification-form';
import { DocumentSelector } from '../document-selector';
import { getDocumentOptions } from '../types';
import { STAGES, getStageConfig } from '../base/types';
import { toast } from 'sonner';
import { useProjectStore } from '@/lib/store';

interface SpecsModalProps extends BaseModalProps {
  onGenerateSpec?: () => Promise<void>;
  onGenerateQuestions?: () => Promise<void>;
  onRefresh?: () => Promise<void>;
}

type SpecsStatus = 'idle' | 'generating_spec' | 'generating_questions' | 'ready' | 'error';

export function SpecsModal({
  feature,
  onClose,
  onStageChange,
  onDelete,
  onGenerateSpec,
  onGenerateQuestions,
  onRefresh
}: SpecsModalProps) {
  const [specStatus, setSpecStatus] = useState<SpecsStatus>('idle');
  const [questionStatus, setQuestionStatus] = useState<SpecsStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocumentType>('spec');
  const [allAnswered, setAllAnswered] = useState(false);

  const project = useProjectStore(state => state.project);
  const projectId = project?.projectId;

  const hasSpec = !!feature.specContent;
  const hasClarifications = !!feature.clarificationsContent;
  const isEditable = feature.stage === 'specs';

  // Set initial status based on existing content
  useEffect(() => {
    if (hasSpec) setSpecStatus('ready');
    if (hasClarifications) setQuestionStatus('ready');
  }, [hasSpec, hasClarifications]);

  const handleAllAnsweredChange = useCallback((answered: boolean) => {
    setAllAnswered(answered);
  }, []);

  const currentIndex = STAGES.findIndex(s => s.stage === feature.stage);
  const nextStage = STAGES[currentIndex + 1];
  const nextStageConfig = nextStage ? getStageConfig(nextStage.stage) : null;

  const documentOptions = useMemo(() => getDocumentOptions(feature), [feature]);

  const selectedDocContent = useMemo(() => {
    const option = documentOptions.find(o => o.type === selectedDoc);
    return option?.content || null;
  }, [documentOptions, selectedDoc]);

  const handleGenerateSpec = async () => {
    if (!onGenerateSpec) {
      try {
        setSpecStatus('generating_spec');
        setError(null);

        const response = await fetch('/api/spec-workflow/specify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            featureId: feature.id,
            name: feature.name,
            description: feature.description,
          }),
        });

        if (!response.ok) throw new Error('Failed to generate spec');

        setSpecStatus('ready');
        toast.success('Spec generated');
        onRefresh?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate spec');
        setSpecStatus('error');
      }
      return;
    }

    setSpecStatus('generating_spec');
    try {
      await onGenerateSpec();
      setSpecStatus('ready');
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate spec');
      setSpecStatus('error');
    }
  };

  const handleGenerateQuestions = async () => {
    if (!onGenerateQuestions) {
      try {
        setQuestionStatus('generating_questions');
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

        if (!response.ok) throw new Error('Failed to generate questions');

        setQuestionStatus('ready');
        toast.success('Questions generated');
        onRefresh?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate questions');
        setQuestionStatus('error');
      }
      return;
    }

    setQuestionStatus('generating_questions');
    try {
      await onGenerateQuestions();
      setQuestionStatus('ready');
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate questions');
      setQuestionStatus('error');
    }
  };

  const handleSaveSuccess = useCallback(() => {
    toast.success('Clarifications saved');
    onRefresh?.();
  }, [onRefresh]);

  const handleContinueToNextStage = () => {
    if (onStageChange && nextStageConfig) {
      onStageChange(nextStageConfig.stage as any);
    }
  };

  const isGenerating = specStatus === 'generating_spec' || questionStatus === 'generating_questions';

  return (
    <BaseModal
      feature={feature}
      onClose={onClose}
      onStageChange={onStageChange}
      onDelete={onDelete}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateSpec}
            disabled={isGenerating}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-md font-medium text-sm transition-colors"
          >
            {specStatus === 'generating_spec' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Generate Spec
          </button>
          <button
            onClick={handleGenerateQuestions}
            disabled={isGenerating || !hasSpec}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white rounded-md font-medium text-sm transition-colors"
            title={!hasSpec ? 'Generate spec first' : undefined}
          >
            {questionStatus === 'generating_questions' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <HelpCircle className="w-4 h-4" />
            )}
            Generate Questions
          </button>
          {hasSpec && nextStageConfig && (
            <button
              onClick={handleContinueToNextStage}
              disabled={!allAnswered}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
              title={!allAnswered ? 'Please answer all questions before continuing' : undefined}
            >
              {nextStageConfig.label}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      }
      showNavigation={hasSpec}
    >
      <div className="flex h-full">
        {/* Left: Interactive Q&A Panel */}
        <div className="w-[40%] border-r border-[var(--border)] p-6 overflow-y-auto">
          {isGenerating && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 mx-auto mb-4 text-blue-500 animate-spin" />
                <p className="text-[var(--foreground)] font-medium mb-2">
                  {specStatus === 'generating_spec' ? 'Generating Spec...' : 'Generating Questions...'}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center p-4">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 max-w-md">
                <div className="flex items-center gap-2 text-red-500 mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Generation Failed</span>
                </div>
                <p className="text-sm text-[var(--muted-foreground)] mb-4">{error}</p>
              </div>
            </div>
          )}

          {!isGenerating && !error && (
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

        {/* Right: Document Viewer */}
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
                <p>No content available. Click "Generate Spec" to start.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
