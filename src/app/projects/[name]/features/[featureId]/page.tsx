'use client';

import { useEffect, useCallback, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { FeatureDetailV2 } from '@/components/feature-detail-v2';
import { ArrowLeft } from 'lucide-react';
import type { Project, Feature, Constitution } from '@/types';
import { deleteFeature } from '@/lib/api-client';

export default function FeaturePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectSlug = params.name as string;
  const featureId = params.featureId as string;

  const [feature, setFeature] = useState<Feature | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [hasConstitution, setHasConstitution] = useState(false);
  const [constitution, setConstitution] = useState<Constitution | null>(null);

  const loadFeature = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use unified endpoint to maintain consistency with project page
      // This ensures feature IDs match (database or filesystem)
      const response = await fetch('/api/project/' + projectSlug + '/data', { cache: 'no-store' });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Project "' + projectSlug + '" not found. Please open it from the home page first.');
        }
        throw new Error('Failed to load project');
      }
      const data = await response.json();

      // For database-first projects, we need to load full feature content from filesystem
      const projectPath = data.path;

      // If we have a filesystem path, load full content
      if (projectPath && data.source === 'database') {
        const fullResponse = await fetch('/api/project?path=' + encodeURIComponent(projectPath), { cache: 'no-store' });
        if (fullResponse.ok) {
          const fullData: Project = await fullResponse.json();
          // Merge full content into database features
          const featuresWithContent = data.features.map((f: Feature) => {
            const matching = fullData.features.find(ff => ff.id === f.id || ff.id === f.name);
            if (matching) {
              return { ...f, ...matching };
            }
            return f;
          });
          data.features = featuresWithContent;
          data.hasConstitution = fullData.hasConstitution;
          data.constitution = fullData.constitution;
        }
      }

      setProjectPath(projectPath || '');

      // Find the specific feature
      const foundFeature = data.features.find((f: Feature) => f.id === featureId || f.name === featureId);
      if (!foundFeature) {
        throw new Error('Feature "' + featureId + '" not found');
      }
      setFeature(foundFeature);
      setHasConstitution(data.hasConstitution);
      setConstitution(data.constitution);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [projectSlug, featureId]);

  // Load feature on mount
  useEffect(() => {
    loadFeature();
  }, [loadFeature]);

  // Set up SSE for real-time updates
  useEffect(() => {
    if (!projectPath) return;

    const eventSource = new EventSource(
      `/api/watch?path=${encodeURIComponent(projectPath)}`
    );

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'update' && message.data) {
          const updatedFeature = message.data.features.find(
            (f: Feature) => f.id === featureId
          );
          if (updatedFeature) {
            setFeature(updatedFeature);
          }
        }
      } catch (err) {
        console.error('Error parsing SSE message:', err);
      }
    };

    eventSource.onerror = () => {
      console.error('SSE connection error');
    };

    return () => {
      eventSource.close();
    };
  }, [projectPath, featureId]);

  const handleClose = () => {
    router.push('/projects/' + projectSlug);
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${feature?.name}"?`)) {
      return;
    }
    try {
      await deleteFeature(feature!.id);
      router.push('/projects/' + projectSlug);
    } catch (err) {
      console.error('Error deleting feature:', err);
      alert('Failed to delete feature');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--muted-foreground)]">Loading feature...</div>
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

  if (!feature) {
    return null;
  }

  // Always use FeatureDetailV2 - legacy UI has been removed
  return (
    <FeatureDetailV2
      feature={feature}
      onClose={handleClose}
      onDelete={handleDelete}
    />
  );
}
