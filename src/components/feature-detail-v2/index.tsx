export { FeatureDetailV2 } from './feature-detail-v2';
export { UserStoryPanel } from './user-story-panel';
export { UserStoryCard } from './user-story-card';
export { TaskRow } from './task-row';
export { DocumentPanel } from './document-panel';
export { DocumentSelector } from './document-selector';
export { TasksModal } from './stages/tasks-modal';
export { createPlaceholderModal } from './stages/placeholder-modal';

// Re-export types
export type {
  DocumentType,
  DocumentOption,
  FeatureDetailV2Props,
  UserStoryPanelProps,
  UserStoryCardProps,
  TaskRowProps,
  DocumentPanelProps,
  DocumentSelectorProps,
} from './types';

// Stage-based modal router
import type { Feature } from '@/types';
import type { FeatureDetailV2Props } from './types';
import { TasksModal } from './stages/tasks-modal';
import { SpecifyModal } from './stages/specify-modal';
import { createPlaceholderModal } from './stages/placeholder-modal';
import { ClarifyModal } from './stages/clarify-modal';
import { PlanModal } from './stages/plan-modal';
import { ChecklistModal } from './stages/checklist-modal';
import { AnalyzeModal } from './stages/analyze-modal';

// Router based on feature stage
const STAGE_MODALS = {
  specify: SpecifyModal,
  clarify: ClarifyModal,
  plan: PlanModal,
  checklist: ChecklistModal,
  tasks: TasksModal,
  analyze: AnalyzeModal,
} as const;

type StageModalKey = keyof typeof STAGE_MODALS;

// Main exported component - routes to correct stage modal
export function FeatureDetailByStage({ feature, onClose, initialDocument }: FeatureDetailV2Props) {
  const StageModal = STAGE_MODALS[feature.stage as StageModalKey] || TasksModal;
  return <StageModal feature={feature} onClose={onClose} />;
}
