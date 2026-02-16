'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FolderOpen, Github, Settings, Plus, Scale } from 'lucide-react';
import { ThemeButton } from '@/components/theme-button';

interface HeaderProps {
  variant: 'home' | 'project';
  projectName?: string;
  projectPath?: string;
  projectSlug?: string;
  onNewProject?: () => void;
}

export function Header({ variant, projectName, projectPath, projectSlug, onNewProject }: HeaderProps) {
  const router = useRouter();

  return (
    <header className="border-b border-[var(--border)] bg-[var(--card)]">
      <div
        className="container mx-auto"
        style={{
          paddingLeft: 'var(--space-6)',
          paddingRight: 'var(--space-6)',
          paddingTop: 'var(--space-4)',
          paddingBottom: 'var(--space-4)',
        }}
      >
        <div className="flex items-center justify-between">
          {/* Left side - Logo and title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              title="Home"
            >
              <Image
                src="/images/specboard-logo.svg"
                alt="SpecBoard Logo"
                width={variant === 'home' ? 32 : 28}
                height={variant === 'home' ? 32 : 28}
                className="rounded"
              />
              <div>
                <h1
                  className="font-bold"
                  style={{ fontSize: variant === 'home' ? 'var(--text-xl)' : 'var(--text-xl)' }}
                >
                  <span className="text-blue-500">Spec</span>
                  <span>Board</span>
                </h1>
                {variant === 'home' && (
                  <p
                    className="text-[var(--muted-foreground)]"
                    style={{ fontSize: 'var(--text-sm)' }}
                  >
                    Task management powered by database
                  </p>
                )}
              </div>
            </button>

            {/* Project context for project pages */}
            {variant === 'project' && projectName && (
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <FolderOpen className="w-4 h-4 flex-shrink-0" />
                <div className="flex flex-col">
                  <span>{projectName}</span>
                  {projectPath && (
                    <span className="text-xs opacity-60 truncate max-w-md">
                      {projectPath}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right side - Actions */}
          <div
            className="flex items-center"
            style={{ gap: 'var(--space-2)' }}
          >
            {variant === 'home' && onNewProject && (
              <button
                onClick={onNewProject}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                New
              </button>
            )}
            <ThemeButton />
            {variant === 'project' && projectSlug && (
              <a
                href={`/projects/${projectSlug}/constitution`}
                className="hover:bg-[var(--secondary)] rounded-lg transition-colors flex items-center justify-center"
                style={{
                  padding: 'var(--space-2)',
                  borderRadius: 'var(--radius)',
                }}
                title="Constitution"
              >
                <Scale className="w-5 h-5" />
              </a>
            )}
            <a
              href="https://github.com/paulpham157/spec-board"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:bg-[var(--secondary)] rounded-lg transition-colors flex items-center justify-center"
              style={{
                padding: 'var(--space-2)',
                borderRadius: 'var(--radius)',
              }}
              title="GitHub Repository"
            >
              <Github className="w-5 h-5" />
            </a>
            <button
              onClick={() => router.push('/settings')}
              className="hover:bg-[var(--secondary)] rounded-lg transition-colors flex items-center justify-center"
              style={{
                padding: 'var(--space-2)',
                borderRadius: 'var(--radius)',
              }}
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
