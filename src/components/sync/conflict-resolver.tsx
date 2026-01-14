'use client';

/**
 * Conflict Resolver Component (T068)
 * Side-by-side diff view for resolving sync conflicts
 */

import { useState, useMemo } from 'react';
import {
  X,
  GitMerge,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  AlertTriangle,
  FileText,
  Wand2,
} from 'lucide-react';
import type { SyncConflict, DiffHunk, DiffLine } from '@/types';
import { ResolutionOptions } from './resolution-options';

interface ConflictWithDiff extends SyncConflict {
  diff: {
    patches: string;
    hunks: DiffHunk[];
  };
  summary: string;
}

interface ConflictResolverProps {
  conflict: ConflictWithDiff;
  projectId: string;
  onResolved?: () => void;
  onCancel?: () => void;
}

type ViewMode = 'split' | 'unified';

export function ConflictResolver({
  conflict,
  projectId,
  onResolved,
  onCancel,
}: ConflictResolverProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mergedContent, setMergedContent] = useState<string>(conflict.localContent);
  const [showEditor, setShowEditor] = useState(false);
  const [autoMergeResult, setAutoMergeResult] = useState<{
    canAutoMerge: boolean;
    mergedContent?: string;
    hasConflictMarkers: boolean;
  } | null>(null);
  const [isCheckingAutoMerge, setIsCheckingAutoMerge] = useState(false);

  // Parse content into lines for display
  const localLines = useMemo(() => conflict.localContent.split('\n'), [conflict.localContent]);
  const cloudLines = useMemo(() => conflict.cloudContent.split('\n'), [conflict.cloudContent]);

  const handleResolve = async (resolution: 'LOCAL' | 'CLOUD' | 'MERGED') => {
    setIsResolving(true);
    setError(null);

    try {
      const body: { resolution: string; mergedContent?: string } = { resolution };
      if (resolution === 'MERGED') {
        body.mergedContent = mergedContent;
      }

      const response = await fetch(
        `/api/sync/${projectId}/conflicts/${conflict.id}/resolve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to resolve conflict');
      }

      onResolved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsResolving(false);
    }
  };

  const handleTryAutoMerge = async () => {
    setIsCheckingAutoMerge(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/sync/${projectId}/conflicts/${conflict.id}/resolve`
      );

      if (!response.ok) {
        throw new Error('Failed to check auto-merge');
      }

      const data = await response.json();
      setAutoMergeResult(data.autoMerge);

      if (data.autoMerge.canAutoMerge && data.autoMerge.mergedContent) {
        setMergedContent(data.autoMerge.mergedContent);
        setShowEditor(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auto-merge check failed');
    } finally {
      setIsCheckingAutoMerge(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)]" style={{ padding: 'var(--space-2)' }}>
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          <div>
            <h2 className="font-semibold" style={{ fontSize: 'var(--text-base)' }}>Resolve Conflict</h2>
            <p className="text-[var(--muted-foreground)]" style={{ fontSize: 'var(--text-sm)' }}>
              {conflict.featureId} / {conflict.fileType}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[var(--secondary)] p-1" style={{ borderRadius: 'var(--radius)' }}>
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 focus-ring ${
                viewMode === 'split'
                  ? 'bg-[var(--background)] shadow-sm'
                  : 'hover:bg-[var(--background)]/50'
              }`}
              style={{ fontSize: 'var(--text-sm)', borderRadius: 'var(--radius)', transition: 'var(--transition-base)' }}
              aria-pressed={viewMode === 'split'}
            >
              Split
            </button>
            <button
              onClick={() => setViewMode('unified')}
              className={`px-3 py-1 focus-ring ${
                viewMode === 'unified'
                  ? 'bg-[var(--background)] shadow-sm'
                  : 'hover:bg-[var(--background)]/50'
              }`}
              style={{ fontSize: 'var(--text-sm)', borderRadius: 'var(--radius)', transition: 'var(--transition-base)' }}
              aria-pressed={viewMode === 'unified'}
            >
              Unified
            </button>
          </div>

          <button
            onClick={onCancel}
            className="p-2 hover:bg-[var(--secondary)] focus-ring"
            style={{ borderRadius: 'var(--radius)', transition: 'var(--transition-base)' }}
            title="Close"
            aria-label="Close conflict resolver"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          className="mx-4 mt-4 bg-red-500/10 border border-red-500/20"
          style={{ padding: 'var(--space-1-5)', borderRadius: 'var(--radius)' }}
        >
          <p className="text-red-500" style={{ fontSize: 'var(--text-sm)' }}>{error}</p>
        </div>
      )}

      {/* Diff View */}
      <div className="flex-1 overflow-hidden">
        {showEditor ? (
          <MergeEditor
            content={mergedContent}
            onChange={setMergedContent}
            onCancel={() => setShowEditor(false)}
          />
        ) : viewMode === 'split' ? (
          <SplitDiffView
            localLines={localLines}
            cloudLines={cloudLines}
            hunks={conflict.diff.hunks}
          />
        ) : (
          <UnifiedDiffView hunks={conflict.diff.hunks} />
        )}
      </div>

      {/* Resolution Options */}
      <div className="border-t border-[var(--border)]" style={{ padding: 'var(--space-2)' }}>
        {showEditor ? (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowEditor(false)}
              className="hover:bg-[var(--secondary)] focus-ring"
              style={{ padding: 'var(--space-1) var(--space-2)', fontSize: 'var(--text-sm)', borderRadius: 'var(--radius)', transition: 'var(--transition-base)' }}
            >
              Back to Diff
            </button>
            <button
              onClick={() => handleResolve('MERGED')}
              disabled={isResolving}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white focus-ring"
              style={{ padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius)', transition: 'var(--transition-base)' }}
            >
              {isResolving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Apply Merged Content
            </button>
          </div>
        ) : (
          <ResolutionOptions
            onSelectLocal={() => handleResolve('LOCAL')}
            onSelectCloud={() => handleResolve('CLOUD')}
            onSelectMerge={() => setShowEditor(true)}
            onTryAutoMerge={handleTryAutoMerge}
            isResolving={isResolving}
            isCheckingAutoMerge={isCheckingAutoMerge}
            autoMergeAvailable={autoMergeResult?.canAutoMerge}
          />
        )}
      </div>
    </div>
  );
}

// Split Diff View Component
function SplitDiffView({
  localLines,
  cloudLines,
  hunks,
}: {
  localLines: string[];
  cloudLines: string[];
  hunks: DiffHunk[];
}) {
  return (
    <div className="flex h-full">
      {/* Local (Your Changes) */}
      <div className="flex-1 flex flex-col border-r border-[var(--border)]">
        <div
          className="flex items-center gap-2 bg-blue-500/10 border-b border-[var(--border)]"
          style={{ padding: '8px var(--space-2)' }}
        >
          <ArrowLeft className="w-4 h-4 text-blue-500" />
          <span className="font-medium text-blue-600 dark:text-blue-400" style={{ fontSize: 'var(--text-sm)' }}>
            Your Changes (Local)
          </span>
        </div>
        <div className="flex-1 overflow-auto">
          <DiffContent lines={localLines} side="local" hunks={hunks} />
        </div>
      </div>

      {/* Cloud (Their Changes) */}
      <div className="flex-1 flex flex-col">
        <div
          className="flex items-center gap-2 bg-purple-500/10 border-b border-[var(--border)]"
          style={{ padding: '8px var(--space-2)' }}
        >
          <ArrowRight className="w-4 h-4 text-purple-500" />
          <span className="font-medium text-purple-600 dark:text-purple-400" style={{ fontSize: 'var(--text-sm)' }}>
            Cloud Version
          </span>
        </div>
        <div className="flex-1 overflow-auto">
          <DiffContent lines={cloudLines} side="cloud" hunks={hunks} />
        </div>
      </div>
    </div>
  );
}

// Diff Content with line highlighting
function DiffContent({
  lines,
  side,
  hunks,
}: {
  lines: string[];
  side: 'local' | 'cloud';
  hunks: DiffHunk[];
}) {
  // Build a set of changed line numbers for highlighting
  const changedLines = useMemo(() => {
    const changed = new Set<number>();
    for (const hunk of hunks) {
      for (const line of hunk.lines) {
        if (side === 'local' && line.type === 'add' && line.newLineNumber) {
          changed.add(line.newLineNumber);
        }
        if (side === 'cloud' && line.type === 'remove' && line.oldLineNumber) {
          changed.add(line.oldLineNumber);
        }
      }
    }
    return changed;
  }, [hunks, side]);

  return (
    <pre className="text-sm font-mono">
      {lines.map((line, index) => {
        const lineNum = index + 1;
        const isChanged = changedLines.has(lineNum);
        const bgColor = isChanged
          ? side === 'local'
            ? 'bg-green-500/10'
            : 'bg-red-500/10'
          : '';

        return (
          <div
            key={index}
            className={`flex hover:bg-[var(--secondary)]/50 ${bgColor}`}
          >
            <span className="w-12 px-2 py-0.5 text-right text-[var(--muted-foreground)] select-none border-r border-[var(--border)]">
              {lineNum}
            </span>
            <span className="flex-1 px-4 py-0.5 whitespace-pre-wrap break-all">
              {line || ' '}
            </span>
          </div>
        );
      })}
    </pre>
  );
}

// Unified Diff View Component
function UnifiedDiffView({ hunks }: { hunks: DiffHunk[] }) {
  return (
    <div className="h-full overflow-auto">
      <pre style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)' }}>
        {hunks.map((hunk, hunkIndex) => (
          <div key={hunkIndex}>
            {/* Hunk header */}
            <div
              className="bg-[var(--secondary)] text-[var(--muted-foreground)]"
              style={{ padding: '4px var(--space-2)', fontSize: 'var(--text-xs)' }}
            >
              @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
            </div>
            {/* Hunk lines */}
            {hunk.lines.map((line, lineIndex) => (
              <DiffLineRow key={lineIndex} line={line} />
            ))}
          </div>
        ))}
      </pre>
    </div>
  );
}

// Single diff line row
function DiffLineRow({ line }: { line: DiffLine }) {
  const bgColor =
    line.type === 'add'
      ? 'bg-green-500/10'
      : line.type === 'remove'
      ? 'bg-red-500/10'
      : '';

  const prefix =
    line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' ';

  const textColor =
    line.type === 'add'
      ? 'text-green-600 dark:text-green-400'
      : line.type === 'remove'
      ? 'text-red-600 dark:text-red-400'
      : '';

  return (
    <div className={`flex hover:bg-[var(--secondary)]/50 ${bgColor}`}>
      <span className="w-12 px-2 py-0.5 text-right text-[var(--muted-foreground)] select-none border-r border-[var(--border)]">
        {line.oldLineNumber || ''}
      </span>
      <span className="w-12 px-2 py-0.5 text-right text-[var(--muted-foreground)] select-none border-r border-[var(--border)]">
        {line.newLineNumber || ''}
      </span>
      <span className={`w-6 px-1 py-0.5 text-center select-none ${textColor}`}>
        {prefix}
      </span>
      <span className={`flex-1 px-2 py-0.5 whitespace-pre-wrap break-all ${textColor}`}>
        {line.content || ' '}
      </span>
    </div>
  );
}

// Merge Editor Component
function MergeEditor({
  content,
  onChange,
  onCancel,
}: {
  content: string;
  onChange: (content: string) => void;
  onCancel: () => void;
}) {
  return (
    <div className="h-full flex flex-col">
      <div
        className="flex items-center gap-2 bg-green-500/10 border-b border-[var(--border)]"
        style={{ padding: '8px var(--space-2)' }}
      >
        <GitMerge className="w-4 h-4 text-green-500" />
        <span className="font-medium text-green-600 dark:text-green-400" style={{ fontSize: 'var(--text-sm)' }}>
          Manual Merge Editor
        </span>
        <span className="text-[var(--muted-foreground)]" style={{ fontSize: 'var(--text-xs)' }}>
          Edit the content below to create your merged version
        </span>
      </div>
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 w-full bg-[var(--background)] resize-none focus:outline-none"
        style={{ padding: 'var(--space-2)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}
        spellCheck={false}
        aria-label="Merge editor content"
      />
    </div>
  );
}
