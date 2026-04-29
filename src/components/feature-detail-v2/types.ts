import type { Feature, Task, UserStory, TaskGroup } from '@/types';

// Document types available in the dropdown
export type DocumentType = 'spec' | 'plan' | 'clarifications' | 'tasks' | 'research' | 'data-model' | 'quickstart' | 'contract' | 'checklist' | 'analysis' | 'impact';

export interface DocumentOption {
  type: DocumentType;
  label: string;
  available: boolean;
  content: string | null;
}

// Props for the main modal
export interface FeatureDetailV2Props {
  feature: Feature;
  onClose: () => void;
  onDelete?: () => void;
  onStageChange?: (stage: string) => void;
  initialDocument?: DocumentType;
}

// Props for UserStoryPanel
export interface UserStoryPanelProps {
  feature: Feature;
  userStories: UserStory[];
  taskGroups: TaskGroup[];
  orphanTasks: Task[];
  onTaskClick: (task: Task, userStoryId: string | null) => void;
  selectedTaskId: string | null;
  focusedCardIndex?: number | null; // Keyboard navigation: which card is focused
}

// Props for UserStoryCard
export interface UserStoryCardProps {
  userStory: UserStory;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  selectedTaskId: string | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isFocused?: boolean; // Keyboard navigation: is this card focused
}

// Props for TaskRow
export interface TaskRowProps {
  task: Task;
  onClick: () => void;
  isSelected: boolean;
}

// Props for DocumentPanel
export interface DocumentPanelProps {
  feature: Feature;
  featureId: string;
  selectedDocument: DocumentType;
  onDocumentChange: (doc: DocumentType) => void;
  highlightTaskId: string | null;
  contentRef: React.RefObject<HTMLDivElement | null>;
  onEditClarifications?: () => void;
  onContentSaved?: () => void;
}

// Props for DocumentSelector
export interface DocumentSelectorProps {
  options: DocumentOption[];
  selected: DocumentType;
  onChange: (doc: DocumentType) => void;
}

// Helper to get document options from feature
export function getDocumentOptions(feature: Feature): DocumentOption[] {
  const options: DocumentOption[] = [
    {
      type: 'spec',
      label: 'Spec',
      available: feature.hasSpec,
      content: feature.specContent,
    },
    {
      type: 'clarifications',
      label: 'Clarifications',
      available: !!feature.clarificationsContent,
      content: feature.clarificationsContent,
    },
    {
      type: 'plan',
      label: 'Plan',
      available: feature.hasPlan,
      content: feature.planContent,
    },
    {
      type: 'tasks',
      label: 'Tasks',
      available: feature.hasTasks,
      content: feature.tasksContent,
    },
    // Phase 1 artifacts - stored directly in feature fields
    {
      type: 'research',
      label: 'Research',
      available: !!feature.researchContent,
      content: feature.researchContent,
    },
    {
      type: 'data-model',
      label: 'Data Model',
      available: !!feature.dataModelContent,
      content: feature.dataModelContent,
    },
    {
      type: 'quickstart',
      label: 'Quickstart',
      available: !!feature.quickstartContent,
      content: feature.quickstartContent,
    },
    {
      type: 'contract',
      label: 'Contracts',
      available: !!feature.contractsContent,
      content: feature.contractsContent,
    },
    {
      type: 'checklist',
      label: 'Checklist',
      available: !!feature.checklistsContent,
      content: feature.checklistsContent,
    },
    {
      type: 'analysis',
      label: 'Analysis',
      available: !!feature.analysisContent,
      content: feature.analysisContent,
    },
    {
      type: 'impact',
      label: 'Impact',
      available: true,
      content: null,
    },
  ];

  // Legacy: Add additional files from additionalFiles array (for backwards compatibility)
  for (const file of feature.additionalFiles || []) {
    if (file.exists && !options.find(o => o.type === file.type)) {
      const typeToLabel: Record<string, string> = {
        'research': 'Research',
        'data-model': 'Data Model',
        'quickstart': 'Quickstart',
        'contract': 'Contract',
        'checklist': 'Checklist',
      };

      if (typeToLabel[file.type]) {
        options.push({
          type: file.type as DocumentType,
          label: typeToLabel[file.type],
          available: true,
          content: file.content,
        });
      }
    }
  }

  return options;
}

// Helper to group tasks by user story
export function groupTasksByUserStory(
  tasks: Task[],
  userStories: UserStory[]
): { grouped: Map<string, Task[]>; orphans: Task[] } {
  const grouped = new Map<string, Task[]>();
  const orphans: Task[] = [];

  // Initialize groups for each user story
  for (const us of userStories) {
    grouped.set(us.id, []);
  }

  // Distribute tasks
  for (const task of tasks) {
    if (task.userStory && grouped.has(task.userStory)) {
      grouped.get(task.userStory)!.push(task);
    } else {
      orphans.push(task);
    }
  }

  return { grouped, orphans };
}
