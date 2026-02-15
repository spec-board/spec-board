'use client';

import { useEffect, useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { KanbanBoard } from '@/components/kanban-board';
import { ProjectInfoBubble } from '@/components/project-info-bubble';
import { Header } from '@/components/header';
import { useProjectStore } from '@/lib/store';
import type { Project, Feature } from '@/types';

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectSlug = params.name as string;
  const { addRecentProject } = useProjectStore();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

      // Set project ID if available (for database-first projects)
      if (data.projectId) {
        setProjectId(data.projectId);
      }

      // Set project path if available (for filesystem-based projects)
      if (data.path) {
        setProjectPath(data.path);
      }

      // Update recent projects cache
      addRecentProject(data, projectSlug);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [projectSlug, addRecentProject]);

  // Load project on mount
  useEffect(() => {
    loadProject();
  }, [loadProject]);

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
          setProject(message.data);
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
  }, [projectPath]);

  // Navigate to feature detail page
  const handleFeatureClick = (feature: Feature) => {
    router.push('/projects/' + projectSlug + '/features/' + feature.id);
  };

  // Navigate to feature detail page with clarifications section
  const handleFeatureClarificationsClick = (feature: Feature) => {
    router.push('/projects/' + projectSlug + '/features/' + feature.id + '?section=clarifications');
  };

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
      />

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Project Info Bubble */}
          <div className="flex justify-start">
            <ProjectInfoBubble
              constitution={project.constitution}
              hasConstitution={project.hasConstitution}
              features={project.features}
              totalClarifications={project.features.reduce((sum, f) => sum + f.totalClarifications, 0)}
              onFeatureClick={handleFeatureClarificationsClick}
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
