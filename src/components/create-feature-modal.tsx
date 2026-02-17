'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Loader2,
  AlertCircle,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CreateFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectPath?: string | null;
  onFeatureCreated?: (feature: { id: string; featureId: string; name: string }) => void;
}

export function CreateFeatureModal({
  isOpen,
  onClose,
  projectId,
  onFeatureCreated
}: CreateFeatureModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [featureName, setFeatureName] = useState('');
  const [description, setDescription] = useState('');
  const [createdFeature, setCreatedFeature] = useState<{ id: string; featureId: string; name: string } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFeatureName('');
      setDescription('');
      setCreatedFeature(null);
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const canSubmit = featureName.trim() && description.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/spec-workflow/specify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          name: featureName.trim(),
          description: description.trim()
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create feature');
      }

      const data = await response.json();
      setCreatedFeature({
        id: data.featureIdDb || data.featureId,
        featureId: data.featureId,
        name: featureName.trim()
      });

      toast.success('Feature created', {
        description: `"${featureName}" has been created with spec`
      });

      onFeatureCreated?.({
        id: data.featureIdDb || data.featureId,
        featureId: data.featureId,
        name: featureName.trim()
      });

      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          'relative bg-[var(--card)] rounded-lg shadow-xl',
          'border border-[var(--border)] overflow-hidden',
          'w-full max-w-2xl max-h-[90vh] flex flex-col'
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Create Feature
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--secondary)] transition-colors"
          >
            <X className="w-5 h-5 text-[var(--muted-foreground)]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {createdFeature ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                Feature Created!
              </h3>
              <p className="text-[var(--muted-foreground)]">
                "{featureName}" has been created with spec
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {isLoading && (
                <div className="mb-4 p-3 rounded-lg text-sm bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating specification...
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">
                  Feature Name *
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={featureName}
                  onChange={(e) => setFeatureName(e.target.value)}
                  placeholder="e.g., User Authentication"
                  disabled={isLoading}
                  className={cn(
                    'w-full px-4 py-2.5 rounded-lg border bg-[var(--secondary)] text-[var(--foreground)]',
                    'outline-none focus:border-[var(--ring)] transition-colors',
                    isLoading && 'opacity-50 cursor-not-allowed'
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">
                  Description / PRD *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this feature should do..."
                  rows={6}
                  disabled={isLoading}
                  className={cn(
                    'w-full px-4 py-2.5 rounded-lg border bg-[var(--secondary)] text-[var(--foreground)]',
                    'outline-none focus:border-[var(--ring)] transition-colors resize-none',
                    isLoading && 'opacity-50 cursor-not-allowed'
                  )}
                />
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  AI will generate a specification based on this description
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!createdFeature && (
          <div className="flex-shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)]">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--secondary)] transition-colors text-[var(--foreground)]"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !canSubmit}
              className={cn(
                'flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium',
                'transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                'bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)]'
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Feature'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
