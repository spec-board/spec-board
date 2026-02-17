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
  { stage: 'specify', label: 'Specify', description: 'Creating specification' },
  { stage: 'clarify', label: 'Clarify', description: 'Answering questions' },
  { stage: 'plan', label: 'Plan', description: 'Creating implementation plan' },
  { stage: 'checklist', label: 'Checklist', description: 'Quality checklist' },
  { stage: 'tasks', label: 'Tasks', description: 'Task breakdown' },
  { stage: 'analyze', label: 'Analyze', description: 'Consistency analysis' },
];

// Get stage config by stage name
export function getStageConfig(stage: FeatureStage): StageConfig {
  return STAGES.find(s => s.stage === stage) || STAGES[0];
}
