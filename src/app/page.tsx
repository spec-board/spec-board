'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '@/lib/store';
import { Header } from '@/components/header';
import { ProjectListSkeleton } from '@/components/skeleton';
import { ProjectList } from '@/components/project-list';
import { CreateProjectModal } from '@/components/create-project-modal';
import { DeleteProjectModal } from '@/components/delete-project-modal';

interface DbProject {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  filePath: string | null;
  isCloud: boolean;
  createdAt: string;
  updatedAt: string;
  featureCount: number;
}

export default function Home() {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projects, setProjects] = useState<DbProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteProject, setDeleteProject] = useState<DbProject | null>(null);

  // Fetch projects from database on mount
  const fetchProjects = useCallback(async () => {
    // Add timeout to prevent hanging on slow/failing API calls
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    try {
      const response = await fetch('/api/projects', { signal: controller.signal });
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      // Silently handle errors - show empty state
      console.error('Failed to fetch projects:', error);
    } finally {
      clearTimeout(timeout);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Handle selecting a project
  const handleSelectProject = useCallback((project: DbProject) => {
    // Navigate using slug (name field)
    router.push(`/projects/${project.name}`);
  }, [router]);

  // Handle delete - show confirmation modal
  const handleDeleteClick = useCallback((project: DbProject) => {
    setDeleteProject(project);
  }, []);

  // Confirm deletion - delete from database
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteProject) return;

    try {
      const response = await fetch(`/api/project/${deleteProject.name}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local list
        setProjects(prev => prev.filter(p => p.id !== deleteProject.id));
      } else {
        console.error('Failed to delete project');
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
    } finally {
      setDeleteProject(null);
    }
  }, [deleteProject]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Unified Header */}
      <Header
        variant="home"
        onNewProject={() => setIsCreateModalOpen(true)}
      />

      {/* Main content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8">
        {isLoading ? (
          <ProjectListSkeleton />
        ) : (
          <ProjectList
            projects={projects}
            onSelect={handleSelectProject}
            onDelete={handleDeleteClick}
            onCreateProject={() => setIsCreateModalOpen(true)}
          />
        )}
      </main>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={(project) => {
          router.push(`/projects/${project.name}`);
        }}
      />

      {/* Delete Confirmation Modal */}
      {deleteProject && (
        <DeleteProjectModal
          isOpen={true}
          projectName={deleteProject.displayName}
          onClose={() => setDeleteProject(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
