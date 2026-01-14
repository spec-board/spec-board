'use client';

/**
 * Pull Button Component (T049)
 * Button for pulling specs from cloud to local
 */

import { useState } from 'react';
import { Download, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import type { SyncFileType } from '@/types';

interface PullResult {
  features: Array<{
    featureId: string;
    featureName: string;
    files: Array<{
      type: SyncFileType;
      content: string;
      checksum: string;
      lastModified: string;
      lastModifiedBy?: string;
      version: number;
    }>;
  }>;
  hasConflicts: boolean;
  conflictCount: number;
}

interface PullButtonProps {
  projectId: string;
  featureIds?: string[];
  onPullComplete?: (result: PullResult) => void;
  disabled?: boolean;
  variant?: 'default' | 'compact';
}

export function PullButton({
  projectId,
  featureIds,
  onPullComplete,
  disabled = false,
  variant = 'default',
}: PullButtonProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [lastResult, setLastResult] = useState<PullResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handlePull = async () => {
    if (isPulling || disabled) return;

    setIsPulling(true);
    setLastResult(null);
    setError(null);
    setShowResult(false);

    try {
      const params = new URLSearchParams();
      if (featureIds && featureIds.length > 0) {
        featureIds.forEach((id) => params.append('featureIds', id));
      }

      const url = `/api/sync/${projectId}/features${params.toString() ? `?${params}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Pull failed');
      }

      const result: PullResult = await response.json();

      setLastResult(result);
      setShowResult(true);
      onPullComplete?.(result);

      // Hide result after 3 seconds
      setTimeout(() => setShowResult(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pull failed');
      setShowResult(true);
    } finally {
      setIsPulling(false);
    }
  };

  // Compact variant - just an icon button
  if (variant === 'compact') {
    return (
      <button
        onClick={handlePull}
        disabled={isPulling || disabled}
        className="p-2 hover:bg-[var(--secondary)] disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
        style={{ borderRadius: 'var(--radius)', transition: 'var(--transition-base)' }}
        title={isPulling ? 'Pulling...' : 'Pull specs from cloud'}
        aria-label={isPulling ? 'Pulling specs from cloud' : 'Pull specs from cloud'}
      >
        {isPulling ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : lastResult && showResult ? (
          lastResult.hasConflicts ? (
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          ) : (
            <CheckCircle className="w-4 h-4 text-green-500" />
          )
        ) : (
          <Download className="w-4 h-4" />
        )}
      </button>
    );
  }

  // Default variant - full button with text
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
      <button
        onClick={handlePull}
        disabled={isPulling || disabled}
        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white focus-ring"
        style={{ padding: 'var(--space-1) var(--space-2)', borderRadius: 'var(--radius)', transition: 'var(--transition-base)' }}
      >
        {isPulling ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span>{isPulling ? 'Pulling...' : 'Pull from Cloud'}</span>
      </button>

      {/* Result feedback */}
      {showResult && (lastResult || error) && (
        <div
          className={`text-sm ${
            error
              ? 'bg-red-500/10 border border-red-500/20 text-red-500'
              : lastResult?.hasConflicts
              ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400'
              : 'bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400'
          }`}
          style={{ padding: 'var(--space-1-5)', borderRadius: 'var(--radius)', fontSize: 'var(--text-sm)' }}
        >
          {error ? (
            <div>
              <p className="font-medium">Pull failed</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          ) : lastResult?.hasConflicts ? (
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>
                Pulled {lastResult.features.length} feature
                {lastResult.features.length !== 1 ? 's' : ''} with{' '}
                {lastResult.conflictCount} conflict
                {lastResult.conflictCount !== 1 ? 's' : ''}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>
                Pulled {lastResult?.features.length || 0} feature
                {(lastResult?.features.length || 0) !== 1 ? 's' : ''} successfully
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
