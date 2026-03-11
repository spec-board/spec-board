'use client';

import { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Plus, ArrowRight, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DbProject {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  filePath: string | null;
  isCloud: boolean;
  createdAt: string;
  updatedAt: string;
  featureCount: number;
}

interface ProjectListProps {
  projects: DbProject[];
  onSelect: (project: DbProject) => void;
  onDelete: (project: DbProject) => void;
  onCreateProject?: () => void;
}

type SortField = 'displayName' | 'featureCount' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function SortIcon({ field, currentField, direction }: { field: SortField; currentField: SortField; direction: SortDirection }) {
  if (field !== currentField) {
    return <ArrowUpDown className="w-3 h-3 opacity-30" />;
  }
  return direction === 'asc'
    ? <ArrowUp className="w-3 h-3" />
    : <ArrowDown className="w-3 h-3" />;
}

export function ProjectList({ projects, onSelect, onDelete, onCreateProject }: ProjectListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  const filteredAndSorted = useMemo(() => {
    let result = [...projects];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.displayName.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.name.toLowerCase().includes(query)
      );
    }
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'displayName':
          comparison = a.displayName.localeCompare(b.displayName);
          break;
        case 'featureCount':
          comparison = a.featureCount - b.featureCount;
          break;
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return result;
  }, [projects, searchQuery, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  /* ---------- Empty state ---------- */
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="w-12 h-12 rounded-lg border border-[var(--border)] flex items-center justify-center mb-6 bg-[var(--secondary)]">
          <Plus className="w-5 h-5 text-[var(--muted-foreground)]" />
        </div>

        <h2 className="text-lg font-semibold tracking-tight mb-1 text-[var(--foreground)]">
          No projects yet
        </h2>
        <p className="text-sm text-[var(--muted-foreground)] max-w-sm mb-6 leading-relaxed">
          Create a project to start writing specs, managing features on a board, and tracking progress.
        </p>

        {onCreateProject && (
          <button
            onClick={onCreateProject}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Create project
          </button>
        )}
      </div>
    );
  }

  /* ---------- Project list ---------- */
  return (
    <div className="space-y-4">
      {/* Heading row */}
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
          Projects
          <span className="ml-2 text-[var(--muted-foreground)] font-normal normal-case tracking-normal">
            {projects.length}
          </span>
        </h2>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            'w-full pl-9 pr-4 py-2 rounded-md border border-[var(--border)] bg-[var(--background)]',
            'outline-none focus:border-[var(--ring)] transition-colors text-sm',
            'placeholder:text-[var(--muted-foreground)]'
          )}
        />
      </div>

      {/* Table header */}
      <div
        className="grid gap-4 px-3 py-2 text-xs text-[var(--muted-foreground)]"
        style={{ gridTemplateColumns: '1fr 80px 120px' }}
      >
        <button onClick={() => handleSort('displayName')} className="flex items-center gap-1 hover:text-[var(--foreground)] transition-colors text-left">
          Name <SortIcon field="displayName" currentField={sortField} direction={sortDirection} />
        </button>
        <button onClick={() => handleSort('featureCount')} className="flex items-center gap-1 hover:text-[var(--foreground)] transition-colors text-left">
          Features <SortIcon field="featureCount" currentField={sortField} direction={sortDirection} />
        </button>
        <button onClick={() => handleSort('updatedAt')} className="flex items-center gap-1 hover:text-[var(--foreground)] transition-colors text-left">
          Updated <SortIcon field="updatedAt" currentField={sortField} direction={sortDirection} />
        </button>
      </div>

      {/* Rows */}
      <div className="border border-[var(--border)] rounded-lg overflow-hidden divide-y divide-[var(--border)]">
        {filteredAndSorted.map((project) => (
          <div
            key={project.id}
            className="grid gap-4 px-3 py-3 items-center hover:bg-[var(--card-hover)] transition-colors cursor-pointer group"
            style={{ gridTemplateColumns: '1fr 80px 120px' }}
            onClick={() => onSelect(project)}
            onMouseEnter={() => setHoveredProject(project.id)}
            onMouseLeave={() => setHoveredProject(null)}
          >
            {/* Name */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-sm truncate text-[var(--foreground)]">
                  {project.displayName}
                </span>
                <ArrowRight className="w-3 h-3 text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </div>
              {project.description && (
                <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">
                  {project.description}
                </p>
              )}
            </div>

            {/* Feature count */}
            <span className="text-sm tabular-nums text-[var(--muted-foreground)]">
              {project.featureCount}
            </span>

            {/* Updated + delete */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--muted-foreground)]">
                {formatRelativeTime(project.updatedAt)}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(project); }}
                className={cn(
                  'p-1 rounded transition-all text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--accent)]',
                  hoveredProject === project.id ? 'opacity-100' : 'opacity-0'
                )}
                aria-label={`Delete ${project.displayName}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {searchQuery && (
        <p className="text-xs text-[var(--muted-foreground)]">
          {filteredAndSorted.length} of {projects.length}
        </p>
      )}
    </div>
  );
}
