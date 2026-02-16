'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Plus, Loader2, FolderOpen, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (project: { id: string; name: string; displayName: string }) => void;
}

export function CreateProjectModal({ isOpen, onClose, onCreated }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [constitutionPrompt, setConstitutionPrompt] = useState('');
  const [generateConstitution, setGenerateConstitution] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setConstitutionPrompt('');
      setGenerateConstitution(false);
      setError(null);
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

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          constitutionPrompt: generateConstitution ? (constitutionPrompt.trim() || undefined) : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create project');
      }

      const project = await response.json();
      onCreated(project);
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
          className="flex items-center justify-between border-b border-[var(--border)]"
          style={{ padding: 'var(--space-4)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center"
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius)',
                background: 'linear-gradient(135deg, var(--tag-bg-info) 0%, var(--tag-bg-purple) 100%)',
              }}
            >
              <Sparkles className="w-5 h-5" style={{ color: 'var(--tag-text-info)' }} />
            </div>
            <h2
              className="font-semibold"
              style={{ fontSize: 'var(--text-lg)' }}
            >
              Create New Project
            </h2>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-[var(--secondary)] rounded-lg transition-colors"
            style={{
              padding: 'var(--space-2)',
              borderRadius: 'var(--radius)',
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
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
                className={cn(
                  'w-full px-3 py-2 rounded-lg border bg-[var(--secondary)]',
                  'outline-none focus:border-[var(--ring)] transition-colors',
                  'placeholder:text-[var(--muted-foreground)]',
                  error && 'border-red-500/50'
                )}
                style={{ fontSize: 'var(--text-sm)' }}
              />
              <p className="text-xs text-[var(--muted-foreground)]">
                URL: /projects/{name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'your-project'}
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
                placeholder="Brief description of your project..."
                rows={3}
                className={cn(
                  'w-full px-3 py-2 rounded-lg border bg-[var(--secondary)]',
                  'outline-none focus:border-[var(--ring)] transition-colors resize-none',
                  'placeholder:text-[var(--muted-foreground)]'
                )}
                style={{ fontSize: 'var(--text-sm)' }}
              />
            </div>

            {/* Generate Constitution Toggle */}
            <div className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                id="generate-constitution"
                checked={generateConstitution}
                onChange={(e) => setGenerateConstitution(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--border)]"
              />
              <label htmlFor="generate-constitution" className="text-sm font-medium">
                Generate Constitution with AI
              </label>
            </div>

            {/* Constitution Prompt - only shown when checkbox is checked */}
            {generateConstitution && (
              <div className="space-y-2 mt-2">
                <label
                  htmlFor="constitution-prompt"
                  className="text-xs text-[var(--muted-foreground)]"
                >
                  Describe your project principles and requirements for the AI to generate a constitution
                </label>
                <textarea
                  id="constitution-prompt"
                  value={constitutionPrompt}
                  onChange={(e) => setConstitutionPrompt(e.target.value)}
                  placeholder="e.g., This is a TypeScript/Next.js e-commerce app focused on performance and accessibility..."
                  rows={3}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg border bg-[var(--secondary)]',
                    'outline-none focus:border-[var(--ring)] transition-colors resize-none',
                    'placeholder:text-[var(--muted-foreground)]'
                  )}
                  style={{ fontSize: 'var(--text-sm)' }}
                />
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
            className="flex items-center justify-end gap-3 border-t border-[var(--border)]"
            style={{ padding: 'var(--space-4)' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--secondary)] transition-colors"
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
                <>
                  <Plus className="w-4 h-4" />
                  Create Project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
