'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, ChevronRight, Pencil, Network } from 'lucide-react';
import { ThemeButton } from '@/components/theme-button';
import { Tooltip } from '@/components/tooltip';
import { GitHubStars } from '@/components/github-stars';
import { useSettingsStore } from '@/lib/settings-store';

interface HeaderProps {
  variant: 'home' | 'project';
  projectName?: string;
  projectPath?: string;
  projectSlug?: string;
  onNewProject?: () => void;
  onProjectNameChange?: (newName: string) => void;
}

export function Header({ variant, projectName, projectSlug, onNewProject, onProjectNameChange }: HeaderProps) {
  const router = useRouter();
  const { openSettings } = useSettingsStore();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(projectName || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditName(projectName || '');
  }, [projectName]);

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  const handleSaveName = useCallback(() => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== projectName) {
      onProjectNameChange?.(trimmed);
    }
    setIsEditingName(false);
  }, [editName, projectName, onProjectNameChange]);

  const handleCancelEdit = useCallback(() => {
    setEditName(projectName || '');
    setIsEditingName(false);
  }, [projectName]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  }, [handleSaveName, handleCancelEdit]);

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
                {isEditingName ? (
                  <div className="flex items-center gap-1">
                    <input
                      ref={inputRef}
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onBlur={handleSaveName}
                      className="text-sm bg-[var(--secondary)] border border-[var(--border)] rounded px-2 py-0.5 outline-none focus:border-[var(--ring)] min-w-[120px]"
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => onProjectNameChange && setIsEditingName(true)}
                    className="group flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                    title={onProjectNameChange ? 'Click to rename' : undefined}
                  >
                    <span>{projectName}</span>
                    {onProjectNameChange && (
                      <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                )}
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

            {variant === 'project' && projectSlug && (
              <Tooltip content="Mind Map" side="bottom">
                <button
                  onClick={() => router.push(`/projects/${projectSlug}/mind-map`)}
                  className="btn-icon"
                  aria-label="Mind Map"
                >
                  <Network className="w-4 h-4" />
                </button>
              </Tooltip>
            )}

            <Tooltip content="Toggle theme" side="bottom">
              <ThemeButton />
            </Tooltip>

            <Tooltip content="GitHub" side="bottom">
              <GitHubStars />
            </Tooltip>

            <Tooltip content="Settings" side="bottom">
              <button
                onClick={() => openSettings()}
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
