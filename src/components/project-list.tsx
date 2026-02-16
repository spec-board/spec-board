'use client';

import { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
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
    return <ArrowUpDown className="w-3 h-3 opacity-40" />;
  }
  return direction === 'asc' ? (
    <ArrowUp className="w-3 h-3" />
  ) : (
    <ArrowDown className="w-3 h-3" />
  );
}

export function ProjectList({ projects, onSelect, onDelete }: ProjectListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  const filteredAndSorted = useMemo(() => {
    let result = [...projects];

    // Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.displayName.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.name.toLowerCase().includes(query)
      );
    }

    // Sort
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

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8">
        <div
          className="flex items-center justify-center mb-4"
          style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--secondary)',
          }}
        >
          <Folder className="w-8 h-8 text-[var(--muted-foreground)] opacity-50" />
        </div>
        <p className="text-[var(--muted-foreground)] mb-1 font-medium">No projects yet</p>
        <p className="text-sm text-[var(--muted-foreground)] opacity-70">
          Create a project to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
        <input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            'w-full pl-10 pr-4 py-2 rounded-lg border bg-[var(--secondary)]',
            'outline-none focus:border-[var(--ring)] transition-colors',
            'placeholder:text-[var(--muted-foreground)]'
          )}
          style={{ fontSize: 'var(--text-sm)' }}
        />
      </div>

      {/* Table Header */}
      <div
        className="grid gap-4 px-4 py-2 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider"
        style={{ gridTemplateColumns: '1fr 100px 140px' }}
      >
        <button
          onClick={() => handleSort('displayName')}
          className="flex items-center gap-1 hover:text-[var(--foreground)] transition-colors text-left"
        >
          Project
          <SortIcon field="displayName" currentField={sortField} direction={sortDirection} />
        </button>
        <button
          onClick={() => handleSort('featureCount')}
          className="flex items-center gap-1 hover:text-[var(--foreground)] transition-colors text-left"
        >
          Features
          <SortIcon field="featureCount" currentField={sortField} direction={sortDirection} />
        </button>
        <button
          onClick={() => handleSort('updatedAt')}
          className="flex items-center gap-1 hover:text-[var(--foreground)] transition-colors text-left"
        >
          Updated
          <SortIcon field="updatedAt" currentField={sortField} direction={sortDirection} />
        </button>
      </div>

      {/* Project Rows */}
      <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--card)]">
        {filteredAndSorted.map((project) => (
          <div
            key={project.id}
            className="grid gap-4 px-4 py-3 items-center hover:bg-[var(--secondary)] transition-colors cursor-pointer border-b border-[var(--border)] last:border-b-0"
            style={{ gridTemplateColumns: '1fr 100px 140px' }}
            onClick={() => onSelect(project)}
            onMouseEnter={() => setHoveredProject(project.id)}
            onMouseLeave={() => setHoveredProject(null)}
          >
            {/* Project Name & Description */}
            <div className="min-w-0">
              <span className="font-medium truncate">{project.displayName}</span>
              {project.description && (
                <p className="text-sm text-[var(--muted-foreground)] truncate mt-0.5">
                  {project.description}
                </p>
              )}
            </div>

            {/* Feature Count */}
            <div className="text-sm">
              <span className="font-medium">{project.featureCount}</span>
              <span className="text-[var(--muted-foreground)] ml-1">
                {project.featureCount === 1 ? 'feature' : 'features'}
              </span>
            </div>

            {/* Updated */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--muted-foreground)]">
                {formatRelativeTime(project.updatedAt)}
              </span>
              {hoveredProject === project.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(project);
                  }}
                  className="p-1 rounded hover:bg-[var(--tag-bg-error)] text-[var(--muted-foreground)] hover:text-[var(--tag-text-error)] transition-colors"
                  title="Delete project"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Results count */}
      {searchQuery && (
        <p className="text-sm text-[var(--muted-foreground)]">
          {filteredAndSorted.length} of {projects.length} projects
        </p>
      )}
    </div>
  );
}
