'use client';

import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BaseModalProps, StageConfig } from './types';
import { getStageConfig, STAGES } from './types';

interface BaseModalComponentProps extends BaseModalProps {
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  footerActions?: React.ReactNode;
  showNavigation?: boolean;
}

// Stage badge component
function StageBadge({ stage }: { stage: string }) {
  const colors: Record<string, string> = {
    specify: 'bg-blue-500/20 text-blue-400',
    clarify: 'bg-purple-500/20 text-purple-400',
    plan: 'bg-orange-500/20 text-orange-400',
    checklist: 'bg-green-500/20 text-green-400',
    tasks: 'bg-yellow-500/20 text-yellow-400',
    analyze: 'bg-cyan-500/20 text-cyan-400',
  };

  const config = getStageConfig(stage as any);

  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
      colors[stage] || 'bg-gray-500/20 text-gray-400'
    )}>
      {config.label}
    </span>
  );
}

// Stage progress indicator
function StageProgress({ currentStage }: { currentStage: string }) {
  const currentIndex = STAGES.findIndex(s => s.stage === currentStage);

  return (
    <div className="flex items-center gap-1">
      {STAGES.map((stage, index) => (
        <div key={stage.stage} className="flex items-center">
          <div
            className={cn(
              'w-2 h-2 rounded-full transition-colors',
              index < currentIndex ? 'bg-green-500' :
              index === currentIndex ? 'bg-blue-500' :
              'bg-gray-600'
            )}
            title={stage.label}
          />
          {index < STAGES.length - 1 && (
            <div className={cn(
              'w-4 h-0.5',
              index < currentIndex ? 'bg-green-500' : 'bg-gray-600'
            )} />
          )}
        </div>
      ))}
    </div>
  );
}

export function BaseModal({
  feature,
  onClose,
  onStageChange,
  children,
  headerActions,
  footerActions,
  showNavigation = false,
}: BaseModalComponentProps) {
  const currentIndex = STAGES.findIndex(s => s.stage === feature.stage);
  const config = getStageConfig(feature.stage);

  const handlePrev = () => {
    if (currentIndex > 0 && onStageChange) {
      onStageChange(STAGES[currentIndex - 1].stage);
    }
  };

  const handleNext = () => {
    if (currentIndex < STAGES.length - 1 && onStageChange) {
      onStageChange(STAGES[currentIndex + 1].stage);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div
        className="w-[1400px] h-[900px] bg-[var(--card)] rounded-lg shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feature-modal-title"
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1
                  id="feature-modal-title"
                  className="text-xl font-semibold text-[var(--foreground)]"
                >
                  {feature.name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <StageBadge stage={feature.stage} />
                  {feature.featureId && (
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {feature.featureId}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Stage progress */}
              <StageProgress currentStage={feature.stage} />

              {/* Header actions */}
              {headerActions}

              {/* Close button */}
              <button
                onClick={onClose}
                className="p-2 rounded-md hover:bg-[var(--muted)] transition-colors text-[var(--muted-foreground)]"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>

        {/* Footer */}
        {(footerActions || showNavigation) && (
          <div className="flex-shrink-0 px-6 py-3 border-t border-[var(--border)] flex items-center justify-between">
            <div>
              {/* Previous button */}
              {showNavigation && currentIndex > 0 && (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {STAGES[currentIndex - 1].label}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {footerActions}
            </div>

            <div>
              {/* Next button */}
              {showNavigation && currentIndex < STAGES.length - 1 && (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  {STAGES[currentIndex + 1].label}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Re-export types
export type { BaseModalProps } from './types';
