'use client';

/**
 * Link Code Generator UI (T034)
 * Modal for generating and displaying project invite codes
 */

import { useState, useEffect } from 'react';
import { X, Loader2, Link as LinkIcon, Copy, Check, Clock } from 'lucide-react';

interface LinkCode {
  id: string;
  code: string;
  expiresAt: string;
  createdAt: string;
}

interface LinkCodeGeneratorProps {
  projectId: string;
  onClose: () => void;
}

export function LinkCodeGenerator({ projectId, onClose }: LinkCodeGeneratorProps) {
  const [activeCodes, setActiveCodes] = useState<LinkCode[]>([]);
  const [newCode, setNewCode] = useState<{ code: string; expiresAt: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [expiresInHours, setExpiresInHours] = useState(24);

  // Fetch existing active codes
  useEffect(() => {
    const fetchCodes = async () => {
      try {
        const response = await fetch(`/api/cloud-projects/${projectId}/links`);
        if (response.ok) {
          const data = await response.json();
          setActiveCodes(data);
        }
      } catch (err) {
        console.error('Failed to fetch link codes:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCodes();
  }, [projectId]);

  const generateCode = async () => {
    setIsGenerating(true);
    setError(null);
    setNewCode(null);

    try {
      const response = await fetch(`/api/cloud-projects/${projectId}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresInHours }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate code');
      }

      const data = await response.json();
      setNewCode({ code: data.code, expiresAt: data.expiresAt });

      // Add to active codes list
      setActiveCodes(prev => [{
        id: data.code,
        code: data.code,
        expiresAt: data.expiresAt,
        createdAt: new Date().toISOString(),
      }, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatExpiry = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 24) {
      const days = Math.floor(diffHours / 24);
      return `${days} day${days > 1 ? 's' : ''} left`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMins}m left`;
    } else if (diffMins > 0) {
      return `${diffMins}m left`;
    }
    return 'Expired';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Invite Link</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[var(--secondary)] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">
              {error}
            </div>
          )}

          {/* New code display */}
          {newCode && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400 mb-2">
                Share this code with your team member:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-[var(--secondary)] rounded font-mono text-lg tracking-wider text-center">
                  {newCode.code}
                </code>
                <button
                  onClick={() => copyToClipboard(newCode.code)}
                  className="p-2 hover:bg-[var(--secondary)] rounded transition-colors"
                  title="Copy code"
                >
                  {copiedCode === newCode.code ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Expires: {formatExpiry(newCode.expiresAt)}
              </p>
            </div>
          )}

          {/* Generate new code */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Code expires in
              </label>
              <select
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[var(--secondary)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                disabled={isGenerating}
              >
                <option value={1}>1 hour</option>
                <option value={6}>6 hours</option>
                <option value={24}>24 hours</option>
                <option value={72}>3 days</option>
                <option value={168}>7 days</option>
              </select>
            </div>
            <button
              onClick={generateCode}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LinkIcon className="w-4 h-4" />
              )}
              Generate New Code
            </button>
          </div>

          {/* Active codes list */}
          {!isLoading && activeCodes.length > 0 && (
            <div className="pt-4 border-t border-[var(--border)]">
              <h3 className="text-sm font-medium mb-2">Active Codes</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {activeCodes.map((linkCode) => (
                  <div
                    key={linkCode.id}
                    className="flex items-center justify-between p-2 bg-[var(--secondary)] rounded"
                  >
                    <div>
                      <code className="font-mono text-sm">{linkCode.code}</code>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {formatExpiry(linkCode.expiresAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(linkCode.code)}
                      className="p-1.5 hover:bg-[var(--card)] rounded transition-colors"
                      title="Copy code"
                    >
                      {copiedCode === linkCode.code ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--muted-foreground)]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
