// AI Service exports
export * from './types';
export * from './mock';
export * from './settings';
export { AIService } from './client';

// Re-export functions directly to avoid Turbopack class instance issues
import {
  generateUserStories as mockGenerateUserStories,
  generateSpecKit as mockGenerateSpecKit,
  generateSpec as mockGenerateSpec,
  generateClarify as mockGenerateClarify,
  generatePlan as mockGeneratePlan,
  generateTasks as mockGenerateTasks,
  analyzeDocuments as mockAnalyzeDocuments
} from './mock';
import type {
  GenerateUserStoriesOptions,
  GenerateSpecKitOptions,
  GenerateSpecOptions,
  GenerateClarifyOptions,
  GeneratePlanOptions,
  GenerateTasksOptions,
  AnalyzeOptions,
  GeneratedUserStory,
  GeneratedSpecKit,
  GeneratedSpec,
  ClarificationQuestion,
  GeneratedPlan,
  GeneratedTasks,
  AnalysisResult
} from './types';

// Get current provider - defaults to mock
function getProvider(): 'claude' | 'openai' | 'mock' {
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (ANTHROPIC_API_KEY) return 'claude';
  if (OPENAI_API_KEY) return 'openai';
  return 'mock';
}

// Wrapper functions that use the mock for now
export async function generateUserStories(options: GenerateUserStoriesOptions): Promise<GeneratedUserStory[]> {
  const provider = getProvider();

  if (provider === 'claude' || provider === 'openai') {
    // TODO: Implement real AI integration
    console.log(`[AI] Would use ${provider} for user stories generation`);
  }

  return mockGenerateUserStories(options);
}

export async function generateSpecKit(options: GenerateSpecKitOptions): Promise<GeneratedSpecKit> {
  const provider = getProvider();

  if (provider === 'claude' || provider === 'openai') {
    // TODO: Implement real AI integration
    console.log(`[AI] Would use ${provider} for spec-kit generation`);
  }

  return mockGenerateSpecKit(options);
}

// ============================================================================
// Speckit-aligned workflow: specify → clarify → plan → tasks → analyze
// ============================================================================

/**
 * Step 1: Specify - Generate feature specification from description
 * Creates spec.md with user stories, edge cases, requirements, success criteria
 */
export async function generateSpec(options: GenerateSpecOptions): Promise<GeneratedSpec> {
  const provider = getProvider();

  if (provider === 'claude' || provider === 'openai') {
    console.log(`[AI] Would use ${provider} for spec generation`);
  }

  return mockGenerateSpec(options);
}

/**
 * Step 2: Clarify - Generate clarification questions based on spec
 * Identifies ambiguities and generates targeted questions
 */
export async function generateClarify(options: GenerateClarifyOptions): Promise<ClarificationQuestion[]> {
  const provider = getProvider();

  if (provider === 'claude' || provider === 'openai') {
    console.log(`[AI] Would use ${provider} for clarification generation`);
  }

  return mockGenerateClarify(options);
}

/**
 * Step 3: Plan - Generate technical plan based on spec and clarifications
 * Creates plan.md with technical context and project structure
 */
export async function generatePlan(options: GeneratePlanOptions): Promise<GeneratedPlan> {
  const provider = getProvider();

  if (provider === 'claude' || provider === 'openai') {
    console.log(`[AI] Would use ${provider} for plan generation`);
  }

  return mockGeneratePlan(options);
}

/**
 * Step 4: Tasks - Generate task breakdown based on spec and plan
 * Creates tasks.md with phased task list
 */
export async function generateTasks(options: GenerateTasksOptions): Promise<GeneratedTasks> {
  const provider = getProvider();

  if (provider === 'claude' || provider === 'openai') {
    console.log(`[AI] Would use ${provider} for tasks generation`);
  }

  return mockGenerateTasks(options);
}

/**
 * Step 5: Analyze - Validate consistency across spec, plan, and tasks
 * Returns analysis report with issues and scores
 */
export async function analyzeDocuments(options: AnalyzeOptions): Promise<AnalysisResult> {
  const provider = getProvider();

  if (provider === 'claude' || provider === 'openai') {
    console.log(`[AI] Would use ${provider} for document analysis`);
  }

  return mockAnalyzeDocuments(options);
}

export { getProvider };
