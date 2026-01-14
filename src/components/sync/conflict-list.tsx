'use client';

/**
 * Conflict List Component (T067)
 * Displays a list of pending conflicts for a cloud project
 */

import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  FileText,
  Clock,
  ChevronRight,
  Loader2,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import type { SyncConflict, SyncFileType } from '@/types';

interface ConflictWithDiff extends SyncConflict {
  diff: {
    patches: string;
    hunks: Array<{
      oldStart: number;
      oldLines: number;
      newStart: number;
      newLines: number;
      lines: Array<{
        type: 'add' | 'remove' | 'context';
        content: string;
        oldLineNumber?: number;
        newLineNumber?: number;
      }>;
    }>;
  };
  summary: string;
}

interface ConflictListProps {
  projectId: string;
  onSelectConflict?: (conflict: ConflictWithDiff) => void;
  selectedConflictId?: string;
  onConflictsLoaded?: (count: number) => void;
}

const FILE_TYPE_LABELS: Record<SyncFileType, string> = {
  spec: 'Specification',
  plan: 'Plan',
  tasks: 'Tasks',
  research: 'Research',
  'data-model': 'Data Model',
  quickstart: 'Quickstart',
};

export function ConflictList({
  projectId,
  onSelectConflict,
  selectedConflictId,
  onConflictsLoaded,
}: ConflictListProps) {
  const [conflicts, setConflicts] = useState<ConflictWithDiff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConflicts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/sync/${projectId}/conflicts`);

      if (!response.ok) {
        if (response.status === 401) {
          setError('Not authenticated');
          return;
        }
        if (response.status === 403) {
          setError('Access denied');
          return;
        }
        throw new Error('Failed to fetch conflicts');
      }

      const data = await response.json();
      setConflicts(data.conflicts || []);
      onConflictsLoaded?.(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConflicts();
  }, [projectId]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--muted-foreground)]" />
        <span className="ml-2 text-sm text-[var(--muted-foreground)]">
          Loading conflicts...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-red-500/10 border border-red-500/20"
        style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius)' }}
      >
        <p className="text-red-500" style={{ fontSize: 'var(--text-sm)' }}>{error}</p>
        <button
          onClick={fetchConflicts}
          className="mt-2 text-red-400 hover:text-red-300 flex items-center gap-1 focus-ring"
          style={{ fontSize: 'var(--text-xs)', transition: 'var(--transition-base)' }}
        >
          <RefreshCw className="w-3 h-3" />
          Retry
        </button>
      </div>
    );
  }

  if (conflicts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center" style={{ padding: 'var(--space-4)' }}>
        <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
        <h3 className="font-medium" style={{ fontSize: 'var(--text-lg)' }}>No Conflicts</h3>
        <p className="text-[var(--muted-foreground)] mt-1" style={{ fontSize: 'var(--text-sm)' }}>
          All specs are in sync
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ padding: '4px 8px' }}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          <span className="font-medium" style={{ fontSize: 'var(--text-sm)' }}>
            {conflicts.length} Conflict{conflicts.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={fetchConflicts}
          className="p-1 hover:bg-[var(--secondary)] focus-ring"
          style={{ borderRadius: 'var(--radius)', transition: 'var(--transition-base)' }}
          title="Refresh"
          aria-label="Refresh conflicts"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Conflict Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {conflicts.map((conflict) => (
          <button
            key={conflict.id}
            onClick={() => onSelectConflict?.(conflict)}
            className={`w-full text-left border focus-ring ${
              selectedConflictId === conflict.id
                ? 'bg-yellow-500/10 border-yellow-500/30'
                : 'bg-[var(--card)] border-[var(--border)] hover:bg-[var(--secondary)]'
            }`}
            style={{ padding: 'var(--space-1-5)', borderRadius: 'var(--radius)', transition: 'var(--transition-base)' }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {/* Feature ID and File Type */}
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
                  <span className="font-medium truncate">
                    {conflict.featureId}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 bg-[var(--secondary)] rounded">
                    {FILE_TYPE_LABELS[conflict.fileType] || conflict.fileType}
                  </span>
                </div>

                {/* Diff Summary */}
                <p className="text-sm text-[var(--muted-foreground)] mt-1 truncate">
                  {conflict.summary}
                </p>

                {/* Timestamp */}
                <div className="flex items-center gap-1 mt-2 text-xs text-[var(--muted-foreground)]">
                  <Clock className="w-3 h-3" />
                  <span>Detected {formatTimeAgo(conflict.detectedAt)}</span>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0 mt-1" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
