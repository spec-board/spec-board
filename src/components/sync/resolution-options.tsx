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
    <div className="space-y-4">
      {/* Auto-merge suggestion */}
      {onTryAutoMerge && autoMergeAvailable === undefined && (
        <button
          onClick={onTryAutoMerge}
          disabled={isCheckingAutoMerge || isResolving}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--accent)] hover:bg-[var(--secondary)] border border-[var(--border)] disabled:opacity-50 rounded-lg transition-colors"
        >
          {isCheckingAutoMerge && (
            <Loader2 className="w-4 h-4 animate-spin text-[var(--foreground)]" />
          )}
          <span className="text-sm font-medium text-[var(--foreground)]">
            {isCheckingAutoMerge ? 'Checking auto-merge...' : 'Try Auto-Merge'}
          </span>
        </button>
      )}

      {autoMergeAvailable === true && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
          <Check className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-600 dark:text-green-400">
            Auto-merge available! Click "Manual Merge" to review and apply.
          </span>
        </div>
      )}

      {autoMergeAvailable === false && (
        <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <Wand2 className="w-4 h-4 text-yellow-500" />
          <span className="text-sm text-yellow-600 dark:text-yellow-400">
            Auto-merge not possible. Please choose a resolution manually.
          </span>
        </div>
      )}

      {/* Resolution buttons */}
      <div className="grid grid-cols-3 gap-3">
        {/* Keep Local */}
        <button
          onClick={onSelectLocal}
          disabled={isResolving}
          className="flex flex-col items-center gap-2 p-4 bg-[var(--accent)] hover:bg-[var(--secondary)] border border-[var(--border)] disabled:opacity-50 rounded-lg transition-colors group"
        >
          <div className="p-2 bg-[var(--secondary)] rounded-full group-hover:bg-[var(--border)] transition-colors">
            <ArrowLeft className="w-5 h-5 text-[var(--foreground)]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--foreground)]">
              Keep Local
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Use your changes
            </p>
          </div>
        </button>

        {/* Manual Merge */}
        <button
          onClick={onSelectMerge}
          disabled={isResolving}
          className="flex flex-col items-center gap-2 p-4 bg-[var(--accent)] hover:bg-[var(--secondary)] border border-[var(--border)] disabled:opacity-50 rounded-lg transition-colors group"
        >
          <div className="p-2 bg-[var(--secondary)] rounded-full group-hover:bg-[var(--border)] transition-colors">
            <GitMerge className="w-5 h-5 text-[var(--foreground)]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--foreground)]">
              Manual Merge
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Combine both versions
            </p>
          </div>
        </button>

        {/* Keep Cloud */}
        <button
          onClick={onSelectCloud}
          disabled={isResolving}
          className="flex flex-col items-center gap-2 p-4 bg-[var(--accent)] hover:bg-[var(--secondary)] border border-[var(--border)] disabled:opacity-50 rounded-lg transition-colors group"
        >
          <div className="p-2 bg-[var(--secondary)] rounded-full group-hover:bg-[var(--border)] transition-colors">
            <ArrowRight className="w-5 h-5 text-[var(--foreground)]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--foreground)]">
              Keep Cloud
            </p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Use cloud version
            </p>
          </div>
        </button>
      </div>

      {/* Loading indicator */}
      {isResolving && (
        <div className="flex items-center justify-center gap-2 py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm text-[var(--muted-foreground)]">
            Resolving conflict...
          </span>
        </div>
      )}

      {/* Help text */}
      <p className="text-xs text-center text-[var(--muted-foreground)]">
        Choose how to resolve this conflict. Your choice will be synced to all team members.
      </p>
    </div>
  );
}
