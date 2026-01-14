'use client';

/**
 * Resolution Options Component (T069)
 * Provides options for resolving sync conflicts: keep local, keep cloud, or manual merge
 */

import {
  ArrowLeft,
  ArrowRight,
  GitMerge,
  Wand2,
  Loader2,
  Check,
} from 'lucide-react';

interface ResolutionOptionsProps {
  onSelectLocal: () => void;
  onSelectCloud: () => void;
  onSelectMerge: () => void;
  onTryAutoMerge?: () => void;
  isResolving?: boolean;
  isCheckingAutoMerge?: boolean;
  autoMergeAvailable?: boolean;
}

export function ResolutionOptions({
  onSelectLocal,
  onSelectCloud,
  onSelectMerge,
  onTryAutoMerge,
  isResolving = false,
  isCheckingAutoMerge = false,
  autoMergeAvailable,
}: ResolutionOptionsProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {/* Auto-merge suggestion */}
      {onTryAutoMerge && autoMergeAvailable === undefined && (
        <button
          onClick={onTryAutoMerge}
          disabled={isCheckingAutoMerge || isResolving}
          className="w-full flex items-center justify-center gap-2 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 disabled:opacity-50 focus-ring"
          style={{ padding: 'var(--space-1-5)', borderRadius: 'var(--radius)', transition: 'var(--transition-base)' }}
        >
          {isCheckingAutoMerge ? (
            <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
          ) : (
            <Wand2 className="w-4 h-4 text-purple-500" />
          )}
          <span className="font-medium text-purple-600 dark:text-purple-400" style={{ fontSize: 'var(--text-sm)' }}>
            {isCheckingAutoMerge ? 'Checking auto-merge...' : 'Try Auto-Merge'}
          </span>
        </button>
      )}

      {autoMergeAvailable === true && (
        <div
          className="flex items-center gap-2 bg-green-500/10 border border-green-500/20"
          style={{ padding: '8px 12px', borderRadius: 'var(--radius)' }}
        >
          <Check className="w-4 h-4 text-green-500" />
          <span className="text-green-600 dark:text-green-400" style={{ fontSize: 'var(--text-sm)' }}>
            Auto-merge available! Click "Manual Merge" to review and apply.
          </span>
        </div>
      )}

      {autoMergeAvailable === false && (
        <div
          className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20"
          style={{ padding: '8px 12px', borderRadius: 'var(--radius)' }}
        >
          <Wand2 className="w-4 h-4 text-yellow-500" />
          <span className="text-yellow-600 dark:text-yellow-400" style={{ fontSize: 'var(--text-sm)' }}>
            Auto-merge not possible. Please choose a resolution manually.
          </span>
        </div>
      )}

      {/* Resolution buttons */}
      <div className="grid grid-cols-3" style={{ gap: 'var(--space-1-5)' }}>
        {/* Keep Local */}
        <button
          onClick={onSelectLocal}
          disabled={isResolving}
          className="flex flex-col items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 disabled:opacity-50 group focus-ring"
          style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius)', transition: 'var(--transition-base)' }}
        >
          <div
            className="p-2 bg-blue-500/20 rounded-full group-hover:bg-blue-500/30"
            style={{ transition: 'var(--transition-base)' }}
          >
            <ArrowLeft className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-center">
            <p className="font-medium text-blue-600 dark:text-blue-400" style={{ fontSize: 'var(--text-sm)' }}>
              Keep Local
            </p>
            <p className="text-[var(--muted-foreground)] mt-1" style={{ fontSize: 'var(--text-xs)' }}>
              Use your changes
            </p>
          </div>
        </button>

        {/* Manual Merge */}
        <button
          onClick={onSelectMerge}
          disabled={isResolving}
          className="flex flex-col items-center gap-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 disabled:opacity-50 group focus-ring"
          style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius)', transition: 'var(--transition-base)' }}
        >
          <div
            className="p-2 bg-green-500/20 rounded-full group-hover:bg-green-500/30"
            style={{ transition: 'var(--transition-base)' }}
          >
            <GitMerge className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-center">
            <p className="font-medium text-green-600 dark:text-green-400" style={{ fontSize: 'var(--text-sm)' }}>
              Manual Merge
            </p>
            <p className="text-[var(--muted-foreground)] mt-1" style={{ fontSize: 'var(--text-xs)' }}>
              Combine both versions
            </p>
          </div>
        </button>

        {/* Keep Cloud */}
        <button
          onClick={onSelectCloud}
          disabled={isResolving}
          className="flex flex-col items-center gap-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 disabled:opacity-50 group focus-ring"
          style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius)', transition: 'var(--transition-base)' }}
        >
          <div
            className="p-2 bg-purple-500/20 rounded-full group-hover:bg-purple-500/30"
            style={{ transition: 'var(--transition-base)' }}
          >
            <ArrowRight className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-center">
            <p className="font-medium text-purple-600 dark:text-purple-400" style={{ fontSize: 'var(--text-sm)' }}>
              Keep Cloud
            </p>
            <p className="text-[var(--muted-foreground)] mt-1" style={{ fontSize: 'var(--text-xs)' }}>
              Use cloud version
            </p>
          </div>
        </button>
      </div>

      {/* Loading indicator */}
      {isResolving && (
        <div className="flex items-center justify-center gap-2 py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-[var(--muted-foreground)]" style={{ fontSize: 'var(--text-sm)' }}>
            Resolving conflict...
          </span>
        </div>
      )}

      {/* Help text */}
      <p className="text-center text-[var(--muted-foreground)]" style={{ fontSize: 'var(--text-xs)' }}>
        Choose how to resolve this conflict. Your choice will be synced to all team members.
      </p>
    </div>
  );
}
