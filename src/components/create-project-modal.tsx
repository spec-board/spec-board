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

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setError(null);
      setWarning(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Project name is required'); return; }
    if (!description.trim()) { setError('Project description is required'); return; }

    setIsLoading(true);
    setError(null);
    setWarning(null);

    try {
      const requestBody = {
        name: name.trim(),
        description: description.trim(),
        generateConstitution: true,
      };

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (data.warning) setWarning(data.warning);
      if (!response.ok) throw new Error(data.error || 'Failed to create project');

      onCreated(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  }, [name, description, onCreated, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  if (!isOpen) return null;

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'my-project';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        className="relative w-full max-w-md mx-4 bg-[var(--card)] border border-[var(--border)] rounded-lg"
        style={{ boxShadow: 'var(--shadow-xl)' }}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-0">
          <h2 className="text-base font-semibold text-[var(--foreground)]">New project</h2>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--card)]/90 rounded-lg">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--muted-foreground)]" />
                <p className="text-xs text-[var(--muted-foreground)]">Creating project & generating Constitution...</p>
              </div>
            </div>
          )}

          <div className="px-5 py-4 space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label htmlFor="project-name" className="text-xs font-medium text-[var(--muted-foreground)]">
                Name
              </label>
              <input
                ref={inputRef}
                id="project-name"
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(null); }}
                placeholder="My Project"
                disabled={isLoading}
                className={cn(
                  'w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-sm',
                  'outline-none focus:border-[var(--ring)] transition-colors',
                  'placeholder:text-[var(--muted-foreground)]',
                  error && 'border-[var(--foreground)]/30',
                  isLoading && 'opacity-50'
                )}
              />
              <p className="text-xs text-[var(--muted-foreground)]">/{slug}</p>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label htmlFor="project-description" className="text-xs font-medium text-[var(--muted-foreground)]">
                Description <span className="text-[var(--foreground)]">*</span>
              </label>
              <textarea
                id="project-description"
                value={description}
                onChange={(e) => { setDescription(e.target.value); setError(null); }}
                placeholder="Describe your project goals, tech stack, and key requirements. This will be used to generate the project Constitution."
                rows={4}
                disabled={isLoading}
                className={cn(
                  'w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--background)] text-sm',
                  'outline-none focus:border-[var(--ring)] transition-colors resize-none',
                  'placeholder:text-[var(--muted-foreground)]',
                  isLoading && 'opacity-50'
                )}
              />
              <p className="text-xs text-[var(--muted-foreground)]">Used to generate the initial project Constitution</p>
            </div>

            {warning && (
              <p className="text-xs text-[var(--muted-foreground)] p-2 rounded-md bg-[var(--secondary)]">{warning}</p>
            )}
            {error && (
              <p className="text-xs text-[var(--foreground)] p-2 rounded-md bg-[var(--secondary)]">{error}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 pb-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim() || !description.trim()}
              className="btn btn-primary btn-sm"
            >
              {isLoading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
