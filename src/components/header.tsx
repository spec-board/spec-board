'use client';

import { useRouter, usePathname } from 'next/navigation';
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
  const pathname = usePathname();

  return (
    <header className="border-b border-[var(--border)] h-14 bg-[var(--background)]">
      <div className="max-w-5xl mx-auto h-full flex items-center px-6">
        <div className="flex items-center justify-between w-full">
          {/* Left — logo + wordmark + breadcrumb */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 hover:opacity-70 transition-opacity"
            >
              {/* Logo mark */}
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                {/* Outer square frame */}
                <rect
                  x="2"
                  y="2"
                  width="20"
                  height="20"
                  rx="4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="text-[var(--foreground)]"
                />
                {/* Top-left block */}
                <rect
                  x="5.5"
                  y="5.5"
                  width="5"
                  height="5"
                  rx="1.2"
                  fill="currentColor"
                  className="text-[var(--foreground)]"
                />
                {/* Top-right line */}
                <rect
                  x="13.5"
                  y="6.5"
                  width="5"
                  height="1.5"
                  rx="0.75"
                  fill="currentColor"
                  className="text-[var(--muted-foreground)]"
                />
                {/* Mid-right line */}
                <rect
                  x="13.5"
                  y="9.5"
                  width="3.5"
                  height="1.5"
                  rx="0.75"
                  fill="currentColor"
                  className="text-[var(--muted-foreground)]"
                  opacity="0.5"
                />
                {/* Bottom row — two small blocks */}
                <rect
                  x="5.5"
                  y="14"
                  width="5"
                  height="5.5"
                  rx="1.2"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  className="text-[var(--muted-foreground)]"
                />
                <rect
                  x="13.5"
                  y="14"
                  width="5"
                  height="5.5"
                  rx="1.2"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  className="text-[var(--muted-foreground)]"
                />
              </svg>
              <span className="text-[var(--foreground)] font-semibold text-base tracking-tight">
                specboard
              </span>
            </button>

            {variant === 'project' && projectName && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                <span className="text-sm text-[var(--muted-foreground)]">{projectName}</span>
              </>
            )}
          </div>

          {/* Right — actions */}
          <div className="flex items-center gap-2">
            {variant === 'home' && onNewProject && (
              <button
                onClick={onNewProject}
                className="btn btn-primary btn-sm mr-1"
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
                onClick={() => router.push(`/settings?from=${encodeURIComponent(pathname)}`)}
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
