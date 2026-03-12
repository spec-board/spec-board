'use client';

import { useEffect, useCallback, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowLeft } from 'lucide-react';
import { FeatureDetailSkeleton } from '@/components/skeleton';
import type { Project, Feature, Constitution } from '@/types';
import { deleteFeature } from '@/lib/api-client';
import { useProjectStore } from '@/lib/store';

const FeatureDetailByStage = dynamic(
  () => import('@/components/feature-detail-v2').then(m => ({ default: m.FeatureDetailByStage })),
  { loading: () => <FeatureDetailSkeleton />, ssr: false }
);

const ConfirmDialog = dynamic(
  () => import('@/components/confirm-dialog').then(m => ({ default: m.ConfirmDialog })),
  { ssr: false }
);

export default function FeaturePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectSlug = params.name as string;
  const featureId = params.featureId as string;

  // Zustand store for sharing project with feature detail modals
  const setProjectStore = useProjectStore(state => state.setProject);

  const [feature, setFeature] = useState<Feature | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasConstitution, setHasConstitution] = useState(false);
  const [constitution, setConstitution] = useState<Constitution | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadFeature = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use unified endpoint - database-first only
      const response = await fetch('/api/project/' + projectSlug + '/data', { cache: 'no-store' });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Project "' + projectSlug + '" not found. Please open it from the home page first.');
        }
        throw new Error('Failed to load project');
      }
      const data = await response.json();

      // Set project in Zustand store for feature detail modals
      setProjectStore(data);

      // Find the specific feature
      const foundFeature = data.features.find((f: Feature) => f.id === featureId || f.featureId === featureId || f.name === featureId);
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

  const handleClose = () => {
    router.push('/projects/' + projectSlug);
  };

  // Trigger delete confirmation
  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  // Actual delete after confirmation
  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteFeature(feature!.id);
      router.push('/projects/' + projectSlug);
    } catch (err) {
      console.error('Error deleting feature:', err);
      setShowDeleteConfirm(false);
      alert('Failed to delete feature');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle stage transition
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
        alert(err.error || 'Failed to transition stage');
        return;
      }
      // Reload to get updated feature data
      loadFeature();
    } catch (err) {
      console.error('Error changing stage:', err);
      alert('Failed to change stage');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  if (isLoading) {
    return <FeatureDetailSkeleton />;
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
    <>
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Feature"
        message={`Are you sure you want to delete "${feature?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
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
