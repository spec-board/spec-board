'use client';

import { useState, useEffect } from 'react';
import { Loader2, Play, AlertCircle, CheckCircle } from 'lucide-react';
import { BaseModal } from '../base/base-modal';
import type { BaseModalProps } from '../base/types';
import { MarkdownRenderer } from '@/components/markdown-renderer';

interface SpecifyModalProps extends BaseModalProps {
  onGenerate?: () => Promise<void>;
}

type SpecifyStatus = 'idle' | 'generating' | 'complete' | 'error';

export function SpecifyModal({ feature, onClose, onStageChange, onGenerate }: SpecifyModalProps) {
  const [status, setStatus] = useState<SpecifyStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Check if feature already has spec content
  const hasSpec = !!feature.specContent;

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

  return (
    <BaseModal
      feature={feature}
      onClose={onClose}
      onStageChange={onStageChange}
      headerActions={
        <button
          onClick={handleGenerate}
          disabled={status === 'generating'}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-md font-medium transition-colors"
        >
          {status === 'generating' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Generate Spec
            </>
          )}
        </button>
      }
      showNavigation={hasSpec}
    >
      <div className="flex h-full">
        {/* Left: Progress Panel */}
        <div className="w-[40%] border-r border-[var(--border)] p-6 overflow-y-auto">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
            Spec Generation
          </h3>

          {status === 'idle' && !hasSpec && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Play className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-[var(--muted-foreground)] mb-4">
                Click "Generate Spec" to create a specification based on the feature description.
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                Feature: {feature.description || feature.name}
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
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Current step */}
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
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
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : progress === step.progress ? (
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
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
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-500 mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Generation Failed</span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                {error || 'An error occurred while generating the spec.'}
              </p>
              <button
                onClick={handleGenerate}
                className="text-sm text-blue-500 hover:text-blue-400"
              >
                Try again →
              </button>
            </div>
          )}

          {status === 'complete' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
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
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
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

        {/* Right: Spec Preview */}
        <div className="w-[60%] overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              Spec Preview
            </h3>
            {!feature.specContent && (
              <span className="text-sm text-[var(--muted-foreground)]">
                Generated spec will appear here
              </span>
            )}
          </div>

          {feature.specContent ? (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <MarkdownRenderer content={feature.specContent} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-[var(--muted-foreground)]">
              <p>No spec content yet. Click "Generate Spec" to create one.</p>
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
}
