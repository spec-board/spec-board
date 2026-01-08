'use client';

/**
 * Sync Status Indicator (T047)
 * Shows the current sync status for a cloud project
 */

import { useState, useEffect } from 'react';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import type { SyncStatus } from '@/types';

interface SyncStatusProps {
  projectId: string;
  onStatusChange?: (status: SyncStatus | null) => void;
  compact?: boolean;
}

export function SyncStatusIndicator({
  projectId,
  onStatusChange,
  compact = false,
}: SyncStatusProps) {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/sync/${projectId}/status`);

      if (!response.ok) {
        if (response.status === 401) {
          setError('Not authenticated');
          return;
        }
        throw new Error('Failed to fetch sync status');
      }

      const data = await response.json();
      const syncStatus: SyncStatus = {
        projectId: data.projectId,
        lastPushAt: data.lastActivity?.userSync?.type === 'PUSH'
          ? data.lastActivity.userSync.at
          : undefined,
        lastPullAt: data.lastActivity?.userSync?.type === 'PULL'
          ? data.lastActivity.userSync.at
          : undefined,
        pendingChanges: 0, // Would need local tracking
        hasConflicts: data.stats.pendingConflicts > 0,
        conflictCount: data.stats.pendingConflicts,
      };

      setStatus(syncStatus);
      onStatusChange?.(syncStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      onStatusChange?.(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [projectId]);

  const formatLastSync = (dateString?: string) => {
    if (!dateString) return 'Never';

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

  // Compact mode - just an icon with tooltip
  if (compact) {
    if (isLoading) {
      return (
        <div className="p-1.5" title="Checking sync status...">
          <Loader2 className="w-4 h-4 animate-spin text-[var(--muted-foreground)]" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-1.5" title={error}>
          <CloudOff className="w-4 h-4 text-red-500" />
        </div>
      );
    }

    if (status?.hasConflicts) {
      return (
        <div
          className="p-1.5"
          title={`${status.conflictCount} conflict${status.conflictCount > 1 ? 's' : ''}`}
        >
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
        </div>
      );
    }

    return (
      <div className="p-1.5" title="Synced">
        <Cloud className="w-4 h-4 text-green-500" />
      </div>
    );
  }

  // Full mode
  return (
    <div className="flex items-center gap-3 p-3 bg-[var(--secondary)] rounded-lg">
      {/* Status Icon */}
      <div className="flex-shrink-0">
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-[var(--muted-foreground)]" />
        ) : error ? (
          <CloudOff className="w-5 h-5 text-red-500" />
        ) : status?.hasConflicts ? (
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
        ) : (
          <CheckCircle className="w-5 h-5 text-green-500" />
        )}
      </div>

      {/* Status Text */}
      <div className="flex-1 min-w-0">
        {isLoading ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            Checking sync status...
          </p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : status?.hasConflicts ? (
          <div>
            <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
              {status.conflictCount} conflict{status.conflictCount > 1 ? 's' : ''} detected
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Resolve conflicts before syncing
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              Synced
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Last sync: {formatLastSync(status?.lastPushAt || status?.lastPullAt)}
            </p>
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <button
        onClick={fetchStatus}
        disabled={isLoading}
        className="p-1.5 hover:bg-[var(--card)] rounded transition-colors disabled:opacity-50"
        title="Refresh status"
      >
        <RefreshCw
          className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
        />
      </button>
    </div>
  );
}
