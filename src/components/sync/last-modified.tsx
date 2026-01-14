'use client';

/**
 * Last Modified Indicator (T060)
 * Shows who last modified a spec and when
 */

import { User, Clock } from 'lucide-react';

interface LastModifiedProps {
  modifiedBy?: string | null;
  modifiedByEmail?: string;
  modifiedAt?: string;
  avatarUrl?: string | null;
  compact?: boolean;
}

export function LastModifiedIndicator({
  modifiedBy,
  modifiedByEmail,
  modifiedAt,
  avatarUrl,
  compact = false,
}: LastModifiedProps) {
  if (!modifiedAt && !modifiedBy) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const displayName = modifiedBy || modifiedByEmail?.split('@')[0] || 'Unknown';

  // Compact mode - inline text
  if (compact) {
    return (
      <span className="text-[var(--muted-foreground)] flex items-center gap-1" style={{ fontSize: 'var(--text-xs)' }}>
        <User className="w-3 h-3" aria-hidden="true" />
        <span>{displayName}</span>
        {modifiedAt && (
          <>
            <span className="mx-1">·</span>
            <Clock className="w-3 h-3" aria-hidden="true" />
            <span>{formatDate(modifiedAt)}</span>
          </>
        )}
      </span>
    );
  }

  // Full mode - with avatar
  return (
    <div className="flex items-center gap-2 text-[var(--muted-foreground)]" style={{ fontSize: 'var(--text-sm)' }}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`${displayName}'s avatar`}
            className="w-6 h-6 rounded-full"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-[var(--secondary)] flex items-center justify-center">
            <User className="w-3.5 h-3.5" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0">
        <p className="truncate">
          <span className="font-medium text-[var(--foreground)]">
            {displayName}
          </span>
          {modifiedAt && (
            <span className="ml-1">
              · {formatDate(modifiedAt)}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
