'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (project: { id: string; name: string; displayName: string }) => void;
}

export function CreateProjectModal({ isOpen, onClose, onCreated }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setError(null);
      setWarning(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    setIsLoading(true);
    setError(null);
    setWarning(null);

    try {
      const requestBody = {
        name: name.trim(),
        description: description.trim() || undefined,
        generateConstitution: !!description.trim(),
      };
      console.log('[Frontend] Creating project with:', requestBody);

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      // Check for warning (e.g., constitution skipped)
      if (data.warning) {
        setWarning(data.warning);
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      onCreated(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  }, [name, description, onCreated, onClose]);

  // Handle keyboard
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md mx-4 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div
          className="flex items-center justify-center border-b border-[var(--border)]"
          style={{ padding: 'var(--space-4)' }}
        >
          <h2
            className="font-semibold"
            style={{ fontSize: 'var(--text-lg)' }}
          >
            Create New Project
          </h2>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--card)]/80 rounded-xl">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <div className="absolute inset-0 w-8 h-8 border-2 border-blue-500/30 rounded-full animate-pulse" />
                </div>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  Creating project...
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Generating constitution with AI
                </p>
              </div>
            </div>
          )}

          <div style={{ padding: 'var(--space-4)' }}>
            {/* Name Input */}
            <div className="space-y-2">
              <label
                htmlFor="project-name"
                className="text-sm font-medium"
              >
                Project Name
              </label>
              <input
                ref={inputRef}
                id="project-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder="e.g., My Awesome Project"
                disabled={isLoading}
                className={cn(
                  'w-full px-3 py-2 rounded-lg border bg-[var(--secondary)]',
                  'outline-none focus:border-[var(--ring)] transition-colors',
                  'placeholder:text-[var(--muted-foreground)]',
                  error && 'border-red-500/50',
                  isLoading && 'opacity-50 cursor-not-allowed'
                )}
                style={{ fontSize: 'var(--text-sm)' }}
              />
              <p className="text-xs text-[var(--muted-foreground)]">
                URL: /projects/{name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'my-awesome-project'}
              </p>
            </div>

            {/* Description Input */}
            <div className="space-y-2 mt-4">
              <label
                htmlFor="project-description"
                className="text-sm font-medium"
              >
                Description <span className="text-[var(--muted-foreground)] font-normal">(optional)</span>
              </label>
              <textarea
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., A project management tool for small teams to track tasks and collaborate in real-time..."
                rows={3}
                disabled={isLoading}
                className={cn(
                  'w-full px-3 py-2 rounded-lg border bg-[var(--secondary)]',
                  'outline-none focus:border-[var(--ring)] transition-colors resize-none',
                  'placeholder:text-[var(--muted-foreground)]',
                  isLoading && 'opacity-50 cursor-not-allowed'
                )}
                style={{ fontSize: 'var(--text-sm)' }}
              />
              <p className="text-xs text-[var(--muted-foreground)]">
                Describe the project purpose, key features, and quality requirements. This will guide AI to generate appropriate development principles for the constitution.
              </p>
            </div>

            {/* Warning Message */}
            {warning && (
              <div
                className="mt-4 p-3 rounded-lg text-sm"
                style={{
                  backgroundColor: 'var(--tag-bg-warning)',
                  color: 'var(--tag-text-warning)',
                }}
              >
                {warning}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div
                className="mt-4 p-3 rounded-lg text-sm"
                style={{
                  backgroundColor: 'var(--tag-bg-error)',
                  color: 'var(--tag-text-error)',
                }}
              >
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-center gap-3 border-t border-[var(--border)]"
            style={{ padding: 'var(--space-4)' }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                'hover:bg-[var(--secondary)]',
                isLoading && 'opacity-50 cursor-not-allowed'
              )}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                'transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                'bg-blue-500 hover:bg-blue-600 text-white'
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
