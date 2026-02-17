'use client';

import { X, Trash2 } from 'lucide-react';
import { useCallback } from 'react';
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
    backlog: 'bg-gray-500/20 text-gray-400',
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
  onDelete,
  children,
  headerActions,
  footerActions,
  showNavigation = false,
}: BaseModalComponentProps) {
  const config = getStageConfig(feature.stage);

  // Handle click outside to close modal
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div
        className="w-[1600px] h-[900px] bg-[var(--card)] rounded-lg shadow-2xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feature-modal-title"
        onClick={(e) => e.stopPropagation()}
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
        {(footerActions || onDelete) && (
          <div className="flex-shrink-0 px-6 py-3 border-t border-[var(--border)] flex items-center justify-between">
            <div>
              {footerActions}
            </div>

            <div className="flex items-center gap-2">
              {/* Delete button */}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Feature
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
