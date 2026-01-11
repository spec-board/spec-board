'use client';

/**
 * Pending Badge Component (T078)
 * Shows a badge with the count of pending changes or conflicts
 * Used in dashboard to indicate items needing attention
 */

import { useState, useEffect } from 'react';
import { AlertCircle, Clock, WifiOff } from 'lucide-react';

interface PendingBadgeProps {
  /** Number of pending conflicts */
  conflictCount?: number;
  /** Number of pending local changes (not yet pushed) */
  pendingChanges?: number;
  /** Whether the user is currently offline */
  isOffline?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show detailed breakdown on hover */
  showTooltip?: boolean;
  /** Click handler */
  onClick?: () => void;
}

export function PendingBadge({
  conflictCount = 0,
  pendingChanges = 0,
  isOffline = false,
  size = 'md',
  showTooltip = true,
  onClick,
}: PendingBadgeProps) {
  const totalPending = conflictCount + pendingChanges;

  // Don't render if nothing pending and not offline
  if (totalPending === 0 && !isOffline) {
    return null;
  }

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-sm px-2 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  // Determine badge color based on priority
  // Offline = orange, Conflicts = red/yellow, Pending = blue
  const getBadgeStyle = () => {
    if (isOffline) {
      return 'bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400';
    }
    if (conflictCount > 0) {
      return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400';
    }
    return 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400';
  };

  // Build tooltip text
  const getTooltipText = () => {
    const parts: string[] = [];
    if (isOffline) {
      parts.push('You are offline');
    }
    if (conflictCount > 0) {
      parts.push(`${conflictCount} conflict${conflictCount > 1 ? 's' : ''} to resolve`);
    }
    if (pendingChanges > 0) {
      parts.push(`${pendingChanges} change${pendingChanges > 1 ? 's' : ''} to push`);
    }
    return parts.join(' • ');
  };

  // Get the primary icon
  const getIcon = () => {
    if (isOffline) {
      return <WifiOff className={iconSizes[size]} />;
    }
    if (conflictCount > 0) {
      return <AlertCircle className={iconSizes[size]} />;
    }
    return <Clock className={iconSizes[size]} />;
  };

  // Get the label text
  const getLabel = () => {
    if (isOffline && totalPending === 0) {
      return 'Offline';
    }
    if (isOffline) {
      return `Offline • ${totalPending}`;
    }
    if (conflictCount > 0 && pendingChanges > 0) {
      return `${conflictCount} conflicts • ${pendingChanges} pending`;
    }
    if (conflictCount > 0) {
      return `${conflictCount} conflict${conflictCount > 1 ? 's' : ''}`;
    }
    return `${pendingChanges} pending`;
  };

  const badge = (
    <div
      className={`
        inline-flex items-center rounded-full border font-medium
        ${sizeClasses[size]}
        ${getBadgeStyle()}
        ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {getIcon()}
      <span>{getLabel()}</span>
    </div>
  );

  if (showTooltip) {
    return (
      <div className="relative group">
        {badge}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[var(--card)] border border-[var(--border)] rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          {getTooltipText()}
        </div>
      </div>
    );
  }

  return badge;
}

/**
 * Hook to track offline status
 * Can be used independently of the badge component
 */
export function useOfflineStatus() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check initial state
    if (typeof navigator !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOffline;
}
