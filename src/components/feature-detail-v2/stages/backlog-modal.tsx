'use client';

import { useState, useCallback } from 'react';
import { FileText, ArrowRight, Loader2 } from 'lucide-react';
import { BaseModal } from '../base/base-modal';
import type { BaseModalProps } from '../base/types';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { useProjectStore } from '@/lib/store';
import { toast } from 'sonner';
import { getStageConfig } from '../base/types';

export function BacklogModal({ feature, onClose, onStageChange, onDelete }: BaseModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  // Get project from store for API calls
  const project = useProjectStore(state => state.project);
  const projectId = project?.projectId;

  // Handle generate spec (transition to specs stage)
  const handleGenerateSpec = useCallback(async () => {
    if (!projectId) {
      toast.error('Project not found');
      return;
    }

    setIsGenerating(true);
    try {
      // Call the specify API to generate spec + clarifications
      const response = await fetch('/api/spec-workflow/specify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          featureId: feature.id,
          name: feature.name,
          description: feature.description || '',
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate specification');
      }

      toast.success('Specification generated');
      // Close this modal - parent will refresh and open new modal
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate specification');
    } finally {
      setIsGenerating(false);
    }
  }, [projectId, feature, onClose]);

  const stageConfig = getStageConfig('specs');

  return (
    <BaseModal
      feature={feature}
      onClose={onClose}
      onStageChange={onStageChange}
      onDelete={onDelete}
      headerActions={
        <button
          onClick={handleGenerateSpec}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
        >
          {isGenerating && (
            <Loader2 className="w-4 h-4 animate-spin" />
          )}
          Generate Spec
        </button>
      }
      showNavigation={false}
    >
      <div className="flex h-full">
        {/* Left: Feature Description */}
        <div className="w-[40%] border-r border-[var(--border)] p-6 overflow-y-auto">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
            Feature Description
          </h3>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {feature.description ? (
              <p className="text-[var(--foreground)]">{feature.description}</p>
            ) : (
              <p className="text-[var(--muted-foreground)] italic">
                No description provided.
              </p>
            )}
          </div>
        </div>

        {/* Right: Empty state / Next step */}
        <div className="w-[60%] p-6 overflow-y-auto">
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              Ready to Create Specification
            </h3>
            <p className="text-sm text-[var(--muted-foreground)] max-w-md mb-6">
              Click "Generate Spec" to create a detailed specification based on this feature description. The system will also generate clarification questions to help define the requirements.
            </p>
            <button
              onClick={handleGenerateSpec}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
            >
              {isGenerating && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Generate Spec
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
