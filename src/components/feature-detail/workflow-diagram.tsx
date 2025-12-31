'use client';

import { Check, Sparkles, FileText, MessageSquare, Map as MapIcon, ClipboardList, ListTodo, Search, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/tooltip';
import type { Feature } from '@/types';

// Phase definitions
type WorkflowPhase = 'planning' | 'qc' | 'wbs' | 'qa' | 'coding';

interface PhaseConfig {
  label: string;
  color: string;
}

const PHASE_CONFIG: Record<WorkflowPhase, PhaseConfig> = {
  planning: { label: 'PLANNING', color: 'text-purple-400' },
  qc: { label: 'QUALITY CONTROL', color: 'text-orange-400' },
  wbs: { label: 'WORK BREAKDOWN', color: 'text-cyan-400' },
  qa: { label: 'QUALITY ASSURANCE', color: 'text-yellow-400' },
  coding: { label: 'CODING', color: 'text-green-400' },
};

interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  isOptional: boolean;
  isComplete: boolean;
  isCurrent: boolean;
  phase: WorkflowPhase;
  // Inline count display (e.g., "7 US 49/69")
  inlineCount?: string;
}

interface WorkflowDiagramProps {
  feature: Feature;
  hasConstitution: boolean;
}

function getWorkflowSteps(feature: Feature, hasConstitution: boolean): WorkflowStep[] {
  const allTasksComplete = feature.totalTasks > 0 && feature.completedTasks === feature.totalTasks;

  let currentStep = '';
  if (!hasConstitution) currentStep = 'constitution';
  else if (!feature.hasSpec) currentStep = 'specify';
  else if (!feature.hasPlan) currentStep = 'plan';
  else if (!feature.hasTasks) currentStep = 'tasks';
  else if (!allTasksComplete) currentStep = 'implement';
  else if (!feature.analysis) currentStep = 'analyze';

  // Build inline counts
  const clarificationCount = feature.clarificationSessions?.reduce(
    (sum, s) => sum + s.clarifications.length, 0
  ) ?? 0;
  const checklistFiles = feature.additionalFiles?.filter(f => f.type === 'checklist') ?? [];

  return [
    // PLANNING phase
    {
      id: 'constitution',
      label: 'Constitution',
      description: 'Establish project principles',
      icon: <Sparkles className="w-4 h-4" />,
      isOptional: false,
      isComplete: hasConstitution,
      isCurrent: currentStep === 'constitution',
      phase: 'planning',
    },
    {
      id: 'specify',
      label: 'Specify',
      description: 'Create baseline specification',
      icon: <FileText className="w-4 h-4" />,
      isOptional: false,
      isComplete: feature.hasSpec,
      isCurrent: currentStep === 'specify',
      phase: 'planning',
    },
    {
      id: 'clarify',
      label: 'Clarify',
      description: 'De-risk ambiguous areas',
      icon: <MessageSquare className="w-4 h-4" />,
      isOptional: true,
      isComplete: clarificationCount > 0,
      isCurrent: currentStep === 'clarify',
      phase: 'planning',
      inlineCount: clarificationCount > 0 ? `${clarificationCount} Q&A` : undefined,
    },
    {
      id: 'plan',
      label: 'Plan',
      description: 'Create implementation plan',
      icon: <MapIcon className="w-4 h-4" />,
      isOptional: false,
      isComplete: feature.hasPlan,
      isCurrent: currentStep === 'plan',
      phase: 'planning',
    },
    // QUALITY CONTROL phase
    {
      id: 'checklist',
      label: 'Checklist',
      description: 'Validate requirements',
      icon: <ClipboardList className="w-4 h-4" />,
      isOptional: true,
      isComplete: feature.hasChecklists,
      isCurrent: currentStep === 'checklist',
      phase: 'qc',
      inlineCount: checklistFiles.length > 0
        ? `${checklistFiles.length} ${checklistFiles.length === 1 ? 'checklist' : 'checklists'} ${feature.completedChecklistItems}/${feature.totalChecklistItems}`
        : undefined,
    },
    // WORK BREAKDOWN STRUCTURE phase
    {
      id: 'tasks',
      label: 'Tasks',
      description: 'Generate actionable tasks',
      icon: <ListTodo className="w-4 h-4" />,
      isOptional: false,
      isComplete: feature.hasTasks,
      isCurrent: currentStep === 'tasks',
      phase: 'wbs',
      inlineCount: feature.taskGroups.length > 0
        ? `${feature.taskGroups.length} US ${feature.completedTasks}/${feature.totalTasks}`
        : feature.totalTasks > 0
          ? `${feature.completedTasks}/${feature.totalTasks}`
          : undefined,
    },
    // QUALITY ASSURANCE phase
    {
      id: 'analyze',
      label: 'Analyze',
      description: 'Cross-artifact consistency',
      icon: <Search className="w-4 h-4" />,
      isOptional: true,
      isComplete: !!feature.analysis,
      isCurrent: currentStep === 'analyze',
      phase: 'qa',
    },
    // CODING phase
    {
      id: 'implement',
      label: 'Implement',
      description: 'Execute implementation',
      icon: <Rocket className="w-4 h-4" />,
      isOptional: false,
      isComplete: allTasksComplete,
      isCurrent: currentStep === 'implement',
      phase: 'coding',
      inlineCount: feature.totalTasks > 0 ? `${feature.completedTasks}/${feature.totalTasks}` : undefined,
    },
  ];
}

