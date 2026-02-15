'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Plus, Loader2, Sparkles } from 'lucide-react';
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
  projectPath,
  onFeatureCreated
}: CreateFeatureModalProps) {
  const [featureName, setFeatureName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFeatureName('');
      setDescription('');
      setError(null);
      setIsGenerating(false);
      setGenerationStatus('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!featureName.trim()) {
      setError('Feature name is required');
      return;
    }

    setIsLoading(true);
    setIsGenerating(true);
    setError(null);

    try {
      // Call AI to generate spec/plan/tasks and create feature
      const response = await fetch('/api/features/ai-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          projectPath,
          name: featureName.trim(),
          description: description.trim() || featureName.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create feature');
      }

      const feature = await response.json();

      setGenerationStatus('Generating spec...');
      await new Promise(resolve => setTimeout(resolve, 500));

      setGenerationStatus('Generating plan...');
      await new Promise(resolve => setTimeout(resolve, 500));

      setGenerationStatus('Generating tasks...');
      await new Promise(resolve => setTimeout(resolve, 500));

      toast.success('Feature created with AI', {
        description: `Created "${featureName}" with generated spec/plan/tasks`
      });

      onFeatureCreated?.({
        id: feature.id,
        featureId: feature.featureId,
        name: feature.name
      });
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create feature';
      setError(errorMessage);
      toast.error('Failed to create feature', {
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
      setGenerationStatus('');
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
          'relative bg-[var(--card)] rounded-lg shadow-xl w-full max-w-md',
          'overflow-hidden flex flex-col border border-[var(--border)]'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-feature-title"
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg bg-[var(--primary)]/10"
              >
                <Sparkles className="w-5 h-5 text-[var(--primary)]" />
              </div>
              <div>
                <h2
                  id="create-feature-title"
                  className="text-lg font-semibold text-[var(--foreground)]"
                >
                  Create Feature with AI
                </h2>
                <p className="text-sm text-[var(--muted-foreground)]">
                  AI will generate spec, plan & tasks
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-[var(--secondary)] transition-colors text-[var(--muted-foreground)]"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {error && (
              <div
                className="p-3 rounded-lg text-sm bg-red-500/10 text-red-400 border border-red-500/20"
              >
                {error}
              </div>
            )}

            {isGenerating && (
              <div className="p-3 rounded-lg text-sm bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {generationStatus || 'Generating...'}
              </div>
            )}

            {/* Feature Name */}
            <div>
              <label
                htmlFor="feature-name"
                className="block text-sm font-medium mb-2 text-[var(--foreground)]"
              >
                Feature Name *
              </label>
              <input
                ref={inputRef}
                id="feature-name"
                type="text"
                value={featureName}
                onChange={(e) => {
                  setFeatureName(e.target.value);
                  setError(null);
                }}
                placeholder="e.g., User Authentication"
                disabled={isLoading}
                className={cn(
                  'w-full px-4 py-2.5 rounded-lg border bg-[var(--secondary)] text-[var(--foreground)]',
                  'outline-none focus:border-[var(--ring)] transition-colors',
                  error && 'border-red-500/50'
                )}
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="feature-description"
                className="block text-sm font-medium mb-2 text-[var(--foreground)]"
              >
                Description / PRD *
              </label>
              <textarea
                id="feature-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this feature should do, key requirements, user needs..."
                rows={5}
                disabled={isLoading}
                className={cn(
                  'w-full px-4 py-2.5 rounded-lg border bg-[var(--secondary)] text-[var(--foreground)]',
                  'outline-none focus:border-[var(--ring)] transition-colors resize-none'
                )}
              />
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                AI will use this description to generate spec, plan, and tasks
              </p>
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border)]"
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--secondary)] transition-colors text-[var(--foreground)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !featureName.trim() || !description.trim()}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                'transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                'bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)]'
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isGenerating ? 'Generating with AI...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate with AI
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
