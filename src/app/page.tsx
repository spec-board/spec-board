'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FolderOpen, Plus } from 'lucide-react';
import { useProjectStore, type RecentProject } from '@/lib/store';
import { RecentProjectsList } from '@/components/recent-projects-list';
import { OpenProjectModal } from '@/components/open-project-modal';
import type { Project } from '@/types';

export default function Home() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { recentProjects, loadRecentProjects, addRecentProject } = useProjectStore();

  // Load recent projects from localStorage on mount
  useEffect(() => {
    loadRecentProjects();
  }, [loadRecentProjects]);

  // Handle opening a project from the modal
  const handleOpenProject = useCallback((project: Project) => {
    addRecentProject(project);
    router.push(`/projects/${encodeURIComponent(project.path)}`);
  }, [addRecentProject, router]);

  // Handle selecting a recent project
  const handleSelectRecent = useCallback(async (recentProject: RecentProject) => {
    // Fetch fresh project data before navigating
    try {
      const url = '/api/project?path=' + encodeURIComponent(recentProject.path);
      const response = await fetch(url);
      if (response.ok) {
        const project: Project = await response.json();
        addRecentProject(project);
      }
    } catch {
      // Continue even if refresh fails
    }
    router.push(`/projects/${encodeURIComponent(recentProject.path)}`);
  }, [addRecentProject, router]);

  // Handle removing a recent project
  const handleRemoveRecent = useCallback((path: string) => {
    const { recentProjects } = useProjectStore.getState();
    const filtered = recentProjects.filter(p => p.path !== path);
    // Update localStorage directly
    localStorage.setItem('specboard-recent-projects', JSON.stringify(filtered));
    useProjectStore.setState({ recentProjects: filtered });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <FolderOpen className="w-8 h-8 text-green-400" />
            <div>
              <h1 className="text-xl font-bold">SpecBoard</h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                Visual dashboard for spec-kit projects
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content - Split view */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
          {/* Left side - Recent Projects */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Projects</h2>
              <span className="text-sm text-[var(--muted-foreground)]">
                {recentProjects.length} project{recentProjects.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="min-h-[400px]">
              <RecentProjectsList
                projects={recentProjects}
                onSelect={handleSelectRecent}
                onRemove={handleRemoveRecent}
              />
            </div>
          </div>

          {/* Right side - Open Project */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold mb-4">Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-[var(--border)] rounded-lg hover:bg-[var(--secondary)] transition-colors text-[var(--foreground)]"
              >
                <Plus className="w-5 h-5" />
                Open Project
              </button>
              <p className="text-xs text-[var(--muted-foreground)] text-center">
                Browse or search for a spec-kit project folder
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Open Project Modal */}
      <OpenProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onOpen={handleOpenProject}
      />
    </div>
  );
}
