'use client';

import { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Plus, Layout, FileText, CheckSquare, ArrowRight, Trash2 } from 'lucide-react';
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
    return <ArrowUpDown className="w-3 h-3 opacity-40" />;
  }
  return direction === 'asc' ? (
    <ArrowUp className="w-3 h-3" />
  ) : (
    <ArrowDown className="w-3 h-3" />
  );
}

export function ProjectList({ projects, onSelect, onDelete, onCreateProject }: ProjectListProps) {
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        {/* Illustrated hero graphic */}
        <div className="relative mb-8">
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              boxShadow: '0 0 60px rgba(59, 130, 246, 0.15), 0 0 30px rgba(6, 182, 212, 0.1)',
            }}
          >
            <Layout className="w-12 h-12 text-[var(--primary-foreground)]" />
          </div>
          <div
            className="absolute -top-2 -right-2 w-8 h-8 rounded-lg flex items-center justify-center border-2 border-[var(--background)]"
            style={{ background: 'var(--color-success)' }}
          >
            <CheckSquare className="w-4 h-4 text-[var(--primary-foreground)]" />
          </div>
        </div>

        {/* Heading and description */}
        <h2 className="text-2xl font-bold tracking-tight mb-2 text-[var(--foreground)]">
          Welcome to SpecBoard
        </h2>
        <p className="text-[var(--muted-foreground)] max-w-md mb-8 leading-relaxed">
          Track your specs with a Kanban board, generate AI-powered specifications, and manage your project lifecycle from idea to completion.
        </p>

        {/* Primary CTA */}
        {onCreateProject && (
          <button
            onClick={onCreateProject}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
            }}
          >
            <Plus className="w-5 h-5" />
            Create Your First Project
          </button>
        )}

        {/* Feature highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 w-full max-w-xl">
          {[
            {
              icon: FileText,
              title: 'Write Specs',
              desc: 'AI-powered specification generation',
              color: 'var(--primary)',
              bg: 'var(--color-active-bg)',
            },
            {
              icon: Layout,
              title: 'Kanban Board',
              desc: 'Drag and drop feature management',
              color: 'var(--accent)',
              bg: 'var(--accent-muted)',
            },
            {
              icon: CheckSquare,
              title: 'Verify & Ship',
              desc: 'Checklists to validate completeness',
              color: 'var(--color-success)',
              bg: 'var(--tag-bg-success)',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] transition-colors hover:border-[var(--border-hover)]"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: feature.bg }}
              >
                <feature.icon className="w-5 h-5" style={{ color: feature.color }} />
              </div>
              <span className="text-sm font-semibold text-[var(--foreground)]">{feature.title}</span>
              <span className="text-xs text-[var(--muted-foreground)] leading-relaxed">{feature.desc}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section heading */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--foreground)]">Projects</h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
        <input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            'w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)]',
            'outline-none focus:border-[var(--ring)] focus:ring-1 focus:ring-[var(--ring)] transition-all',
            'placeholder:text-[var(--muted-foreground)]'
          )}
          style={{ fontSize: 'var(--text-sm)' }}
        />
      </div>

      {/* Table Header */}
      <div
        className="grid gap-4 px-4 py-2.5 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider"
        style={{ gridTemplateColumns: '1fr 100px 160px' }}
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
      <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--card)]">
        {filteredAndSorted.map((project) => (
          <div
            key={project.id}
            className="grid gap-4 px-4 py-3.5 items-center hover:bg-[var(--card-hover)] transition-colors cursor-pointer border-b border-[var(--border)] last:border-b-0 group"
            style={{ gridTemplateColumns: '1fr 100px 160px' }}
            onClick={() => onSelect(project)}
            onMouseEnter={() => setHoveredProject(project.id)}
            onMouseLeave={() => setHoveredProject(null)}
          >
            {/* Project Name & Description */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold truncate text-[var(--foreground)]">{project.displayName}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </div>
              {project.description && (
                <p className="text-sm text-[var(--muted-foreground)] truncate mt-0.5">
                  {project.description}
                </p>
              )}
            </div>

            {/* Feature Count */}
            <div className="text-sm text-[var(--muted-foreground)]">
              <span
                className="inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-semibold mr-1.5"
                style={{
                  background: project.featureCount > 0 ? 'var(--color-active-bg)' : 'var(--secondary)',
                  color: project.featureCount > 0 ? 'var(--color-active)' : 'var(--muted-foreground)',
                }}
              >
                {project.featureCount}
              </span>
              {project.featureCount === 1 ? 'feature' : 'features'}
            </div>

            {/* Updated */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--muted-foreground)]">
                {formatRelativeTime(project.updatedAt)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(project);
                }}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  "text-[var(--muted-foreground)] hover:text-[var(--tag-text-error)] hover:bg-[var(--tag-bg-error)]",
                  hoveredProject === project.id ? "opacity-100" : "opacity-0"
                )}
                title="Delete project"
                aria-label={`Delete ${project.displayName}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
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
