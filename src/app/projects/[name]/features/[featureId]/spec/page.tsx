'use client';

import { useEffect, useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { SpecViewer } from '@/components/spec-viewer';
import { PriorityBadge } from '@/components/priority-badge';
import { cn, getStageColor, getStageLabel } from '@/lib/utils';
import type { Feature } from '@/types';

export default function SpecPage() {
  const params = useParams();
  const router = useRouter();
  const projectSlug = params.name as string;
  const featureId = params.featureId as string;

  const [feature, setFeature] = useState<Feature | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFeature = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use unified database-first endpoint
      const response = await fetch('/api/project/' + projectSlug + '/data', { cache: 'no-store' });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Project "' + projectSlug + '" not found.');
        }
        throw new Error('Failed to load project');
      }
      const data = await response.json();

      // Find the feature - match by id, featureId, or name
      const foundFeature = data.features.find((f: Feature) =>
        f.id === featureId || f.featureId === featureId || f.name === featureId
      );
      if (!foundFeature) {
        throw new Error('Feature "' + featureId + '" not found');
      }
      setFeature(foundFeature);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [projectSlug, featureId]);

  useEffect(() => {
    loadFeature();
  }, [loadFeature]);

  // Get highest priority from user stories
  const highestPriority = feature?.userStories?.length
    ? feature.userStories.reduce((highest, story) => {
        const priorityOrder = { P1: 1, P2: 2, P3: 3 };
        return priorityOrder[story.priority as keyof typeof priorityOrder] < priorityOrder[highest as keyof typeof priorityOrder] ? story.priority : highest;
      }, feature.userStories[0].priority)
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--muted-foreground)]">Loading spec...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">{error}</div>
          <button
            onClick={() => router.push('/projects/' + projectSlug)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--secondary)] rounded-lg hover:bg-[var(--secondary)]/80 transition-colors mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Project
          </button>
        </div>
      </div>
    );
  }

  if (!feature) return null;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button
            onClick={() => router.push('/projects/' + projectSlug + '/features/' + featureId)}
            className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Feature
          </button>

          <div className="flex items-center gap-3 mb-2">
            <span className={cn(
              'text-xs px-2 py-0.5 rounded border',
              getStageColor(feature.stage)
            )}>
              {getStageLabel(feature.stage)}
            </span>
            {highestPriority && <PriorityBadge priority={highestPriority as 'P1' | 'P2' | 'P3'} />}
          </div>

          <h1 className="text-2xl font-semibold capitalize">{feature.name}</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Specification</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <SpecViewer content={feature.specContent} />
      </div>
    </div>
  );
}
