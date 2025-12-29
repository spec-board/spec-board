'use client';

import { useState, useEffect, useCallback, useRef, KeyboardEvent } from 'react';
import { Folder, FolderOpen, ChevronRight, Home, ArrowUp, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/tooltip';
import { announce } from '@/lib/accessibility';

interface DirectoryEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  isSpecKitProject: boolean;
}

interface BrowseResponse {
  currentPath: string;
  parentPath: string;
  entries: DirectoryEntry[];
  isSpecKitProject: boolean;
}

interface ProjectSelectorProps {
  onSelect: (path: string) => void;
  recentProjects: string[];
}

export function ProjectSelector({ onSelect, recentProjects }: ProjectSelectorProps) {
  const [currentPath, setCurrentPath] = useState<string>('~');
  const [entries, setEntries] = useState<DirectoryEntry[]>([]);
  const [parentPath, setParentPath] = useState<string>('');
  const [isSpecKitProject, setIsSpecKitProject] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const listRef = useRef<HTMLDivElement>(null);

  const fetchDirectory = async (path: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/browse?path=${encodeURIComponent(path)}`);
      if (!response.ok) {
        throw new Error('Failed to browse directory');
      }
      const data: BrowseResponse = await response.json();
      setCurrentPath(data.currentPath);
      setParentPath(data.parentPath);
      setEntries(data.entries);
      setIsSpecKitProject(data.isSpecKitProject);
      setFocusedIndex(-1);
      announce(`Navigated to ${data.currentPath}. ${data.entries.length} items.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      announce('Error loading directory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectory('~');
  }, []);

  const handleNavigate = (path: string) => {
    fetchDirectory(path);
  };

  const handleSelect = () => {
    if (isSpecKitProject) {
      announce(`Selected project: ${currentPath}`);
      onSelect(currentPath);
    }
  };

  // Keyboard navigation for directory list
  const handleListKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (entries.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, entries.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < entries.length) {
          handleNavigate(entries[focusedIndex].path);
        }
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(entries.length - 1);
        break;
    }
  }, [entries, focusedIndex]);

  // Focus the item when focusedIndex changes
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="treeitem"]');
      const item = items[focusedIndex] as HTMLElement;
      item?.focus();
    }
  }, [focusedIndex]);

  return (
    <div
      className="flex flex-col h-full bg-[var(--card)] rounded-lg border border-[var(--border)]"
      role="region"
      aria-label="Project selector"
    >
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)]">
        <h2 className="text-lg font-semibold mb-2" id="project-selector-heading">Select Project</h2>
        <div
          className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] bg-[var(--secondary)] rounded px-3 py-2"
          aria-live="polite"
        >
          <Folder className="w-4 h-4" aria-hidden="true" />
          <span className="truncate">{currentPath}</span>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center gap-2 p-2 border-b border-[var(--border)]" role="toolbar" aria-label="Navigation">
        <Tooltip content="Home [H]">
          <button
            onClick={() => handleNavigate('~')}
            className="p-2 hover:bg-[var(--secondary)] rounded transition-colors focus-ring"
            aria-label="Go to home directory"
          >
            <Home className="w-4 h-4" />
          </button>
        </Tooltip>
        <Tooltip content="Parent directory [Backspace]">
          <button
            onClick={() => handleNavigate(parentPath)}
            className="p-2 hover:bg-[var(--secondary)] rounded transition-colors focus-ring"
            aria-label="Go to parent directory"
            disabled={currentPath === parentPath}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </Tooltip>
        {isSpecKitProject && (
          <Tooltip content="Select this project [Enter]">
            <button
              onClick={handleSelect}
              className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-[var(--primary)] text-[var(--primary-foreground)] rounded text-sm font-medium hover:opacity-90 transition-opacity focus-ring"
              aria-label={`Select ${currentPath} as project`}
            >
              <Check className="w-4 h-4" aria-hidden="true" />
              Select This Project
            </button>
          </Tooltip>
        )}
      </div>

      {/* Recent projects */}
      {recentProjects.length > 0 && (
        <section className="p-2 border-b border-[var(--border)]" aria-labelledby="recent-projects-heading">
          <h3 id="recent-projects-heading" className="text-xs text-[var(--muted-foreground)] px-2 mb-1">
            Recent Projects
          </h3>
          <ul role="listbox" aria-label="Recent projects">
            {recentProjects.slice(0, 5).map((path, index) => (
              <li key={path} role="option" aria-selected={false}>
                <button
                  onClick={() => {
                    announce(`Selected recent project: ${path.split('/').pop()}`);
                    onSelect(path);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-[var(--secondary)] rounded transition-colors text-left focus-ring"
                  aria-label={`Open recent project: ${path.split('/').pop()}`}
                >
                  <FolderOpen className="w-4 h-4 text-green-400" aria-hidden="true" />
                  <span className="truncate">{path.split('/').pop()}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Directory listing */}
      <div className="flex-1 overflow-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-[var(--muted-foreground)]" role="status" aria-live="polite">
            Loading...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32 text-red-400" role="alert">
            {error}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-[var(--muted-foreground)]">
            No directories found
          </div>
        ) : (
          <div
            ref={listRef}
            role="tree"
            aria-label="Directory contents"
            onKeyDown={handleListKeyDown}
            className="space-y-1"
          >
            {entries.map((entry, index) => (
              <button
                key={entry.path}
                role="treeitem"
                aria-selected={focusedIndex === index}
                aria-label={`${entry.name}${entry.isSpecKitProject ? ', spec-kit project' : ''}`}
                tabIndex={focusedIndex === index ? 0 : -1}
                onClick={() => handleNavigate(entry.path)}
                onFocus={() => setFocusedIndex(index)}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors text-left focus-ring',
                  entry.isSpecKitProject
                    ? 'bg-green-500/10 hover:bg-green-500/20 text-green-400'
                    : 'hover:bg-[var(--secondary)]',
                  focusedIndex === index && 'ring-2 ring-[var(--ring)] ring-offset-1'
                )}
              >
                {entry.isSpecKitProject ? (
                  <FolderOpen className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Folder className="w-4 h-4" aria-hidden="true" />
                )}
                <span className="flex-1 truncate">{entry.name}</span>
                {entry.isSpecKitProject && (
                  <span className="text-xs bg-green-500/20 px-1.5 py-0.5 rounded" aria-hidden="true">
                    spec-kit
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Keyboard shortcuts help (screen reader only) */}
      <div className="sr-only">
        Use arrow keys to navigate directories. Press Enter to open a directory.
        Press H to go home, Backspace to go to parent directory.
      </div>
    </div>
  );
}
