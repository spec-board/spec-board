'use client';

import { ArrowLeft, Columns2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HeaderBarProps } from './types';

export function HeaderBar({
  featureName,
  featureId,
  onClose,
  onToggleSplit,
  isSplitActive,
}: HeaderBarProps) {
  return (
    <div className="flex items-center justify-between h-14 px-4 border-b border-[var(--border)] bg-[var(--card)] flex-shrink-0">
      {/* Left: Back button + Feature name */}
      <div className="flex items-center gap-3">
        <button
          onClick={onClose}
          className="p-2 -ml-2 hover:bg-[var(--secondary)] rounded-lg transition-colors focus-ring"
          aria-label="Back to project"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <h1 id="modal-title" className="text-lg font-semibold capitalize truncate max-w-[400px]">
            {featureName}
          </h1>
          <span className="text-xs text-[var(--muted-foreground)] font-mono">
            {featureId}
          </span>
        </div>
      </div>

      {/* Right: Action buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleSplit}
          className={cn(
            'p-2 rounded-lg transition-colors focus-ring',
            isSplitActive
              ? 'bg-blue-500/20 hover:bg-blue-500/30'
              : 'hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          )}
          style={isSplitActive ? { color: 'var(--tag-text-info)' } : undefined}
          aria-label={isSplitActive ? 'Close split view' : 'Open split view'}
          aria-pressed={isSplitActive}
        >
          <Columns2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
