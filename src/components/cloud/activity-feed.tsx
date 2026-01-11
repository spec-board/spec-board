'use client';

/**
 * Activity Feed Component (T062)
 * Shows recent sync activity for a cloud project
 */

import { useState, useEffect } from 'react';
import {
  Activity,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw,
  User,
} from 'lucide-react';
import type { SyncEventType } from '@/types';

interface SyncEvent {
  id: string;
  cloudProjectId: string;
  userId: string;
  eventType: SyncEventType;
  featuresAffected: string[];
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

interface ActivityFeedProps {
  projectId: string;
  limit?: number;
  showHeader?: boolean;
  onEventClick?: (event: SyncEvent) => void;
}

export function ActivityFeed({
  projectId,
  limit = 10,
  showHeader = true,
  onEventClick,
}: ActivityFeedProps) {
  const [events, setEvents] = useState<SyncEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const fetchActivity = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/cloud-projects/${projectId}/activity?limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch activity');
      }

      const data = await response.json();
      setEvents(data.events || []);
      setHasMore(data.hasMore || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [projectId, limit]);

  const getEventIcon = (eventType: SyncEventType) => {
    switch (eventType) {
      case 'PUSH':
        return <Upload className="w-4 h-4 text-blue-500" />;
      case 'PULL':
        return <Download className="w-4 h-4 text-emerald-500" />;
      case 'CONFLICT_DETECTED':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'CONFLICT_RESOLVED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Activity className="w-4 h-4 text-[var(--muted-foreground)]" />;
    }
  };

  const getEventLabel = (eventType: SyncEventType) => {
    switch (eventType) {
      case 'PUSH':
        return 'pushed';
      case 'PULL':
        return 'pulled';
      case 'CONFLICT_DETECTED':
        return 'detected conflict in';
      case 'CONFLICT_RESOLVED':
        return 'resolved conflict in';
      default:
        return 'updated';
    }
  };

  const formatTime = (dateString: string) => {
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
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[var(--muted-foreground)]" />
            <h3 className="font-medium">Recent Activity</h3>
          </div>
          <button
            onClick={fetchActivity}
            className="p-1.5 hover:bg-[var(--secondary)] rounded transition-colors"
            title="Refresh activity"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Events List */}
      {events.length === 0 ? (
        <div className="text-center py-8 text-[var(--muted-foreground)]">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No activity yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className={`flex items-start gap-3 p-3 bg-[var(--secondary)] rounded-lg ${
                onEventClick ? 'cursor-pointer hover:bg-[var(--secondary)]/80' : ''
              }`}
              onClick={() => onEventClick?.(event)}
            >
              {/* Avatar */}
              <div className="flex-shrink-0 mt-0.5">
                {event.user.avatarUrl ? (
                  <img
                    src={event.user.avatarUrl}
                    alt={event.user.name || event.user.email}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[var(--card)] flex items-center justify-center">
                    <User className="w-4 h-4 text-[var(--muted-foreground)]" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">
                    {event.user.name || event.user.email.split('@')[0]}
                  </span>
                  {getEventIcon(event.eventType)}
                  <span className="text-[var(--muted-foreground)]">
                    {getEventLabel(event.eventType)}
                  </span>
                </div>

                {/* Features affected */}
                {event.featuresAffected.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {event.featuresAffected.slice(0, 3).map((feature) => (
                      <span
                        key={feature}
                        className="text-xs px-1.5 py-0.5 bg-[var(--card)] rounded"
                      >
                        {feature}
                      </span>
                    ))}
                    {event.featuresAffected.length > 3 && (
                      <span className="text-xs text-[var(--muted-foreground)]">
                        +{event.featuresAffected.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Time */}
                <p className="text-xs text-[var(--muted-foreground)] mt-1">
                  {formatTime(event.createdAt)}
                </p>
              </div>
            </div>
          ))}

          {/* Load more indicator */}
          {hasMore && (
            <p className="text-center text-sm text-[var(--muted-foreground)]">
              More activity available...
            </p>
          )}
        </div>
      )}
    </div>
  );
}
