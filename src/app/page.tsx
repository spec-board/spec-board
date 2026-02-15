'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectStore, type RecentProject } from '@/lib/store';
import { Header } from '@/components/header';
import { RecentProjectsList } from '@/components/recent-projects-list';
import { CreateProjectModal } from '@/components/create-project-modal';

export default function Home() {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { recentProjects, loadRecentProjects } = useProjectStore();

  // Load recent projects from localStorage on mount
  useEffect(() => {
    loadRecentProjects();
  }, [loadRecentProjects]);

  // Handle selecting a recent project
  const handleSelectRecent = useCallback((recentProject: RecentProject) => {
    // Navigate using slug
    if (recentProject.slug) {
      router.push(`/projects/${recentProject.slug}`);
    }
  }, [router]);

  // Handle removing a recent project
  const handleRemoveRecent = useCallback((path: string) => {
    const { recentProjects } = useProjectStore.getState();
    const filtered = recentProjects.filter(p => p.path !== path);
    localStorage.setItem('specboard-recent-projects', JSON.stringify(filtered));
    useProjectStore.setState({ recentProjects: filtered });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Unified Header */}
      <Header
        variant="home"
        onNewProject={() => setIsCreateModalOpen(true)}
      />

      {/* Main content */}
      <main
        className="flex-1 max-w-4xl mx-auto w-full"
        style={{
          paddingLeft: 'var(--space-6)',
          paddingRight: 'var(--space-6)',
          paddingTop: 'var(--space-8)',
          paddingBottom: 'var(--space-8)',
        }}
      >
        {/* Recent Projects */}
        <RecentProjectsList
          projects={recentProjects}
          onSelect={handleSelectRecent}
          onRemove={handleRemoveRecent}
        />
      </main>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={(project) => {
          router.push(`/projects/${project.name}`);
        }}
      />
    </div>
  );
}
