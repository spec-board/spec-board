'use client';

/**
 * Push Button Component (T048)
 * Button for pushing local specs to cloud
 */

import { useState } from 'react';
import { Upload, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

interface PushResult {
  success: boolean;
  syncedFeatures: string[];
  errors: string[];
  conflicts: string[];
}

interface PushButtonProps {
  projectId: string;
  specs: Array<{
    featureId: string;
    featureName: string;
    files: Array<{
      type: string;
      content: string;
    }>;
  }>;
  onPushComplete?: (result: PushResult) => void;
  disabled?: boolean;
  variant?: 'default' | 'compact';
}

export function PushButton({
  projectId,
  specs,
  onPushComplete,
  disabled = false,
  variant = 'default',
}: PushButtonProps) {
  const [isPushing, setIsPushing] = useState(false);
  const [lastResult, setLastResult] = useState<PushResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handlePush = async () => {
    if (isPushing || disabled || specs.length === 0) return;

    setIsPushing(true);
    setLastResult(null);
    setShowResult(false);

    try {
      const response = await fetch(`/api/sync/${projectId}/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specs }),
      });

      const result: PushResult = await response.json();

      if (!response.ok) {
        throw new Error(result.errors?.[0] || 'Push failed');
      }

      setLastResult(result);
      setShowResult(true);
      onPushComplete?.(result);

      // Hide result after 3 seconds
      setTimeout(() => setShowResult(false), 3000);
    } catch (err) {
      const errorResult: PushResult = {
        success: false,
        syncedFeatures: [],
        errors: [err instanceof Error ? err.message : 'Push failed'],
        conflicts: [],
      };
      setLastResult(errorResult);
      setShowResult(true);
      onPushComplete?.(errorResult);
    } finally {
      setIsPushing(false);
    }
  };

  // Compact variant - just an icon button
  if (variant === 'compact') {
    return (
      <button
        onClick={handlePush}
        disabled={isPushing || disabled || specs.length === 0}
        className="p-2 hover:bg-[var(--secondary)] rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={isPushing ? 'Pushing...' : `Push ${specs.length} spec(s) to cloud`}
      >
        {isPushing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : lastResult?.success && showResult ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : lastResult?.conflicts?.length && showResult ? (
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
      </button>
    );
  }

  // Default variant - full button with text
  return (
    <div className="space-y-2">
      <button
        onClick={handlePush}
        disabled={isPushing || disabled || specs.length === 0}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
      >
        {isPushing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        <span>
          {isPushing
            ? 'Pushing...'
            : `Push ${specs.length} spec${specs.length !== 1 ? 's' : ''}`}
        </span>
      </button>

      {/* Result feedback */}
      {showResult && lastResult && (
        <div
          className={`p-3 text-sm rounded-lg ${
            lastResult.success
              ? 'bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400'
              : lastResult.conflicts.length > 0
              ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-500'
          }`}
        >
          {lastResult.success ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>
                Pushed {lastResult.syncedFeatures.length} feature
                {lastResult.syncedFeatures.length !== 1 ? 's' : ''} successfully
              </span>
            </div>
          ) : lastResult.conflicts.length > 0 ? (
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>
                {lastResult.conflicts.length} conflict
                {lastResult.conflicts.length !== 1 ? 's' : ''} detected
              </span>
            </div>
          ) : (
            <div>
              <p className="font-medium">Push failed</p>
              {lastResult.errors.map((error, i) => (
                <p key={i} className="text-xs mt-1">
                  {error}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
