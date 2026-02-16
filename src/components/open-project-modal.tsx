'use client';

import { useState, useEffect, useCallback, useRef, KeyboardEvent } from 'react';
import { X, Search, FolderOpen, Folder, Loader2, Check, Clock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Project, FeatureStage } from '@/types';

interface DirectoryEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  isSpecKitProject: boolean;
}

interface ProjectPreview {
  project: Project;
  featureCount: number;
  completionPercentage: number;
  stageBreakdown: Record<FeatureStage, number>;
}

interface OpenProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: (project: Project) => void;
}

// Recent paths stored in localStorage
const RECENT_PATHS_KEY = 'specboard-recent-paths';

function getRecentPaths(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_PATHS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentPath(path: string) {
  try {
    const paths = getRecentPaths().filter(p => p !== path);
    const updated = [path, ...paths].slice(0, 5);
    localStorage.setItem(RECENT_PATHS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore errors
  }
}

export function OpenProjectModal({ isOpen, onClose, onOpen }: OpenProjectModalProps) {
  const [pathInput, setPathInput] = useState('~/');
  const [suggestions, setSuggestions] = useState<DirectoryEntry[]>([]);
  const [recentPaths, setRecentPaths] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [preview, setPreview] = useState<ProjectPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load recent paths and home directory when modal opens
  const loadInitialData = useCallback(async () => {
    setIsLoadingSuggestions(true);
    setRecentPaths(getRecentPaths());

    try {
      const response = await fetch('/api/browse?path=' + encodeURIComponent('~'));
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.entries.slice(0, 6));
        setShowSuggestions(true);
      }
    } catch {
      // Ignore errors
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  // Focus input and load home directory when modal opens
  useEffect(() => {
    if (isOpen) {
      setPathInput('~/');
      loadInitialData();
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setPathInput('~/');
      setSuggestions([]);
      setShowSuggestions(false);
      setPreview(null);
      setError(null);
    }
  }, [isOpen, loadInitialData]);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async (input: string) => {
    if (!input || input.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const lastSlashIndex = input.lastIndexOf('/');
    const parentDir = lastSlashIndex > 0
      ? input.substring(0, lastSlashIndex)
      : (input.startsWith('/') ? '/' : '~');
    const partialName = lastSlashIndex >= 0
      ? input.substring(lastSlashIndex + 1).toLowerCase()
      : input.toLowerCase();

    setIsLoadingSuggestions(true);
    try {
      const url = '/api/browse?path=' + encodeURIComponent(parentDir);
      const response = await fetch(url);
      if (!response.ok) {
        setSuggestions([]);
        return;
      }
      const data = await response.json();
      const filtered = data.entries
        .filter((entry: DirectoryEntry) => entry.name.toLowerCase().startsWith(partialName))
        .slice(0, 6);

      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedIndex(-1);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  // Debounced fetch
  const debouncedFetch = useCallback((input: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(input), 150);
  }, [fetchSuggestions]);

  // Load project preview
  const loadPreview = useCallback(async (path: string) => {
    setIsLoadingPreview(true);
    setError(null);
    setPreview(null);

    try {
      const url = '/api/project?path=' + encodeURIComponent(path);
      const response = await fetch(url);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Not a valid spec-kit project');
      }

      const project: Project = await response.json();

      const stageBreakdown: Record<FeatureStage, number> = {
        backlog: 0, planning: 0, in_progress: 0, done: 0
      };
      let totalTasks = 0, completedTasks = 0;

      for (const feature of project.features) {
        stageBreakdown[feature.stage]++;
        totalTasks += feature.totalTasks;
        completedTasks += feature.completedTasks;
      }

      setPreview({
        project,
        featureCount: project.features.length,
        completionPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        stageBreakdown,
      });

      // Add to recent paths
      addRecentPath(path);
      setRecentPaths(getRecentPaths());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setIsLoadingPreview(false);
    }
  }, []);

  // Accept suggestion
  const acceptSuggestion = (suggestion: DirectoryEntry) => {
    setPathInput(suggestion.path);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);

    if (suggestion.isSpecKitProject) {
      loadPreview(suggestion.path);
    } else {
      setPreview(null);
      setError(null);
    }
  };

  // Handle recent path click
  const handleRecentPathClick = (path: string) => {
    setPathInput(path);
    loadPreview(path);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPathInput(value);
    setPreview(null);
    setError(null);
    debouncedFetch(value);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => prev < suggestions.length - 1 ? prev + 1 : 0);
          return;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : suggestions.length - 1);
          return;
        case 'Tab':
          e.preventDefault();
          if (selectedIndex >= 0) {
            acceptSuggestion(suggestions[selectedIndex]);
          } else if (suggestions.length > 0) {
            acceptSuggestion(suggestions[0]);
          }
          return;
        case 'Enter':
          if (selectedIndex >= 0) {
            e.preventDefault();
            acceptSuggestion(suggestions[selectedIndex]);
            return;
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowSuggestions(false);
          return;
      }
    }

    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Handle open button click
  const handleOpen = () => {
    if (preview) {
      onOpen(preview.project);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between border-b border-[var(--border)]"
          style={{
            padding: 'var(--space-4)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center"
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius)',
                background: 'var(--secondary)',
              }}
            >
              <FolderOpen className="w-5 h-5" style={{ color: 'var(--tag-text-success)' }} />
            </div>
            <h2
              className="font-semibold"
              style={{ fontSize: 'var(--text-lg)' }}
            >
              Open Project
            </h2>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-[var(--secondary)] rounded-lg transition-colors"
            style={{
              padding: 'var(--space-2)',
              borderRadius: 'var(--radius)',
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 'var(--space-4)' }}>
          {/* Search input */}
          <div className="relative">
            <div
              className="flex items-center bg-[var(--secondary)] border border-[var(--border)] focus-within:border-[var(--ring)]"
              style={{
                gap: 'var(--space-2)',
                paddingLeft: 'var(--space-3)',
                paddingRight: 'var(--space-3)',
                paddingTop: 'calc(var(--space-2) + var(--space-1))',
                paddingBottom: 'calc(var(--space-2) + var(--space-1))',
                borderRadius: 'var(--radius)',
              }}
            >
              <Search className="w-4 h-4 text-[var(--muted-foreground)]" />
              <input
                ref={inputRef}
                type="text"
                value={pathInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => pathInput && debouncedFetch(pathInput)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Search or paste project path..."
                className="flex-1 bg-transparent outline-none"
                style={{ fontSize: 'var(--text-sm)' }}
                spellCheck={false}
                autoComplete="off"
              />
              {isLoadingSuggestions && (
                <Loader2 className="w-4 h-4 animate-spin text-[var(--muted-foreground)]" />
              )}
            </div>

            {/* Recent Paths - Show when no input */}
            {pathInput === '~/' && recentPaths.length > 0 && !showSuggestions && (
              <div className="mt-3 space-y-1">
                <p className="text-xs font-medium text-[var(--muted-foreground)] px-1">
                  Recent
                </p>
                {recentPaths.map((path) => (
                  <button
                    key={path}
                    onClick={() => handleRecentPathClick(path)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left hover:bg-[var(--secondary)] transition-colors"
                  >
                    <Clock className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                    <span className="truncate text-[var(--foreground)]">{path}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-10 max-h-64 overflow-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.path}
                    onClick={() => acceptSuggestion(suggestion)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                      selectedIndex === index
                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                        : 'hover:bg-[var(--secondary)]',
                      suggestion.isSpecKitProject && selectedIndex !== index && 'text-[var(--tag-text-success)]'
                    )}
                  >
                    {suggestion.isSpecKitProject ? (
                      <FolderOpen className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <Folder className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span className="flex-1 truncate">{suggestion.name}</span>
                    {suggestion.isSpecKitProject && (
                      <span className="text-xs bg-green-500/20 px-1.5 py-0.5 rounded">
                        spec-kit
                      </span>
                    )}
                  </button>
                ))}
                <div className="px-3 py-1.5 text-xs text-[var(--muted-foreground)] border-t border-[var(--border)]">
                  ↑↓ navigate • Tab accept • Esc close
                </div>
              </div>
            )}
          </div>

          {/* Preview card */}
          {isLoadingPreview && (
            <div className="mt-4 p-4 bg-[var(--secondary)] rounded-lg flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--muted-foreground)]" />
              <span className="ml-2 text-sm text-[var(--muted-foreground)]">Loading project...</span>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-sm" style={{ color: 'var(--tag-text-error)' }}>
              {error}
            </div>
          )}

          {preview && (
            <div className="mt-4 p-4 bg-[var(--secondary)] rounded-lg border border-green-500/30">
              <div className="flex items-start gap-3">
                <FolderOpen className="w-6 h-6 mt-0.5" style={{ color: 'var(--tag-text-success)' }} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{preview.project.name}</div>
                  <div className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">
                    {preview.project.path}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-sm text-[var(--muted-foreground)]">
                    <span>{preview.featureCount} features</span>
                    <span>•</span>
                    <span>{preview.completionPercentage}% complete</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleOpen}
                className="w-full mt-4 flex items-center justify-center gap-2 font-medium rounded-lg transition-colors"
                style={{
                  paddingLeft: 'var(--space-4)',
                  paddingRight: 'var(--space-4)',
                  paddingTop: 'var(--space-2)',
                  paddingBottom: 'var(--space-2)',
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-foreground)',
                  borderRadius: 'var(--radius)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent)'}
              >
                <Check className="w-4 h-4" />
                Open Project
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
