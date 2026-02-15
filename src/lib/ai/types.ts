/**
 * AI Service Types - Compatible with Claude & OpenAI API formats
 * Designed for easy swapping between mock and real AI providers
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionRequest {
  model?: string;
  messages: AIMessage[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface AICompletionResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Provider types
export type AIProvider = 'anthropic' | 'openai';

// Configuration
export interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
  baseUrl?: string; // For custom endpoints
}

// Generation workflow types - aligned with Speckit workflow
// specify → clarify → plan → tasks → analyze

// Step 1: Specify - Generate spec from feature description
export interface GenerateSpecOptions {
  featureName: string;
  description: string;
  projectContext?: string;
}

export interface GeneratedSpec {
  userStories: GeneratedUserStory[];
  edgeCases: string[];
  functionalRequirements: string[];
  successCriteria: string[];
  keyEntities: string[];
}

// Step 2: Clarify - Generate clarification questions
export interface GenerateClarifyOptions {
  specContent: string;
}

export interface ClarificationQuestion {
  question: string;
  context: string;
}

// Step 3: Plan - Generate technical plan
export interface GeneratePlanOptions {
  specContent: string;
  clarifications?: ClarificationAnswer[];
  constitution?: string;
  projectContext?: string;
}

export interface ClarificationAnswer {
  question: string;
  answer: string;
}

export interface GeneratedPlan {
  summary: string;
  technicalContext: TechnicalContext;
  projectStructure: ProjectStructure;
  complexityViolations?: ComplexityViolation[];
}

export interface TechnicalContext {
  language: string;
  version?: string;
  dependencies: string[];
  storage: string;
  testing: string;
  platform: string;
  performanceGoals?: string;
  constraints?: string;
}

export interface ProjectStructure {
  decision: string;
  structure: string;
}

export interface ComplexityViolation {
  violation: string;
  reason: string;
  rejectedAlternative: string;
}

// Step 4: Tasks - Generate task breakdown
export interface GenerateTasksOptions {
  specContent: string;
  planContent: string;
}

export interface GeneratedTasks {
  phases: TaskPhase[];
}

export interface TaskPhase {
  name: string;
  purpose: string;
  checkpoint?: string;
  tasks: TaskItem[];
}

export interface TaskItem {
  id: string;
  description: string;
  userStory?: string;
  parallel?: boolean;
}

// Step 5: Analyze - Validate consistency
export interface AnalyzeOptions {
  specContent: string;
  planContent: string;
  tasksContent: string;
  constitution?: string;
}

export interface AnalysisResult {
  isValid: boolean;
  specPlanConsistency: ConsistencyCheck;
  planTasksConsistency: ConsistencyCheck;
  constitutionAlignment: ConsistencyCheck;
  issues: AnalysisIssue[];
}

export interface ConsistencyCheck {
  isConsistent: boolean;
  score: number; // 0-100
  details: string;
}

export interface AnalysisIssue {
  severity: 'error' | 'warning' | 'info';
  category: 'consistency' | 'alignment' | 'completeness';
  message: string;
  location?: string;
}

// Legacy types - kept for backward compatibility
export interface GenerateUserStoriesOptions {
  prdContent: string;
  projectContext?: string;
}

export interface GenerateSpecKitOptions {
  prdContent: string;
  featureName: string;
  projectContext?: string;
}

// Output types
export interface GeneratedUserStory {
  id: string;
  title: string;
  description: string;
  priority: 'P1' | 'P2' | 'P3';
  acceptanceCriteria: string[];
}

export interface GeneratedSpecKit {
  spec: {
    userStories: GeneratedUserStory[];
    clarifications: Array<{ question: string; answer: string }>;
  };
  plan: {
    summary: string;
    technicalContext: {
      language: string;
      dependencies: string[];
      storage: string;
      testing: string;
      platform: string;
    };
  };
  tasks: {
    phases: Array<{
      name: string;
      tasks: Array<{
        id: string;
        description: string;
        userStory?: string;
      }>;
    }>;
  };
}
