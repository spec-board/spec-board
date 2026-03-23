'use client';

import { ArrowLeft, Columns2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HeaderBarProps } from './types';

export function HeaderBar({
  featureName,
  featureId,
  onClose,
  onToggleSplit,
  isSplitActive,
  onDelete,
}: HeaderBarProps) {
  return (
    <div 
      className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--card)] flex-shrink-0"
      style={{
        height: 'calc(var(--space-12) + var(--space-2))', // 56px (14 * 4)
        paddingLeft: 'var(--space-4)',
        paddingRight: 'var(--space-4)',
      }}
    >
      {/* Left: Back button + Feature name */}
      <div 
        className="flex items-center"
        style={{ gap: 'var(--space-3)' }}
      >
        <button
          onClick={onClose}
          className="btn-icon"
          style={{ marginLeft: 'calc(var(--space-2) * -1)' }}
          aria-label="Back to project"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div 
          className="flex items-center"
          style={{ gap: 'var(--space-2)' }}
        >
          <h1 
            id="modal-title" 
            className="font-semibold capitalize truncate max-w-[400px]"
            style={{ fontSize: 'var(--text-lg)' }}
          >
            {featureName}
          </h1>
          <span 
            className="font-mono text-[var(--muted-foreground)]"
            style={{ fontSize: 'var(--text-xs)' }}
          >
            {featureId}
          </span>
        </div>
      </div>

      {/* Right: Action buttons */}
      <div
        className="flex items-center"
        style={{ gap: 'var(--space-1)' }}
      >
        {onDelete && (
          <button
            onClick={onDelete}
            className="btn-icon"
            aria-label="Delete feature"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={onToggleSplit}
          className={cn(
            'btn-icon',
            isSplitActive && 'bg-[var(--accent)] text-[var(--foreground)]'
          )}
          aria-label={isSplitActive ? 'Close split view' : 'Open split view'}
          aria-pressed={isSplitActive}
        >
          <Columns2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
