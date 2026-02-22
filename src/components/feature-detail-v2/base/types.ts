import type { Feature, FeatureStage } from '@/types';

export type {
  Feature,
  FeatureStage
};

// Base props for all stage modals
export interface BaseModalProps {
  feature: Feature;
  onClose: () => void;
  onStageChange?: (stage: FeatureStage) => void;
  onDelete?: () => void;
}

// Props for left panel in each stage
export interface LeftPanelProps {
  feature: Feature;
}

// Props for right panel in each stage
export interface RightPanelProps {
  feature: Feature;
}

// Stage configuration
export interface StageConfig {
  stage: FeatureStage;
  label: string;
  description: string;
}

// All stages configuration
export const STAGES: StageConfig[] = [
  { stage: 'backlog', label: 'Backlog', description: 'Feature ideas and descriptions' },
  { stage: 'specs', label: 'Specs', description: 'Spec + Clarifications' },
  { stage: 'plan', label: 'Plan', description: 'Implementation plan with checklist' },
  { stage: 'tasks', label: 'Tasks', description: 'Task breakdown with analysis' },
];

// Get stage config by stage name
export function getStageConfig(stage: FeatureStage): StageConfig {
  return STAGES.find(s => s.stage === stage) || STAGES[0];
}
