import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Feature, FeatureStage } from "@/types";

// Suggested command types for spec-kit workflow
export interface SuggestedCommand {
  command: string;
  title: string;
  description: string;
  isOptional: boolean;
}

export interface CommandSuggestion {
  primary: SuggestedCommand | null;
  optional: SuggestedCommand | null;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

export function getStageColor(stage: string): string {
  const colors: Record<string, string> = {
    backlog: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    specify: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    clarify: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    plan: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    tasks: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    analyze: 'bg-green-500/20 text-green-400 border-green-500/30',
  };
  return colors[stage] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
}

export function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    backlog: 'Backlog',
    specify: 'Specify',
    clarify: 'Clarify',
    plan: 'Plan',
    tasks: 'Tasks',
    analyze: 'Analyze',
  };
  return labels[stage] || stage;
}

// Kanban column types for 6-column workflow view
export type KanbanColumn = 'backlog' | 'specify' | 'clarify' | 'plan' | 'tasks' | 'analyze';

// Map feature stages to kanban columns
export function getKanbanColumn(stage: FeatureStage): KanbanColumn {
  return stage;
}

/**
 * Get kanban column for a feature based on workflow stage.
 * Maps FeatureStage directly to KanbanColumn for the 7-column workflow view.
 */
export function getFeatureKanbanColumn(feature: Feature): KanbanColumn {
  // Use the feature's stage directly
  if (feature.stage) {
    return feature.stage as KanbanColumn;
  }

  // Fallback to legacy logic for features without stage
  if (!feature.hasSpec) {
    return 'backlog';
  }
  if (!feature.hasPlan) {
    return 'specify';
  }
  if (!feature.hasTasks) {
    return 'plan';
  }
  if (feature.totalTasks === 0) {
    return 'tasks';
  }
  const allTasksComplete = feature.completedTasks === feature.totalTasks;
  if (!allTasksComplete) {
    return 'tasks';
  }
  if (feature.hasChecklists && feature.completedChecklistItems < feature.totalChecklistItems) {
    return 'tasks';
  }
  return 'analyze';
}

export function getKanbanColumnLabel(column: KanbanColumn): string {
  const labels: Record<KanbanColumn, string> = {
    backlog: 'Backlog',
    specify: 'Specify',
    clarify: 'Clarify',
    plan: 'Plan',
    tasks: 'Tasks',
    analyze: 'Analyze',
  };
  return labels[column];
}

/**
 * Type guard for Prisma errors with error codes.
 * Common codes: P2002 (unique constraint), P2025 (record not found)
 */
export function isPrismaError(error: unknown, code?: string): error is { code: string } {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return false;
  }
  if (code) {
    return (error as { code: string }).code === code;
  }
  return typeof (error as { code: string }).code === 'string';
}

/**
 * Get suggested spec-kit command based on feature state and project constitution.
 * Follows the spec-kit workflow:
 * /speckit.constitution → /speckit.specify → /speckit.clarify (optional)
 *         ↓
 * /speckit.plan → /speckit.checklist (optional) → /speckit.tasks
 *         ↓
 * /speckit.analyze (optional) → /speckit.implement
 */
export function getSuggestedCommand(feature: Feature, hasConstitution: boolean): CommandSuggestion {
  // Check constitution first (project-level)
  if (!hasConstitution) {
    return {
      primary: {
        command: '/speckit.constitution',
        title: 'Create Project Constitution',
        description: 'Define project principles, tech stack, and constraints that guide all feature development.',
        isOptional: false,
      },
      optional: null,
    };
  }

  // Stage: specify - no spec.md
  if (!feature.hasSpec) {
    return {
      primary: {
        command: '/speckit.specify',
        title: 'Create Feature Specification',
        description: 'Define user stories, acceptance criteria, and requirements for this feature.',
        isOptional: false,
      },
      optional: null,
    };
  }

  // Stage: plan - has spec, no plan.md
  if (!feature.hasPlan) {
    return {
      primary: {
        command: '/speckit.plan',
        title: 'Create Implementation Plan',
        description: 'Design the technical approach, architecture, and implementation strategy.',
        isOptional: false,
      },
      optional: feature.totalClarifications === 0 ? {
        command: '/speckit.clarify',
        title: 'Clarify Requirements',
        description: 'Ask questions to resolve ambiguities in the specification.',
        isOptional: true,
      } : null,
    };
  }

  // Stage: tasks - has plan, no tasks.md
  if (!feature.hasTasks) {
    return {
      primary: {
        command: '/speckit.tasks',
        title: 'Generate Task Breakdown',
        description: 'Break down the implementation plan into actionable, trackable tasks.',
        isOptional: false,
      },
      optional: !feature.hasChecklists ? {
        command: '/speckit.checklist',
        title: 'Create QA Checklist',
        description: 'Generate quality assurance checklists for testing and review.',
        isOptional: true,
      } : null,
    };
  }

  // Stage: implement - has tasks, not all complete
  if (feature.completedTasks < feature.totalTasks) {
    return {
      primary: {
        command: '/speckit.implement',
        title: 'Continue Implementation',
        description: `${feature.totalTasks - feature.completedTasks} tasks remaining. Continue building the feature.`,
        isOptional: false,
      },
      optional: !feature.analysis ? {
        command: '/speckit.analyze',
        title: 'Analyze Progress',
        description: 'Check implementation progress against the specification.',
        isOptional: true,
      } : null,
    };
  }

  // Stage: complete - all tasks done
  if (feature.completedTasks === feature.totalTasks && feature.totalTasks > 0) {
    // Check if analysis exists
    if (!feature.analysis) {
      return {
        primary: {
          command: '/speckit.analyze',
          title: 'Verify Implementation',
          description: 'Analyze the completed feature against the specification for alignment.',
          isOptional: false,
        },
        optional: null,
      };
    }

    // Feature is complete with analysis
    return {
      primary: null,
      optional: null,
    };
  }

  // Default fallback
  return {
    primary: null,
    optional: null,
  };
}

/**
 * Copy text to clipboard (T010)
 *
 * Uses the modern Clipboard API with fallback for older browsers.
 * Returns true on success, false on failure.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Try modern Clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to fallback
    }
  }

  // Fallback for older browsers using textarea + execCommand
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}
