'use client';

import { useEffect, useState } from 'react';
import type { SessionStatus, ResourceMetrics } from '@/types/drivers';

interface SessionStatusProps {
  sessionId: string | null;
}

interface StatusData {
  status: SessionStatus;
  metrics: ResourceMetrics;
  timestamp: string;
}

/**
 * Session Status Component
 * Displays real-time connection status and resource metrics
 */
export function SessionStatusIndicator({ sessionId }: SessionStatusProps) {
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatusData(null);
      setError(null);
      return;
    }

    // Connect to SSE endpoint for status updates
    const eventSource = new EventSource(`/api/drivers/status?sessionId=${sessionId}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'error') {
          setError(data.error);
        } else if (data.type === 'status') {
          setStatusData({
            status: data.status,
            metrics: data.metrics,
            timestamp: data.timestamp,
          });
          setError(null);
        }
      } catch (err) {
        console.error('Failed to parse status update:', err);
      }
    };

    eventSource.onerror = () => {
      setError('Connection to status stream lost');
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [sessionId]);

  if (!sessionId) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded">
        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
        <span className="text-sm text-gray-600">Not connected</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-100 rounded">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
        <span className="text-sm text-red-700">{error}</span>
      </div>
    );
  }

  if (!statusData) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 rounded">
        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
        <span className="text-sm text-blue-700">Connecting...</span>
      </div>
    );
  }

  const getStatusColor = (status: SessionStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-blue-500 animate-pulse';
      case 'disconnected':
        return 'bg-gray-400';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusBgColor = (status: SessionStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-100';
      case 'connecting':
        return 'bg-blue-100';
      case 'disconnected':
        return 'bg-gray-100';
      case 'error':
        return 'bg-red-100';
      default:
        return 'bg-gray-100';
    }
  };

  const getStatusTextColor = (status: SessionStatus) => {
    switch (status) {
      case 'active':
        return 'text-green-700';
      case 'connecting':
        return 'text-blue-700';
      case 'disconnected':
        return 'text-gray-600';
      case 'error':
        return 'text-red-700';
      default:
        return 'text-gray-600';
    }
  };

  const formatElapsedTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className={`flex items-center gap-4 px-3 py-2 rounded ${getStatusBgColor(statusData.status)}`}>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${getStatusColor(statusData.status)}`}></div>
        <span className={`text-sm font-medium ${getStatusTextColor(statusData.status)}`}>
          {statusData.status.charAt(0).toUpperCase() + statusData.status.slice(1)}
        </span>
      </div>

      {statusData.metrics && (
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span>⏱️ {formatElapsedTime(statusData.metrics.elapsedSeconds)}</span>
          {statusData.metrics.cpuPercent !== undefined && (
            <span>CPU: {statusData.metrics.cpuPercent.toFixed(1)}%</span>
          )}
          {statusData.metrics.memoryMB !== undefined && (
            <span>RAM: {statusData.metrics.memoryMB.toFixed(0)}MB</span>
          )}
        </div>
      )}
    </div>
  );
}
