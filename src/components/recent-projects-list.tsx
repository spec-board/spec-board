'use client';

import { FolderOpen, Clock, Trash2, Rocket, FileText, ListTodo, Hammer, CheckCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RecentProject, FeatureStage } from '@/types';

// Get icon and label for active feature stage
function getStageDisplay(stage: FeatureStage): { icon: React.ReactNode; label: string; cssVar: string; bgVar: string } {
  switch (stage) {
    case 'backlog':
      return { icon: <Rocket className="w-3 h-3" />, label: 'Backlog', cssVar: 'var(--tag-text-orange)', bgVar: 'var(--tag-bg-orange)' };
    case 'specify':
      return { icon: <FileText className="w-3 h-3" />, label: 'Specify', cssVar: 'var(--tag-text-info)', bgVar: 'var(--tag-bg-info)' };
    case 'clarify':
      return { icon: <FileText className="w-3 h-3" />, label: 'Clarify', cssVar: 'var(--tag-text-cyan)', bgVar: 'var(--tag-bg-cyan)' };
    case 'plan':
      return { icon: <FileText className="w-3 h-3" />, label: 'Plan', cssVar: 'var(--tag-text-warning)', bgVar: 'var(--tag-bg-warning)' };
    case 'tasks':
      return { icon: <ListTodo className="w-3 h-3" />, label: 'Tasks', cssVar: 'var(--tag-text-yellow)', bgVar: 'var(--tag-bg-yellow)' };
    case 'analyze':
      return { icon: <Hammer className="w-3 h-3" />, label: 'Analyze', cssVar: 'var(--tag-text-orange)', bgVar: 'var(--tag-bg-orange)' };
    case 'done':
      return { icon: <CheckCircle className="w-3 h-3" />, label: 'Done', cssVar: 'var(--tag-text-success)', bgVar: 'var(--tag-bg-success)' };
  }
}

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
  if (stageBreakdown.done > 0) parts.push(`${stageBreakdown.done} done`);
  if (stageBreakdown.analyze > 0) parts.push(`${stageBreakdown.analyze} analyzing`);
  if (stageBreakdown.tasks > 0) parts.push(`${stageBreakdown.tasks} tasks`);
  if (stageBreakdown.plan > 0) parts.push(`${stageBreakdown.plan} planning`);
  if (stageBreakdown.clarify > 0) parts.push(`${stageBreakdown.clarify} clarifying`);
  if (stageBreakdown.specify > 0) parts.push(`${stageBreakdown.specify} specifying`);
  if (stageBreakdown.backlog > 0) parts.push(`${stageBreakdown.backlog} backlog`);

  return parts.slice(0, 2).join(', ') || 'No features';
}

export function RecentProjectsList({ projects, onSelect, onRemove }: RecentProjectsListProps) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div
          className="flex items-center justify-center mb-4"
          style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--secondary)',
          }}
        >
          <FolderOpen className="w-8 h-8 text-[var(--muted-foreground)] opacity-50" />
        </div>
        <p className="text-[var(--muted-foreground)] mb-1 font-medium">No recent projects</p>
        <p className="text-sm text-[var(--muted-foreground)] opacity-70">
          Create or open a project to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {projects.map((project) => {
        const stageInfo = project.activeFeature ? getStageDisplay(project.activeFeature.stage) : null;

        return (
          <div
            key={project.path}
            onClick={() => onSelect(project)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelect(project)}
            className={cn(
              'group relative p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]',
              'hover:border-[var(--ring)] hover:shadow-lg hover:shadow-[var(--ring)]/5 transition-all duration-200',
              'cursor-pointer'
            )}
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div
                className="flex-shrink-0 flex items-center justify-center"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--secondary)',
                }}
              >
                <FolderOpen className="w-5 h-5" style={{ color: 'var(--tag-text-success)' }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold truncate">{project.name}</h3>
                  <ChevronRight
                    className="w-4 h-4 text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  />
                </div>

                {/* Path */}
                <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">
                  {project.path}
                </p>

                {/* Stage Badge */}
                {stageInfo && (
                  <div
                    className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: stageInfo.bgVar,
                      color: stageInfo.cssVar,
                    }}
                  >
                    {stageInfo.icon}
                    <span>
                      {stageInfo.label}
                      {project.activeFeature && project.activeFeature.stage !== 'done' && ': '}
                      {project.activeFeature && project.activeFeature.stage !== 'done' && (
                        <span className="text-[var(--foreground)]">{project.activeFeature.featureName}</span>
                      )}
                    </span>
                  </div>
                )}

                {/* Fallback to summary */}
                {!stageInfo && project.summary && !project.summary.startsWith('<!--') && (
                  <p className="text-sm text-[var(--muted-foreground)] mt-2 line-clamp-2">
                    {project.summary}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 mt-3">
                  {/* Last opened */}
                  <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                    <Clock className="w-3 h-3" />
                    {formatRelativeTime(project.lastOpened)}
                  </span>

                  {/* Features */}
                  {project.featureCount > 0 && (
                    <>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {project.featureCount} feature{project.featureCount !== 1 ? 's' : ''}
                      </span>

                      {/* Progress bar */}
                      <div className="flex-1 max-w-24">
                        <div
                          className="h-1.5 rounded-full overflow-hidden"
                          style={{ backgroundColor: 'var(--secondary)' }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${project.completionPercentage}%`,
                              backgroundColor: project.completionPercentage === 100
                                ? 'var(--tag-text-success)'
                                : 'var(--tag-text-info)',
                            }}
                          />
                        </div>
                      </div>

                      <span className="text-xs font-medium" style={{ color: 'var(--tag-text-info)' }}>
                        {project.completionPercentage}%
                      </span>
                    </>
                  )}
                </div>

                {/* Stage breakdown */}
                {project.featureCount > 0 && (
                  <div className="text-xs text-[var(--muted-foreground)] mt-1.5">
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
                'absolute top-3 right-3 p-1.5 rounded-lg',
                'opacity-0 group-hover:opacity-100 transition-all duration-200',
                'hover:bg-red-500/20 text-[var(--muted-foreground)] hover:text-[var(--tag-text-error)]'
              )}
              title="Remove from recent"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
