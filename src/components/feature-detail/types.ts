import type { Feature, Task } from '@/types';

// Section IDs for navigation
export type SectionId =
  | 'constitution'
  | 'spec'
  | 'plan'
  | 'tasks'
  | 'research'
  | 'data-model'
  | 'quickstart'
  | 'contracts'
  | 'checklists'
  | 'analysis'
  | 'clarifications';

// Section status indicators
export type SectionStatus = 'complete' | 'in-progress' | 'pending' | 'none';

// Workflow phase groupings
export type WorkflowPhase = 'planning' | 'coding' | 'qa' | 'qc';

// Nav workflow phases (includes overview for the new nav design)
export type NavWorkflowPhase = 'overview' | 'planning' | 'qc' | 'wbs' | 'qa' | 'coding';

// Workflow sub-item types for hierarchical nav
export type WorkflowSubItemType = 'file' | 'clarification' | 'checklist' | 'user-story' | 'analysis' | 'action' | 'progress';

// Sub-item in workflow step
export interface WorkflowSubItem {
  id: string;
  label: string;           // "spec.md", "US1 19/19", "checklist 1 16/36"
  type: WorkflowSubItemType;
  sectionId?: SectionId;   // For opening in content pane
  filePath?: string;       // For file items
  progress?: { completed: number; total: number };
  command?: string;        // For action items (slash command to copy)
}

// Workflow step for nav
export interface WorkflowNavStep {
  id: string;
  command: string;         // "/speckit.constitution"
  label: string;           // "Constitution"
  description: string;     // "Establish project principles"
  isOptional: boolean;
  isComplete: boolean;
  isCurrent: boolean;
  phase: NavWorkflowPhase;
  subItems: WorkflowSubItem[];
}

// Nav workflow phase config
export interface NavPhaseConfig {
  label: string;
  color: string;
}

// Section configuration
export interface SectionConfig {
  id: SectionId;
  label: string;
  phase: WorkflowPhase;
  show: boolean;
  status: SectionStatus;
  taskCount?: { completed: number; total: number };
  groupCount?: { count: number; label: string };  // e.g., "5 US" or "3 checklists"
  filePath?: string;
}

// Navigation item for drag-and-drop
export interface NavItemData {
  id: SectionId;
  label: string;
  status: SectionStatus;
  taskCount?: { completed: number; total: number };
}

// Split view state
export interface SplitViewState {
  isActive: boolean;
  leftPane: SectionId;
  rightPane: SectionId | null;
  splitRatio: number; // 0.0 to 1.0, default 0.5
  focusedPane: 'left' | 'right';
}

// Feature detail state
export interface FeatureDetailState {
  feature: Feature;
  activeSection: SectionId;
  splitView: SplitViewState;
  isLeftPanelCollapsed: boolean;
  selectedNavIndex: number;
}

// Props for sub-components
export interface HeaderBarProps {
  featureName: string;
  featureId: string;
  onClose: () => void;
  onToggleSplit: () => void;
  isSplitActive: boolean;
}

export interface StatusHeaderProps {
  feature: Feature;
  progressPercentage: number;
  nextTask: Task | null;
}

export interface NavSidebarProps {
  sections: SectionConfig[];
  activeSection: SectionId;
  selectedIndex: number;
  onSectionClick: (sectionId: SectionId) => void;
  onSectionDragStart: (sectionId: SectionId) => void;
  onSectionDragEnd: () => void;
}

export interface ContentPaneProps {
  sectionId: SectionId;
  feature: Feature;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export interface SplitViewProps {
  leftSection: SectionId;
  rightSection: SectionId | null;
  feature: Feature;
  splitRatio: number;
  onRatioChange: (ratio: number) => void;
  onCloseRight: () => void;
  focusedPane: 'left' | 'right';
  onFocusChange: (pane: 'left' | 'right') => void;
}

// Drag and drop types
export interface DragState {
  isDragging: boolean;
  draggedSection: SectionId | null;
  dropTarget: 'left' | 'right' | null;
}

// Stage order for determining progress
export const STAGE_ORDER = ['specify', 'plan', 'tasks', 'implement', 'complete'] as const;

// Phase configuration
export const PHASE_CONFIG: Record<WorkflowPhase, { label: string; sections: SectionId[] }> = {
  planning: {
    label: 'PLANNING',
    sections: ['spec', 'plan', 'research', 'data-model'],
  },
  coding: {
    label: 'CODING',
    sections: ['tasks'],
  },
  qa: {
    label: 'QA',
    sections: ['analysis'],
  },
  qc: {
    label: 'QC',
    sections: ['checklists'],
  },
};

// Helper to get stage index
export function getStageIndex(stage: string): number {
  return STAGE_ORDER.indexOf(stage as typeof STAGE_ORDER[number]);
}

// Determine section status based on feature stage and file existence
export function getSectionStatus(sectionId: SectionId, feature: Feature): SectionStatus {
  const currentStageIndex = getStageIndex(feature.stage);

  if (sectionId === 'spec') {
    if (feature.hasSpec && currentStageIndex > 0) return 'complete';
    if (feature.stage === 'specify') return 'in-progress';
    if (!feature.hasSpec) return 'pending';
    return 'none';
  }

  if (sectionId === 'plan') {
    if (feature.hasPlan && currentStageIndex > 1) return 'complete';
    if (feature.stage === 'plan') return 'in-progress';
    if (!feature.hasPlan) return 'pending';
    return 'none';
  }

  if (sectionId === 'tasks') {
    if (feature.hasTasks && currentStageIndex > 2) return 'complete';
    if (feature.stage === 'tasks') return 'in-progress';
    if (!feature.hasTasks) return 'pending';
    return 'none';
  }

  return 'none';
}

// Get the next incomplete task
export function getNextTask(feature: Feature): Task | null {
  // Check task groups first (new format)
  if (feature.taskGroups && feature.taskGroups.length > 0) {
    for (const group of feature.taskGroups) {
      const nextTask = group.tasks.find(t => !t.completed);
      if (nextTask) return nextTask;
    }
  }

  // Fallback to phases (old format)
  for (const phase of feature.phases) {
    const nextTask = phase.tasks.find(t => !t.completed);
    if (nextTask) return nextTask;
  }

  // Fallback to flat tasks
  return feature.tasks.find(t => !t.completed) || null;
}

// Nav workflow phase configuration
export const NAV_PHASE_CONFIG: Record<NavWorkflowPhase, NavPhaseConfig> = {
  overview: { label: 'OVERVIEW', color: 'text-blue-400' },
  planning: { label: 'PLANNING', color: 'text-purple-400' },
  qc: { label: 'QUALITY CONTROL', color: 'text-orange-400' },
  wbs: { label: 'WORK BREAKDOWN', color: 'text-cyan-400' },
  qa: { label: 'QUALITY ASSURANCE', color: 'text-yellow-400' },
  coding: { label: 'CODING', color: 'text-green-400' },
};
