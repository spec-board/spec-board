'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Settings, Github } from 'lucide-react';
import Image from 'next/image';
import { useProjectStore, type RecentProject } from '@/lib/store';
import { ThemeButton } from '@/components/theme-button';
import { RecentProjectsList } from '@/components/recent-projects-list';
import { OpenProjectModal } from '@/components/open-project-modal';
import type { Project } from '@/types';

// Database project type returned from registration API
interface DbProject {
  id: string;
  name: string; // This is the slug used in URLs
  displayName: string;
  filePath: string;
}

export default function Home() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { recentProjects, loadRecentProjects, addRecentProject } = useProjectStore();

  // Load recent projects from localStorage on mount
  useEffect(() => {
    loadRecentProjects();
  }, [loadRecentProjects]);

  // Register project in database and get slug for URL
  const registerProject = useCallback(async (filePath: string): Promise<DbProject | null> => {
    try {
      const response = await fetch('/api/projects/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath }),
      });
      if (response.ok) {
        return await response.json();
      }
      console.error('Failed to register project:', await response.text());
      return null;
    } catch (error) {
      console.error('Error registering project:', error);
      return null;
    }
  }, []);

  // Handle opening a project from the modal
  const handleOpenProject = useCallback(async (project: Project) => {
    // Register project to get slug
    const dbProject = await registerProject(project.path);
    if (dbProject) {
      addRecentProject(project, dbProject.name);
      router.push(`/projects/${dbProject.name}`);
    } else {
      // Fallback to path-based URL if registration fails
      addRecentProject(project);
      router.push(`/projects/${encodeURIComponent(project.path)}`);
    }
  }, [addRecentProject, registerProject, router]);

  // Handle selecting a recent project
  const handleSelectRecent = useCallback(async (recentProject: RecentProject) => {
    // If we have a slug, use it directly
    if (recentProject.slug) {
      router.push(`/projects/${recentProject.slug}`);
      return;
    }

    // Otherwise, register to get slug
    const dbProject = await registerProject(recentProject.path);
    if (dbProject) {
      // Update recent project with slug
      const { recentProjects } = useProjectStore.getState();
      const updated = recentProjects.map(p =>
        p.path === recentProject.path ? { ...p, slug: dbProject.name } : p
      );
      localStorage.setItem('specboard-recent-projects', JSON.stringify(updated));
      useProjectStore.setState({ recentProjects: updated });
      router.push(`/projects/${dbProject.name}`);
    } else {
      // Fallback to path-based URL
      router.push(`/projects/${encodeURIComponent(recentProject.path)}`);
    }
  }, [registerProject, router]);

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
        <div 
          className="max-w-6xl mx-auto"
          style={{
            paddingLeft: 'var(--space-6)',
            paddingRight: 'var(--space-6)',
            paddingTop: 'var(--space-4)',
            paddingBottom: 'var(--space-4)',
          }}
        >
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center"
              style={{ gap: 'var(--space-3)' }}
            >
              <Image
                src="/images/specboard-logo.svg"
                alt="SpecBoard Logo"
                width={32}
                height={32}
                className="rounded"
              />
              <div>
                <h1 
                  className="font-bold"
                  style={{ fontSize: 'var(--text-xl)' }}
                >
                  <span className="text-blue-500">Spec</span>
                  <span>Board</span>
                </h1>
                <p 
                  className="text-[var(--muted-foreground)]"
                  style={{ fontSize: 'var(--text-sm)' }}
                >
                  Visual dashboard for spec-kit projects
                </p>
              </div>
            </div>
            <div 
              className="flex items-center"
              style={{ gap: 'var(--space-2)' }}
            >
              <ThemeButton />
              <a
                href="https://github.com/paulpham157/spec-board"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:bg-[var(--secondary)] rounded-lg transition-colors"
                style={{
                  padding: 'var(--space-2)',
                  borderRadius: 'var(--radius)',
                  transitionDuration: 'var(--transition-base)',
                }}
                title="GitHub Repository"
              >
                <Github className="w-5 h-5" />
              </a>
              <button
                onClick={() => router.push('/settings')}
                className="hover:bg-[var(--secondary)] rounded-lg transition-colors"
                style={{
                  padding: 'var(--space-2)',
                  borderRadius: 'var(--radius)',
                  transitionDuration: 'var(--transition-base)',
                }}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content - Split view */}
      <main 
        className="flex-1 max-w-6xl mx-auto w-full"
        style={{
          paddingLeft: 'var(--space-6)',
          paddingRight: 'var(--space-6)',
          paddingTop: 'var(--space-8)',
          paddingBottom: 'var(--space-8)',
        }}
      >
        <div 
          className="grid grid-cols-1 lg:grid-cols-3 h-full"
          style={{ gap: 'var(--space-8)' }}
        >
          {/* Left side - Recent Projects */}
          <div className="lg:col-span-2">
            <div 
              className="flex items-center justify-between"
              style={{ marginBottom: 'var(--space-4)' }}
            >
              <h2 
                className="font-semibold"
                style={{ fontSize: 'var(--text-lg)' }}
              >
                Recent Projects
              </h2>
              <span 
                className="text-[var(--muted-foreground)]"
                style={{ fontSize: 'var(--text-sm)' }}
              >
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
            <h2 
              className="font-semibold"
              style={{ 
                fontSize: 'var(--text-lg)',
                marginBottom: 'var(--space-4)',
              }}
            >
              Actions
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full flex items-center justify-center border border-[var(--border)] rounded-lg hover:bg-[var(--secondary)] transition-colors text-[var(--foreground)]"
                style={{
                  gap: 'var(--space-2)',
                  paddingLeft: 'var(--space-4)',
                  paddingRight: 'var(--space-4)',
                  paddingTop: 'var(--space-3)',
                  paddingBottom: 'var(--space-3)',
                  borderRadius: 'var(--radius)',
                  transitionDuration: 'var(--transition-base)',
                }}
              >
                <Plus className="w-5 h-5" />
                Open Project
              </button>
              <p 
                className="text-[var(--muted-foreground)] text-center"
                style={{ fontSize: 'var(--text-xs)' }}
              >
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
