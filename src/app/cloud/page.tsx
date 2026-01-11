'use client';

/**
 * Cloud Projects List Page (T032)
 * Dashboard for managing cloud-synced projects
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Cloud,
  Plus,
  ArrowLeft,
  Users,
  FileText,
  Link as LinkIcon,
  Loader2,
  LogIn
} from 'lucide-react';
import Image from 'next/image';
import { ThemeButton } from '@/components/theme-button';
import { NewProjectForm } from '@/components/cloud/new-project-form';
import { LinkCodeGenerator } from '@/components/cloud/link-code-generator';
import { ConnectProjectModal } from '@/components/cloud/connect-project-modal';

interface CloudProject {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
  members: Array<{
    userId: string;
    role: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
  _count: {
    specs: number;
  };
}

export default function CloudProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<CloudProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showLinkGenerator, setShowLinkGenerator] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/cloud-projects');
      if (response.status === 401) {
        setError('Please sign in to view cloud projects');
        setProjects([]);
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleProjectCreated = (project: CloudProject) => {
    setProjects(prev => [project, ...prev]);
    setShowNewForm(false);
  };

  const handleProjectConnected = () => {
    fetchProjects();
    setShowConnectModal(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="p-2 hover:bg-[var(--secondary)] rounded-lg transition-colors"
                title="Back to Home"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Image
                src="/images/specboard-logo.svg"
                alt="SpecBoard Logo"
                width={32}
                height={32}
                className="rounded"
              />
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-blue-500" />
                  Cloud Projects
                </h1>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Sync and collaborate on specifications
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        {/* Actions bar */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Your Projects</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConnectModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--secondary)] transition-colors"
            >
              <LinkIcon className="w-4 h-4" />
              Join with Code
            </button>
            <button
              onClick={() => setShowNewForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-500">{error}</p>
            {error.includes('sign in') && (
              <button
                onClick={() => router.push('/auth/login')}
                className="mt-2 flex items-center gap-2 text-sm text-blue-500 hover:underline"
              >
                <LogIn className="w-4 h-4" />
                Go to Sign In
              </button>
            )}
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--muted-foreground)]" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && projects.length === 0 && (
          <div className="text-center py-12">
            <Cloud className="w-12 h-12 mx-auto mb-4 text-[var(--muted-foreground)]" />
            <h3 className="text-lg font-medium mb-2">No cloud projects yet</h3>
            <p className="text-[var(--muted-foreground)] mb-4">
              Create a new project or join an existing one with a link code.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowConnectModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--secondary)] transition-colors"
              >
                <LinkIcon className="w-4 h-4" />
                Join with Code
              </button>
              <button
                onClick={() => setShowNewForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Project
              </button>
            </div>
          </div>
        )}

        {/* Projects grid */}
        {!isLoading && projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="p-4 border border-[var(--border)] rounded-lg hover:border-blue-500/50 transition-colors cursor-pointer group"
                onClick={() => router.push(`/cloud/${project.slug}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium group-hover:text-blue-500 transition-colors">
                    {project.name}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowLinkGenerator(project.id);
                    }}
                    className="p-1.5 hover:bg-[var(--secondary)] rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="Generate invite link"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </button>
                </div>
                {project.description && (
                  <p className="text-sm text-[var(--muted-foreground)] mb-3 line-clamp-2">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    {project._count.specs} specs
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {project.members.length} members
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)]">
                  Updated {formatDate(project.updatedAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Project Form Modal */}
      {showNewForm && (
        <NewProjectForm
          onClose={() => setShowNewForm(false)}
          onCreated={handleProjectCreated}
        />
      )}

      {/* Link Code Generator Modal */}
      {showLinkGenerator && (
        <LinkCodeGenerator
          projectId={showLinkGenerator}
          onClose={() => setShowLinkGenerator(null)}
        />
      )}

      {/* Connect Project Modal */}
      {showConnectModal && (
        <ConnectProjectModal
          onClose={() => setShowConnectModal(false)}
          onConnected={handleProjectConnected}
        />
      )}
    </div>
  );
}