// Simple menu item - no expansion, just inline display
function WorkflowItem({ step }: { step: WorkflowStep }) {
  return (
    <Tooltip content={step.description} side="right" delay={200}>
      <div className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg transition-all',
        step.isCurrent && 'bg-amber-500/10 ring-1 ring-amber-500/30',
        !step.isCurrent && 'hover:bg-[var(--secondary)]/50'
      )}>
        {/* Status indicator */}
        <div className={cn(
          'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
          step.isComplete
            ? 'bg-emerald-500 text-white'
            : step.isCurrent
              ? 'bg-amber-500 text-white'
              : 'bg-[var(--secondary)] text-[var(--muted-foreground)]'
        )}>
          {step.isComplete ? <Check className="w-3 h-3" /> : step.icon}
        </div>

        {/* Label */}
        <span className={cn(
          'text-sm font-medium',
          step.isComplete && 'text-emerald-400',
          step.isCurrent && 'text-amber-400'
        )}>
          {step.label}
        </span>

        {/* Optional badge */}
        {step.isOptional && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
            opt
          </span>
        )}

        {/* Current step badge */}
        {step.isCurrent && (
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500 text-white font-bold">
            NEXT
          </span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Inline count */}
        {step.inlineCount && (
          <span className={cn(
            'text-xs font-mono',
            step.isComplete ? 'text-emerald-400' : 'text-[var(--muted-foreground)]'
          )}>
            {step.inlineCount}
          </span>
        )}
      </div>
    </Tooltip>
  );
}

// Group steps by phase
function groupStepsByPhase(steps: WorkflowStep[]): Map<WorkflowPhase, WorkflowStep[]> {
  const grouped = new Map<WorkflowPhase, WorkflowStep[]>();

  for (const phase of Object.keys(PHASE_CONFIG) as WorkflowPhase[]) {
    grouped.set(phase, []);
  }

  for (const step of steps) {
    const group = grouped.get(step.phase);
    if (group) {
      group.push(step);
    }
  }

  return grouped;
}

export function WorkflowDiagram({ feature, hasConstitution }: WorkflowDiagramProps) {
  const steps = getWorkflowSteps(feature, hasConstitution);
  const groupedSteps = groupStepsByPhase(steps);

  const requiredSteps = steps.filter(s => !s.isOptional);
  const completedRequired = requiredSteps.filter(s => s.isComplete).length;
  const progressPercent = Math.round((completedRequired / requiredSteps.length) * 100);
  const allComplete = requiredSteps.every(s => s.isComplete);

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Spec-Kit Workflow</h3>
            <p className="text-xs text-[var(--muted-foreground)]">Click step to expand details</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className={cn('text-lg font-bold tabular-nums', allComplete ? 'text-emerald-400' : '')}>
              {progressPercent}%
            </span>
            <p className="text-xs text-[var(--muted-foreground)]">
              {completedRequired}/{requiredSteps.length} steps
            </p>
          </div>
          <div className="w-12 h-12 relative">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="var(--secondary)"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke={allComplete ? '#22c55e' : '#f59e0b'}
                strokeWidth="3"
                strokeDasharray={`${progressPercent} 100`}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Workflow phases */}
      <div className="p-3">
        {allComplete ? (
          <div className="flex items-center justify-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <Check className="w-5 h-5 text-emerald-500" />
            <span className="font-semibold text-emerald-400">Workflow Complete!</span>
          </div>
        ) : (
          <div className="space-y-4">
            {(Object.keys(PHASE_CONFIG) as WorkflowPhase[]).map((phase) => {
              const phaseSteps = groupedSteps.get(phase) || [];
              if (phaseSteps.length === 0) return null;

              const config = PHASE_CONFIG[phase];

              return (
                <div key={phase}>
                  {/* Phase header */}
                  <div className={cn('text-[10px] font-bold tracking-wider mb-1 px-2', config.color)}>
                    {config.label}
                  </div>

                  {/* Phase steps */}
                  <div className="space-y-0.5">
                    {phaseSteps.map((step) => (
                      <WorkflowItem
                        key={step.id}
                        step={step}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
