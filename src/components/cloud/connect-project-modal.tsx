'use client';

/**
 * Connect Project Modal
 * Modal for joining a project using a link code
 */

import { useState } from 'react';
import { X, Loader2, Link as LinkIcon, CheckCircle } from 'lucide-react';

interface ConnectProjectModalProps {
  onClose: () => void;
  onConnected: () => void;
}

export function ConnectProjectModal({ onClose, onConnected }: ConnectProjectModalProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    projectName: string;
    alreadyMember: boolean;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      setError('Please enter a link code');
      return;
    }

    if (trimmedCode.length !== 6) {
      setError('Link code must be 6 characters');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/cloud-projects/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmedCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect');
      }

      setSuccess({
        projectName: data.project.name,
        alreadyMember: data.alreadyMember,
      });

      // Auto-close after success
      setTimeout(() => {
        onConnected();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Format code input (uppercase, max 6 chars)
  const handleCodeChange = (value: string) => {
    const formatted = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setCode(formatted);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-sm mx-4 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Join Project</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[var(--secondary)] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <h3 className="text-lg font-medium mb-1">
                {success.alreadyMember ? 'Already a Member' : 'Successfully Joined!'}
              </h3>
              <p className="text-[var(--muted-foreground)]">
                {success.alreadyMember
                  ? `You're already a member of "${success.projectName}"`
                  : `You've joined "${success.projectName}"`}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-[var(--muted-foreground)]">
                Enter the 6-character code shared by a project admin to join their project.
              </p>

              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="code" className="block text-sm font-medium mb-1.5">
                  Link Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--secondary)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xl tracking-[0.3em] text-center uppercase"
                  placeholder="ABC123"
                  autoFocus
                  disabled={isLoading}
                  maxLength={6}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--secondary)] transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  disabled={isLoading || code.length !== 6}
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Join Project
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
