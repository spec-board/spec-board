'use client';

import { FolderOpen, Clock, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RecentProject } from '@/lib/store';

interface RecentProjectsListProps {
  projects: RecentProject[];
  onSelect: (project: RecentProject) => void;
  onRemove: (path: string) => void;
}

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

function getStageLabel(stageBreakdown: RecentProject['stageBreakdown']): string {
  const total = Object.values(stageBreakdown).reduce((a, b) => a + b, 0);
  if (total === 0) return 'No features';
  
  const parts: string[] = [];
  if (stageBreakdown.complete > 0) parts.push(`${stageBreakdown.complete} complete`);
  if (stageBreakdown.implement > 0) parts.push(`${stageBreakdown.implement} implementing`);
  if (stageBreakdown.tasks > 0) parts.push(`${stageBreakdown.tasks} in tasks`);
  if (stageBreakdown.plan > 0) parts.push(`${stageBreakdown.plan} planning`);
  if (stageBreakdown.specify > 0) parts.push(`${stageBreakdown.specify} specifying`);
  
  return parts.slice(0, 2).join(', ') || 'No features';
}

export function RecentProjectsList({ projects, onSelect, onRemove }: RecentProjectsListProps) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <FolderOpen className="w-12 h-12 text-[var(--muted-foreground)] mb-4 opacity-50" />
        <p className="text-[var(--muted-foreground)] mb-2">No recent projects</p>
        <p className="text-sm text-[var(--muted-foreground)] opacity-70">
          Open a project to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {projects.map((project) => (
        <div
          key={project.path}
          onClick={() => onSelect(project)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelect(project)}
          className={cn(
            'w-full text-left p-4 rounded-lg border border-[var(--border)]',
            'bg-[var(--card)] hover:bg-[var(--secondary)] transition-colors',
            'group relative cursor-pointer'
          )}
        >
          <div className="flex items-start gap-3">
            <FolderOpen className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              {/* Project name */}
              <div className="font-medium truncate">{project.name}</div>
              
              {/* Path */}
              <div className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">
                {project.path}
              </div>
              
              {/* Summary */}
              {project.summary && (
                <div className="text-sm text-[var(--muted-foreground)] mt-2 line-clamp-2">
                  {project.summary}
                </div>
              )}
              
              {/* Stats row */}
              <div className="flex items-center gap-4 mt-2 text-xs text-[var(--muted-foreground)]">
                {/* Last opened */}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatRelativeTime(project.lastOpened)}
                </span>
                
                {/* Feature count & completion */}
                <span>
                  {project.featureCount} feature{project.featureCount !== 1 ? 's' : ''}
                  {project.featureCount > 0 && ` • ${project.completionPercentage}%`}
                </span>
              </div>
              
              {/* Stage breakdown */}
              {project.featureCount > 0 && (
                <div className="text-xs text-[var(--muted-foreground)] mt-1 opacity-70">
                  {getStageLabel(project.stageBreakdown)}
                </div>
              )}
            </div>
          </div>
          
          {/* Remove button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(project.path);
            }}
            className={cn(
              'absolute top-3 right-3 p-1.5 rounded',
              'opacity-0 group-hover:opacity-100 transition-opacity',
              'hover:bg-red-500/20 text-[var(--muted-foreground)] hover:text-red-400'
            )}
            title="Remove from recent"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
