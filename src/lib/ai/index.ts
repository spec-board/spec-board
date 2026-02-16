// AI Service exports
export * from './types';
export * from './mock';
export * from './settings';
export { AIService, aiService } from './client';

import { aiService } from './client';
import { getAISettingsSync } from './settings';
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
  AnalysisResult,
  AIProvider
} from './types';

/**
 * Get current AI provider from settings
 * @throws Error if no API key is configured
 */
export function getProvider(): AIProvider {
  const settings = getAISettingsSync();

  // Only OpenAI-compatible API supported
  if (settings.provider === 'openai' && settings.apiKey) {
    return 'openai';
  }

  throw new Error(
    'No AI API key configured. Please configure an API key in settings to use AI features.'
  );
}

// Wrapper functions that use AIService
export async function generateUserStories(options: GenerateUserStoriesOptions): Promise<GeneratedUserStory[]> {
  const provider = getProvider();
  console.log(`[AI] Generating user stories with ${provider}`);

  return aiService.generateUserStories(options);
}

export async function generateSpecKit(options: GenerateSpecKitOptions): Promise<GeneratedSpecKit> {
  const provider = getProvider();
  console.log(`[AI] Generating spec-kit with ${provider}`);

  return aiService.generateSpecKit(options);
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
  console.log(`[AI] Generating spec with ${provider}`);

  // Use AIService for generation - throws if no API key
  return aiService.generateSpec(options);
}

/**
 * Step 2: Clarify - Generate clarification questions based on spec
 * Identifies ambiguities and generates targeted questions
 */
export async function generateClarify(options: GenerateClarifyOptions): Promise<ClarificationQuestion[]> {
  const provider = getProvider();
  console.log(`[AI] Generating clarifications with ${provider}`);

  // Use AIService for generation - throws if no API key
  return aiService.generateClarify(options);
}

/**
 * Step 3: Plan - Generate technical plan based on spec and clarifications
 * Creates plan.md with technical context and project structure
 */
export async function generatePlan(options: GeneratePlanOptions): Promise<GeneratedPlan> {
  const provider = getProvider();
  console.log(`[AI] Generating plan with ${provider}`);

  // Use AIService for generation - throws if no API key
  return aiService.generatePlan(options);
}

/**
 * Step 4: Tasks - Generate task breakdown based on spec and plan
 * Creates tasks.md with phased task list
 */
export async function generateTasks(options: GenerateTasksOptions): Promise<GeneratedTasks> {
  const provider = getProvider();
  console.log(`[AI] Generating tasks with ${provider}`);

  // Use AIService for generation - throws if no API key
  return aiService.generateTasks(options);
}

/**
 * Step 5: Analyze - Validate consistency across spec, plan, and tasks
 * Returns analysis report with issues and scores
 */
export async function analyzeDocuments(options: AnalyzeOptions): Promise<AnalysisResult> {
  const provider = getProvider();
  console.log(`[AI] Analyzing documents with ${provider}`);

  // Use AIService for analysis - throws if no API key
  return aiService.analyzeDocuments(options);
}

/**
 * Generate Constitution - Create project constitution with AI
 * Returns principles and suggested sections based on project context
 */
export async function generateConstitution(options: {
  projectName: string;
  projectDescription?: string;
  existingPrinciples?: string;
}): Promise<{
  principles: Array<{ name: string; description: string }>;
  suggestedSections: Array<{ name: string; content: string }>;
}> {
  const provider = getProvider();
  console.log(`[AI] Generating constitution with ${provider}`);

  return aiService.generateConstitution(options);
}
