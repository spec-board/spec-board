export type FeatureStage = 'specify' | 'plan' | 'tasks' | 'implement' | 'complete';

// User Story types for spec.md parsing (T001)
export interface UserStory {
  id: string;           // 'US1', 'US2', etc.
  title: string;
  priority: 'P1' | 'P2' | 'P3';
  description: string;
  acceptanceCriteria: string[];
}

// Technical Context types for plan.md parsing (T002)
export interface TechnicalContext {
  language: string;
  dependencies: string[];
  storage: string;
  testing: string;
  platform: string;
}

// Task Group types for user story grouping (T003)
export interface TaskGroup {
  storyId: string | null;  // 'US1', 'US2', or null for ungrouped
  storyTitle: string;      // From spec.md or "Other Tasks"
  tasks: Task[];
  completedCount: number;
  totalCount: number;
}

// Spec-Kit File types for additional files (T004)
export type SpecKitFileType = 'spec' | 'plan' | 'tasks' | 'research' | 'data-model' | 'quickstart' | 'contract' | 'checklist' | 'analysis';

export interface SpecKitFile {
  type: SpecKitFileType;
  path: string;
  content: string;
  exists: boolean;
}

// Analysis types for spec alignment tracking
export interface AnalysisItem {
  requirement: string;
  status: 'implemented' | 'partial' | 'missing';
  evidence?: string;
}

export interface SpecAlignment {
  score: number;
  totalRequirements: number;
  implemented: number;
  partial: number;
  missing: number;
  items: AnalysisItem[];
}

export interface AnalysisData {
  version: string;
  timestamp: string;
  specAlignment: SpecAlignment;
}

export interface FeatureAnalysis {
  jsonData: AnalysisData | null;
  markdownContent: string | null;
  jsonPath: string | null;
  markdownPath: string | null;
}

// Clarification types for tracking Q&A history
export interface Clarification {
  question: string;
  answer: string;
}

export interface ClarificationSession {
  date: string; // YYYY-MM-DD format
  clarifications: Clarification[];
}

// Constitution types for project-level principles
export interface ConstitutionPrinciple {
  name: string;
  description: string;
}

export interface ConstitutionSubsection {
  name: string;
  content: string;
}

export interface ConstitutionSection {
  name: string;
  content: string;
  subsections: ConstitutionSubsection[];
}

// Sync Impact Report from constitution.md HTML comment
export interface SyncImpactReport {
  versionChange?: string;        // e.g., "0.0.0 → 1.0.0 (Initial ratification)"
  modifiedPrinciples?: string;
  addedSections: string[];
  removedSections: string[];
  templatesStatus: { template: string; status: string }[];
  followUpTodos?: string;
}

export interface Constitution {
  rawContent: string;
  title?: string;
  principles: ConstitutionPrinciple[];
  sections: ConstitutionSection[];
  version?: string;
  ratifiedDate?: string;
  lastAmendedDate?: string;
  syncImpactReport?: SyncImpactReport;
}

export interface Task {
  id: string;
  description: string;
  completed: boolean;
  parallel: boolean;
  userStory?: string;
  filePath?: string;
}

export interface TaskPhase {
  name: string;
  tasks: Task[];
}

export interface Feature {
  id: string;
  name: string;
  path: string;
  stage: FeatureStage;
  hasSpec: boolean;
  hasPlan: boolean;
  hasTasks: boolean;
  tasks: Task[];
  phases: TaskPhase[];
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  // Feature branch name from spec.md or plan.md
  branch: string | null;
  // Clarification history from spec.md
  clarificationSessions: ClarificationSession[];
  totalClarifications: number;
  // Extended fields for full spec-kit integration (T005)
  userStories: UserStory[];
  technicalContext: TechnicalContext | null;
  taskGroups: TaskGroup[];
  specContent: string | null;
  planContent: string | null;
  additionalFiles: SpecKitFile[];
  // Analysis data for spec alignment tracking
  analysis: FeatureAnalysis | null;
  // Checklist completion tracking
  hasChecklists: boolean;
  totalChecklistItems: number;
  completedChecklistItems: number;
}

