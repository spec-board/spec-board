'use client';

import { useState, useEffect, useCallback, useRef, KeyboardEvent, FormEvent } from 'react';
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
  const [pathInput, setPathInput] = useState<string>('~');
  const [entries, setEntries] = useState<DirectoryEntry[]>([]);
  const [parentPath, setParentPath] = useState<string>('');
  const [isSpecKitProject, setIsSpecKitProject] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<DirectoryEntry[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDirectory = async (path: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/browse?path=${encodeURIComponent(path)}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to browse directory');
      }
      const data: BrowseResponse = await response.json();
      setCurrentPath(data.currentPath);
      setPathInput(data.currentPath);
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

  // Fetch suggestions for autocomplete
  const fetchSuggestions = useCallback(async (inputPath: string) => {
    if (!inputPath || inputPath.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Determine the parent directory and partial name to filter
    const lastSlashIndex = inputPath.lastIndexOf('/');
    const parentDir = lastSlashIndex > 0 ? inputPath.substring(0, lastSlashIndex) : (inputPath.startsWith('/') ? '/' : '~');
    const partialName = lastSlashIndex >= 0 ? inputPath.substring(lastSlashIndex + 1).toLowerCase() : inputPath.toLowerCase();

    setIsFetchingSuggestions(true);
    try {
      const response = await fetch(`/api/browse?path=${encodeURIComponent(parentDir)}`);
      if (!response.ok) {
        setSuggestions([]);
        return;
      }
      const data: BrowseResponse = await response.json();

      // Filter entries that match the partial name
      const filtered = data.entries.filter(entry =>
        entry.name.toLowerCase().startsWith(partialName)
      ).slice(0, 8); // Limit to 8 suggestions

      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedSuggestionIndex(-1);
    } catch {
      setSuggestions([]);
    } finally {
      setIsFetchingSuggestions(false);
    }
  }, []);

  // Debounced suggestion fetching
  const debouncedFetchSuggestions = useCallback((inputPath: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(inputPath);
    }, 150);
  }, [fetchSuggestions]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Handle input change with suggestions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPathInput(value);
    debouncedFetchSuggestions(value);
  };

  // Accept the selected suggestion
  const acceptSuggestion = (suggestion: DirectoryEntry) => {
    setPathInput(suggestion.path);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    // Navigate to the selected path
    fetchDirectory(suggestion.path);
  };

  // Handle path input submission
  const handlePathSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowSuggestions(false);
    const trimmedPath = pathInput.trim();
    if (trimmedPath && trimmedPath !== currentPath) {
      fetchDirectory(trimmedPath);
    }
  };

  // Handle input key events (including autocomplete navigation)
  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedSuggestionIndex(prev =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          return;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedSuggestionIndex(prev =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          return;
        case 'Tab':
          e.preventDefault();
          if (selectedSuggestionIndex >= 0) {
            acceptSuggestion(suggestions[selectedSuggestionIndex]);
          } else if (suggestions.length > 0) {
            acceptSuggestion(suggestions[0]);
          }
          return;
        case 'Escape':
          e.preventDefault();
          setShowSuggestions(false);
          setSelectedSuggestionIndex(-1);
          return;
        case 'Enter':
          if (selectedSuggestionIndex >= 0) {
            e.preventDefault();
            acceptSuggestion(suggestions[selectedSuggestionIndex]);
            return;
          }
          // Let form submission handle Enter when no suggestion selected
          setShowSuggestions(false);
          return;
      }
    }

    if (e.key === 'Escape') {
      // Reset to current path on escape
      setPathInput(currentPath);
      setShowSuggestions(false);
      inputRef.current?.blur();
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
        <form onSubmit={handlePathSubmit} className="relative">
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 text-sm bg-[var(--secondary)] rounded px-3 py-2">
              <Folder className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                value={pathInput}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                onFocus={() => pathInput && debouncedFetchSuggestions(pathInput)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                className="flex-1 bg-transparent outline-none text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
                placeholder="Enter path (e.g., ~/Projects or /Users/...)"
                aria-label="Directory path input"
                aria-autocomplete="list"
                aria-expanded={showSuggestions}
                aria-controls="path-suggestions"
                spellCheck={false}
                autoComplete="off"
              />
              {isFetchingSuggestions && (
                <span className="text-xs text-[var(--muted-foreground)]">...</span>
              )}
            </div>
            <button
              type="submit"
              className="px-3 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded text-sm font-medium hover:opacity-90 transition-opacity focus-ring"
              aria-label="Go to path"
            >
              Go
            </button>
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              id="path-suggestions"
              role="listbox"
              className="absolute left-0 right-12 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50 max-h-64 overflow-auto"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.path}
                  type="button"
                  role="option"
                  aria-selected={selectedSuggestionIndex === index}
                  onClick={() => acceptSuggestion(suggestion)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                    selectedSuggestionIndex === index
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                      : 'hover:bg-[var(--secondary)]',
                    suggestion.isSpecKitProject && selectedSuggestionIndex !== index && 'text-green-400'
                  )}
                >
                  {suggestion.isSpecKitProject ? (
                    <FolderOpen className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  ) : (
                    <Folder className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  )}
                  <span className="flex-1 truncate">{suggestion.name}</span>
                  {suggestion.isSpecKitProject && (
                    <span className="text-xs bg-green-500/20 px-1.5 py-0.5 rounded" aria-hidden="true">
                      spec-kit
                    </span>
                  )}
                </button>
              ))}
              <div className="px-3 py-1.5 text-xs text-[var(--muted-foreground)] border-t border-[var(--border)]">
                ↑↓ to navigate • Tab to accept • Esc to close
              </div>
            </div>
          )}
        </form>
        <p className="text-xs text-[var(--muted-foreground)] mt-1.5">
          Type a path and press Enter or click Go to navigate
        </p>
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
