'use client';

import { useEffect, useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { KanbanBoard } from '@/components/kanban-board';
import { ProjectInfoBubble } from '@/components/project-info-bubble';
import { Header } from '@/components/header';
import type { Project, Feature } from '@/types';
import { useProjectStore } from '@/lib/store';

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectSlug = params.name as string;

  // Zustand store for sharing project with feature detail modals
  const setProjectStore = useProjectStore(state => state.setProject);

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingConstitution, setIsGeneratingConstitution] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  const loadProject = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Unified endpoint - handles both database-first and filesystem-based projects
      const response = await fetch('/api/project/' + projectSlug + '/data', { cache: 'no-store' });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Project "' + projectSlug + '" not found. Please open it from the home page first.');
        }
        throw new Error('Failed to load project');
      }
      const data: Project & { projectId?: string } = await response.json();
      setProject(data);

      // Also set in Zustand store for feature detail modals
      setProjectStore(data);

      // Set project ID if available (for database-first projects)
      if (data.projectId) {
        setProjectId(data.projectId);
      }

      // Set project path if available (for filesystem-based projects)
      if (data.path) {
        setProjectPath(data.path);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [projectSlug]);

  // Load project on mount
  useEffect(() => {
    loadProject();
  }, [loadProject]);

  // Listen for features-updated event from KanbanBoard (smooth refresh)
  useEffect(() => {
    const handleFeaturesUpdated = () => {
      loadProject();
    };
    window.addEventListener('features-updated', handleFeaturesUpdated);
    return () => window.removeEventListener('features-updated', handleFeaturesUpdated);
  }, [loadProject]);

  // Navigate to feature detail page
  const handleFeatureClick = (feature: Feature) => {
    router.push('/projects/' + projectSlug + '/features/' + feature.id);
  };

  // Navigate to feature detail page with clarifications section
  const handleFeatureClarificationsClick = (feature: Feature) => {
    router.push('/projects/' + projectSlug + '/features/' + feature.id + '?section=clarifications');
  };

  // Update project description
  const handleDescriptionChange = useCallback(async (description: string) => {
    try {
      const response = await fetch('/api/projects/' + projectSlug, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      if (response.ok) {
        setProject(prev => prev ? { ...prev, description } : null);
      }
    } catch (error) {
      console.error('Failed to update description:', error);
    }
  }, [projectSlug]);

  // Save description and generate constitution with AI
  const handleSaveAndGenerateConstitution = useCallback(async (description: string) => {
    if (!projectId) {
      console.error('Project ID not available');
      return;
    }

    setIsGeneratingConstitution(true);
    try {
      const response = await fetch('/api/spec-workflow/constitution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          name: project?.name || projectSlug,
          description,
          regenerateWithAI: true,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        console.error('Failed to generate constitution:', err.error || err.message);
        return;
      }

      const result = await response.json();

      // Update project state with new constitution
      setProject(prev => prev ? {
        ...prev,
        description: result.description || description,
        constitution: result.constitution,
        hasConstitution: true,
      } : null);
    } catch (error) {
      console.error('Failed to generate constitution:', error);
    } finally {
      setIsGeneratingConstitution(false);
    }
  }, [projectId, project?.name, projectSlug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--muted-foreground)]">Loading project...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">{error}</div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-[var(--secondary)] rounded-lg hover:bg-[var(--secondary)]/80 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Unified Header */}
      <Header
        variant="project"
        projectName={project?.name}
        projectPath={projectPath || undefined}
        projectSlug={projectSlug}
      />

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Project Info Bubble */}
          <div className="flex justify-start">
            <ProjectInfoBubble
              constitution={project.constitution}
              hasConstitution={project.hasConstitution}
              description={project.description}
              features={project.features}
              totalClarifications={project.features.reduce((sum, f) => sum + f.totalClarifications, 0)}
              onDescriptionChange={handleDescriptionChange}
              onFeatureClick={handleFeatureClarificationsClick}
              onSaveAndGenerateConstitution={handleSaveAndGenerateConstitution}
              isGeneratingConstitution={isGeneratingConstitution}
            />
          </div>

          {/* Kanban board */}
          <div>
            <KanbanBoard
              features={project.features}
              onFeatureClick={handleFeatureClick}
              projectPath={project.path}
              projectId={projectId || undefined}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
