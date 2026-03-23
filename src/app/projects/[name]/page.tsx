'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Header } from '@/components/header';
import { KanbanSkeleton } from '@/components/skeleton';
import type { Project, Feature } from '@/types';
import { useProjectStore } from '@/lib/store';

const KanbanBoard = dynamic(() => import('@/components/kanban-board').then(m => ({ default: m.KanbanBoard })), {
  loading: () => <KanbanSkeleton />,
  ssr: false,
});

const ProjectInfoBubble = dynamic(() => import('@/components/project-info-bubble').then(m => ({ default: m.ProjectInfoBubble })), {
  ssr: false,
});

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
    
    // Add timeout to prevent hanging on slow/failing API calls
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    try {
      // Unified endpoint - use kanban view for lightweight query
      const response = await fetch('/api/project/' + projectSlug + '/data?view=kanban', {
        cache: 'no-store',
        signal: controller.signal,
      });
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
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. The server may be unavailable.');
      } else {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      clearTimeout(timeout);
      setIsLoading(false);
    }
  }, [projectSlug]);

  // Load project on mount
  useEffect(() => {
    loadProject();
  }, [loadProject]);

  // Navigate to feature detail page
  const handleFeatureClick = (feature: Feature) => {
    router.push('/projects/' + projectSlug + '/features/' + feature.id);
  };

  // Navigate to feature detail page with clarifications section
  const handleFeatureClarificationsClick = (feature: Feature) => {
    router.push('/projects/' + projectSlug + '/features/' + feature.id + '?section=clarifications');
  };

  // Update project name (displayName)
  const handleProjectNameChange = useCallback(async (newName: string) => {
    try {
      const response = await fetch('/api/project/' + projectSlug, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: newName }),
      });
      if (response.ok) {
        setProject(prev => prev ? { ...prev, name: newName } : null);
      }
    } catch (error) {
      console.error('Failed to update project name:', error);
    }
  }, [projectSlug]);

  // Update project description
  const handleDescriptionChange = useCallback(async (description: string) => {
    try {
      const response = await fetch('/api/project/' + projectSlug, {
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

      // Map API response to Constitution type expected by UI
      const apiConst = result.constitution;
      const mappedConstitution = apiConst ? {
        rawContent: apiConst.content || '',
        title: apiConst.title,
        description: result.description || description,
        principles: Array.isArray(apiConst.principles) ? apiConst.principles : [],
        sections: [],
        version: apiConst.version,
        ratifiedDate: apiConst.ratifiedDate,
        lastAmendedDate: apiConst.lastAmendedDate,
        versions: [],
      } : null;

      // Update project state with new constitution
      setProject(prev => prev ? {
        ...prev,
        description: result.description || description,
        constitution: mappedConstitution,
        hasConstitution: !!mappedConstitution,
      } : null);
    } catch (error) {
      console.error('Failed to generate constitution:', error);
    } finally {
      setIsGeneratingConstitution(false);
    }
  }, [projectId, project?.name, projectSlug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header variant="project" projectName="..." />
        <main className="flex-1 container mx-auto px-4 py-6">
          <KanbanSkeleton />
        </main>
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
        onProjectNameChange={handleProjectNameChange}
      />

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Project Info Row: bubble + description */}
          <div className="flex items-start gap-4">
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
            {project.description && (
              <p className="text-sm text-[var(--muted-foreground)] pt-2 line-clamp-2 flex-1 min-w-0">
                {project.description}
              </p>
            )}
          </div>

          {/* Kanban board */}
          <div>
            <KanbanBoard
              features={project.features}
              onFeatureClick={handleFeatureClick}
              projectPath={project.path}
              projectId={projectId || undefined}
              onRefresh={loadProject}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
