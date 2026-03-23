'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FeatureDetailSkeleton } from '@/components/skeleton';
import { FeatureDetailByStage } from '@/components/feature-detail-v2';
import { ConfirmDialog } from '@/components/confirm-dialog';
import type { Feature } from '@/types';
import { deleteFeature } from '@/lib/api-client';
import { useProjectStore } from '@/lib/store';
import { toast } from 'sonner';

export default function FeaturePage() {
  const params = useParams();
  const router = useRouter();
  const projectSlug = params.name as string;
  const featureId = params.featureId as string;

  // Read from Zustand store (already populated by project-view)
  const storeProject = useProjectStore(state => state.project);
  const setProjectStore = useProjectStore(state => state.setProject);

  // Find feature from store immediately (no network request)
  const storeFeature = storeProject?.features?.find(
    (f: Feature) => f.id === featureId || f.featureId === featureId || f.name === featureId
  ) ?? null;

  const [feature, setFeature] = useState<Feature | null>(storeFeature);
  const [isLoading, setIsLoading] = useState(!storeFeature);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fetchedRef = useRef(false);

  // Background refresh: fetch latest data without blocking UI
  const loadFeature = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    setError(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(
        '/api/project/' + projectSlug + '/data?feature=' + encodeURIComponent(featureId),
        { cache: 'no-store', signal: controller.signal }
      );
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Project not found');
        }
        throw new Error('Failed to load project');
      }
      const data = await response.json();
      setProjectStore(data);

      const foundFeature = data.features.find(
        (f: Feature) => f.id === featureId || f.featureId === featureId || f.name === featureId
      );
      if (!foundFeature) {
        throw new Error('Feature not found');
      }
      setFeature(foundFeature);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Timeout -- if we have store data, just use it
        if (!feature) setError('Request timed out');
      } else if (!feature) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      clearTimeout(timeout);
      setIsLoading(false);
    }
  }, [projectSlug, featureId, feature, setProjectStore]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    if (storeFeature) {
      // Feature found in store -- show immediately, refresh in background
      setFeature(storeFeature);
      setIsLoading(false);
      loadFeature(false);
    } else {
      // No store data -- must fetch (direct URL access)
      loadFeature(true);
    }
  }, [storeFeature, loadFeature]);

  const handleClose = () => {
    router.push('/projects/' + projectSlug);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteFeature(feature!.id);
      router.push('/projects/' + projectSlug);
    } catch {
      setShowDeleteConfirm(false);
      toast.error('Failed to delete feature');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStageChange = async (toStage: string) => {
    if (!feature) return;
    try {
      const response = await fetch('/api/stage-transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureId: feature.id,
          fromStage: feature.stage,
          toStage,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        toast.error(err.error || 'Failed to transition stage');
        return;
      }
      loadFeature(false);
    } catch {
      toast.error('Failed to change stage');
    }
  };

  if (isLoading) {
    return <FeatureDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="text-[var(--muted-foreground)] mb-4">{error}</div>
          <button
            onClick={() => router.push('/projects/' + projectSlug)}
            className="btn btn-secondary btn-sm mx-auto"
          >
            Back to Project
          </button>
        </div>
      </div>
    );
  }

  if (!feature) return null;

  return (
    <>
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Feature"
        message={'Are you sure you want to delete "' + feature.name + '"? This action cannot be undone.'}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        isLoading={isDeleting}
      />
      <FeatureDetailByStage
        feature={feature}
        onClose={handleClose}
        onDelete={handleDelete}
        onStageChange={handleStageChange}
      />
    </>
  );
}
