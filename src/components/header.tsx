'use client';

import { useRouter } from 'next/navigation';
import { Github, Settings, ChevronRight } from 'lucide-react';
import { ThemeButton } from '@/components/theme-button';
import { Tooltip } from '@/components/tooltip';

interface HeaderProps {
  variant: 'home' | 'project';
  projectName?: string;
  projectPath?: string;
  projectSlug?: string;
  onNewProject?: () => void;
}

export function Header({ variant, projectName, onNewProject }: HeaderProps) {
  const router = useRouter();

  return (
    <header className="border-b border-[var(--border)] h-14 bg-[var(--background)]">
      <div className="max-w-5xl mx-auto h-full flex items-center px-6">
        <div className="flex items-center justify-between w-full">
          {/* Left — wordmark + breadcrumb */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => router.push('/')}
              className="text-[var(--foreground)] font-semibold text-base tracking-tight hover:opacity-70 transition-opacity"
            >
              specboard
            </button>

            {variant === 'project' && projectName && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                <span className="text-sm text-[var(--muted-foreground)]">{projectName}</span>
              </>
            )}
          </div>

          {/* Right — actions */}
          <div className="flex items-center gap-0.5">
            {variant === 'home' && onNewProject && (
              <button
                onClick={onNewProject}
                className="btn btn-primary btn-sm mr-2"
              >
                New
              </button>
            )}

            <Tooltip content="Toggle theme" side="bottom">
              <ThemeButton />
            </Tooltip>

            <Tooltip content="GitHub" side="bottom">
              <a
                href="https://github.com/paulpham157/spec-board"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-icon"
                aria-label="GitHub Repository"
              >
                <Github className="w-4 h-4" />
              </a>
            </Tooltip>

            <Tooltip content="Settings" side="bottom">
              <button
                onClick={() => router.push('/settings')}
                className="btn-icon"
                aria-label="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </header>
  );
}
