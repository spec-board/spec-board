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
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 disabled:opacity-50 rounded-lg transition-colors"
        >
          {isCheckingAutoMerge ? (
            <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
          ) : (
            <Wand2 className="w-4 h-4 text-purple-500" />
          )}
          <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
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
          className="flex flex-col items-center gap-2 p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 disabled:opacity-50 rounded-lg transition-colors group"
        >
          <div className="p-2 bg-blue-500/20 rounded-full group-hover:bg-blue-500/30 transition-colors">
            <ArrowLeft className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
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
          className="flex flex-col items-center gap-2 p-4 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 disabled:opacity-50 rounded-lg transition-colors group"
        >
          <div className="p-2 bg-green-500/20 rounded-full group-hover:bg-green-500/30 transition-colors">
            <GitMerge className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
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
          className="flex flex-col items-center gap-2 p-4 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 disabled:opacity-50 rounded-lg transition-colors group"
        >
          <div className="p-2 bg-purple-500/20 rounded-full group-hover:bg-purple-500/30 transition-colors">
            <ArrowRight className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
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
