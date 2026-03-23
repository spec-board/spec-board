'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2, Play, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { BaseModal } from '../base/base-modal';
import type { BaseModalProps } from '../base/types';
import type { DocumentType } from '../types';
import { MarkdownRenderer, InlineMarkdown } from '@/components/markdown-renderer';
import { DocumentSelector } from '../document-selector';
import { getDocumentOptions } from '../types';
import { STAGES, getStageConfig } from '../base/types';

interface SpecifyModalProps extends BaseModalProps {
  onGenerate?: () => Promise<void>;
}

type SpecifyStatus = 'idle' | 'generating' | 'complete' | 'error';

export function SpecifyModal({ feature, onClose, onStageChange, onDelete, onGenerate }: SpecifyModalProps) {
  const [status, setStatus] = useState<SpecifyStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocumentType>('spec');

  // Check if feature already has spec content
  const hasSpec = !!feature.specContent;

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

  const handleGenerate = async () => {
    if (!onGenerate) return;

    setStatus('generating');
    setProgress(0);
    setError(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(p => Math.min(p + 10, 90));
    }, 500);

    try {
      await onGenerate();
      setProgress(100);
      setStatus('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate spec');
      setStatus('error');
    } finally {
      clearInterval(progressInterval);
    }
  };

  // Progress steps
  const steps = [
    { label: 'Analyzing requirements', progress: 20 },
    { label: 'Generating user stories', progress: 40 },
    { label: 'Writing functional requirements', progress: 60 },
    { label: 'Defining success criteria', progress: 80 },
    { label: 'Finalizing spec', progress: 100 },
  ];

  const currentStep = steps.find(s => s.progress >= progress) || steps[steps.length - 1];

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
        <button
          onClick={handleGenerate}
          disabled={status === 'generating'}
          className="btn btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'generating' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Spec'
          )}
        </button>
      }
      showNavigation={hasSpec}
    >
      <div className="flex h-full">
        {/* Left: Feature Description + Progress Panel */}
        <div className="w-[40%] border-r border-[var(--border)] p-6 overflow-y-auto">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
            Feature Details
          </h3>

          {/* Feature Description - always visible */}
          <div className="mb-6 p-4 bg-[var(--muted)]/30 rounded-lg">
            <h4 className="text-sm font-medium text-[var(--muted-foreground)] mb-2">
              Description
            </h4>
            <InlineMarkdown content={feature.description || feature.name} as="p" className="text-[var(--foreground)]" />
          </div>

          {status === 'idle' && !hasSpec && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--secondary)] flex items-center justify-center">
                <Play className="w-8 h-8 text-[var(--muted-foreground)]" />
              </div>
              <p className="text-[var(--foreground)] mb-2 font-medium">
                Ready to Generate
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                Click "Generate Spec" to create a specification based on the description above.
              </p>
            </div>
          )}

          {status === 'generating' && (
            <div className="space-y-6">
              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[var(--muted-foreground)]">Progress</span>
                  <span className="text-[var(--foreground)]">{progress}%</span>
                </div>
                <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--foreground)] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Current step */}
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-[var(--foreground)] animate-spin" />
                <div>
                  <p className="text-[var(--foreground)] font-medium">{currentStep.label}</p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Step {steps.indexOf(currentStep) + 1} of {steps.length}
                  </p>
                </div>
              </div>

              {/* All steps */}
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div
                    key={step.label}
                    className="flex items-center gap-2 text-sm"
                  >
                    {progress > step.progress ? (
                      <CheckCircle className="w-4 h-4 text-[var(--foreground)]" />
                    ) : progress === step.progress ? (
                      <Loader2 className="w-4 h-4 text-[var(--foreground)] animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-[var(--border)]" />
                    )}
                    <span className={
                      progress >= step.progress
                        ? 'text-[var(--foreground)]'
                        : 'text-[var(--muted-foreground)]'
                    }>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-[var(--destructive)] mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Generation Failed</span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                {error || 'An error occurred while generating the spec.'}
              </p>
              <button
                onClick={handleGenerate}
                className="text-sm text-[var(--foreground)] underline hover:opacity-70"
              >
                Try again →
              </button>
            </div>
          )}

          {status === 'complete' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--secondary)] flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-[var(--foreground)]" />
              </div>
              <p className="text-[var(--foreground)] font-medium mb-2">
                Spec Generated Successfully!
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                You can now proceed to the Clarify stage.
              </p>
            </div>
          )}

          {hasSpec && status === 'idle' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--secondary)] flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-[var(--foreground)]" />
              </div>
              <p className="text-[var(--foreground)] font-medium mb-2">
                Spec Already Exists
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                Click "Next" to continue to Clarify stage.
              </p>
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
          <div className="flex-1 overflow-y-auto p-6">
            {selectedDocContent ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <MarkdownRenderer content={selectedDocContent} />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-[var(--muted-foreground)]">
                <p>No content available for this document.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
