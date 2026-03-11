'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FolderOpen, Github, Settings, Plus, ChevronRight } from 'lucide-react';
import { ThemeButton } from '@/components/theme-button';
import { Tooltip } from '@/components/tooltip';

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
    <header className="border-b border-[var(--border)] bg-[var(--card)] h-14">
      <div
        className="container mx-auto h-full flex items-center"
        style={{
          paddingLeft: 'var(--space-6)',
          paddingRight: 'var(--space-6)',
        }}
      >
        <div className="flex items-center justify-between w-full">
          {/* Left side - Logo, breadcrumb */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
              title="Home"
            >
              <Image
                src="/images/specboard-logo.svg"
                alt="SpecBoard Logo"
                width={28}
                height={28}
                className="rounded"
              />
              <h1 className="font-bold text-lg">
                <span className="text-[var(--primary)]">Spec</span>
                <span className="text-[var(--foreground)]">Board</span>
              </h1>
            </button>

            {/* Breadcrumb for project pages */}
            {variant === 'project' && projectName && (
              <div className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] ml-1">
                <ChevronRight className="w-4 h-4 opacity-40" />
                <FolderOpen className="w-4 h-4 flex-shrink-0 opacity-60" />
                <span className="text-[var(--foreground)] font-medium">{projectName}</span>
              </div>
            )}
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-1">
            {variant === 'home' && onNewProject && (
              <Tooltip content="Create a new project" side="bottom">
                <button
                  onClick={onNewProject}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors text-sm font-medium mr-1"
                  style={{
                    background: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                  }}
                >
                  <Plus className="w-4 h-4" />
                  New Project
                </button>
              </Tooltip>
            )}

            <Tooltip content="Toggle theme" side="bottom">
              <ThemeButton />
            </Tooltip>

            <Tooltip content="View on GitHub" side="bottom">
              <a
                href="https://github.com/paulpham157/spec-board"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-[var(--secondary)] rounded-lg transition-colors flex items-center justify-center"
                aria-label="GitHub Repository"
              >
                <Github className="w-5 h-5" />
              </a>
            </Tooltip>

            <Tooltip content="Settings" side="bottom">
              <button
                onClick={() => router.push('/settings')}
                className="p-2 hover:bg-[var(--secondary)] rounded-lg transition-colors flex items-center justify-center"
                aria-label="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </header>
  );
}