export interface Project {
  path: string;
  name: string;
  features: Feature[];
  lastUpdated: Date;
  // Project-level constitution
  constitution: Constitution | null;
  hasConstitution: boolean;
}

export interface WebSocketMessage {
  type: 'update' | 'error' | 'connected';
  data?: Project;
  error?: string;
}

// ============================================
// Parsed Markdown Types for Structured Viewers
// ============================================

// Plan.md parsed types
export interface PlanMetadata {
  branch?: string;
  date?: string;
  specLink?: string;
  input?: string;
}

export interface ConstitutionCheckItem {
  principle: string;
  requirement: string;
  status: string;
}

export interface ConstitutionCheckData {
  items: ConstitutionCheckItem[];
  note?: string;
}

export interface ComplexityItem {
  aspect: string;
  decision: string;
  rationale: string;
}

export interface ProjectStructureItem {
  title: string;
  codeBlock: string;
  description?: string;
}

export interface ComplexityTrackingData {
  items: ComplexityItem[];
  note?: string;
}

export interface PlanSection {
  title: string;
  content: string;
}

export interface ParsedPlan {
  rawContent: string;
  metadata: PlanMetadata;
  summary?: string;
  technicalContext: Record<string, string>;
  constitutionCheck: ConstitutionCheckData;
  qualityGates: string[];
  projectStructure: ProjectStructureItem[];
  complexityTracking: ComplexityTrackingData;
  otherSections: PlanSection[];
}

// Research.md parsed types
export interface TechnologyDecision {
  id: number;
  title: string;
  decision: string;
  rationale: string[];
  alternatives: { name: string; reason: string }[];
}

export interface ResearchSection {
  title: string;
  content: string;
}

export interface ParsedResearch {
  rawContent: string;
  feature?: string;
  date?: string;
  technologyDecisions: TechnologyDecision[];
  otherSections: ResearchSection[];
}

// Quickstart.md parsed types
export interface SetupStep {
  id: number;
  title: string;
  commands: { description?: string; code: string; language?: string }[];
}

export interface VerificationItem {
  text: string;
  checked: boolean;
}

export interface QuickstartSection {
  title: string;
  content: string;
}

export interface ParsedQuickstart {
  rawContent: string;
  feature?: string;
  date?: string;
  prerequisites: string[];
  setupSteps: SetupStep[];
  developmentCommands: { title: string; command: string; description?: string }[];
  projectScripts?: string;
  verificationChecklist: VerificationItem[];
  keyFilesToCreate: string[];
  browserSupport: string[];
  otherSections: QuickstartSection[];
}

// Data-model.md parsed types
export interface EntityProperty {
  name: string;
  type: string;
  description?: string;
}

export interface DataEntity {
  name: string;
  description?: string;
  properties: EntityProperty[];
  codeBlock?: string;
}

export interface DataEnum {
  name: string;
  values: { name: string; value: string; description?: string }[];
  codeBlock?: string;
}

export interface ValidationRule {
  field: string;
  rules: string[];
}

export interface StateTransition {
  state: string;
  condition: string;
  transitionsTo: string[];
}

export interface StorageSchema {
  key: string;
  type: string;
  description: string;
}

export interface DataIntegrityRule {
  title: string;
  items: string[];
}

export interface ParsedDataModel {
  rawContent: string;
  feature?: string;
  date?: string;
  entities: DataEntity[];
  enums: DataEnum[];
  validationRules: ValidationRule[];
  stateTransitions: StateTransition[];
  storageSchema: StorageSchema[];
  sortingBehavior: { option: string; description: string }[];
  filteringBehavior: { filter: string; condition: string }[];
  searchBehavior: string[];
  dataIntegrity: DataIntegrityRule[];
}
