import { getAISettings } from './settings';

/**
 * Stage transition content generation
 * Generates spec, plan, or tasks content based on transition
 */

interface StageTransitionInput {
  featureId: string;
  fromStage: string;
  toStage: string;
  featureName: string;
  description: string;
  specContent: string;
  clarificationsContent: string;
  planContent: string;
}

interface StageTransitionResult {
  content: string;
  clarifications?: string;
}

/**
 * Generate content for stage transition
 * Uses existing AI functions based on target stage
 */
export async function generateStageTransitionContent(
  input: StageTransitionInput
): Promise<StageTransitionResult> {
  const aiSettings = await getAISettings();

  // Require API key
  if (!aiSettings.apiKey) {
    throw new Error('AI provider is not configured');
  }

  const { toStage, featureName, description, specContent, clarificationsContent, planContent } = input;

  // Create typed settings object
  const settings = {
    apiKey: aiSettings.apiKey,
    baseUrl: aiSettings.baseUrl,
    model: aiSettings.model,
  };

  // Generate content based on target stage
  switch (toStage) {
    case 'specs':
      return generateSpecsContent(featureName, description, settings);
    case 'plan':
      return generatePlanContent(featureName, specContent, clarificationsContent, settings);
    case 'tasks':
      return generateTasksContent(featureName, specContent, planContent, settings);
    default:
      throw new Error(`Unknown target stage: ${toStage}`);
  }
}

/**
 * Generate spec content with clarifications
 */
async function generateSpecsContent(
  featureName: string,
  description: string,
  settings: { apiKey: string; baseUrl?: string; model?: string }
): Promise<StageTransitionResult> {
  const prompt = `Generate a detailed specification for: ${featureName}

Description: ${description}

Include:
1. User Stories (at least 3)
2. Acceptance Criteria for each story
3. Edge Cases to consider
4. Technical Considerations

Format as markdown.`;

  const content = await callAI(prompt, settings);

  return {
    content,
    clarifications: '',
  };
}

/**
 * Generate plan content
 */
async function generatePlanContent(
  featureName: string,
  specContent: string,
  clarificationsContent: string,
  settings: { apiKey: string; baseUrl?: string; model?: string }
): Promise<StageTransitionResult> {
  const prompt = `Generate an implementation plan for: ${featureName}

Spec:
${specContent}

Clarifications:
${clarificationsContent}

Include:
1. Technical Context
2. Architecture Overview
3. Implementation Steps
4. Dependencies
5. Testing Strategy

Format as markdown.`;

  const content = await callAI(prompt, settings);

  return { content };
}

/**
 * Generate tasks content
 */
async function generateTasksContent(
  featureName: string,
  specContent: string,
  planContent: string,
  settings: { apiKey: string; baseUrl?: string; model?: string }
): Promise<StageTransitionResult> {
  const prompt = `Generate a task breakdown for: ${featureName}

Spec:
${specContent}

Plan:
${planContent}

Include:
1. Phases (at least 2-3 phases)
2. Tasks with descriptions
3. Dependencies between tasks
4. Suggested order

Format as task list markdown with checkboxes.`;

  const content = await callAI(prompt, settings);

  return { content };
}

/**
 * Call AI API (OpenAI-compatible)
 */
async function callAI(
  prompt: string,
  settings: { apiKey: string; baseUrl?: string; model?: string }
): Promise<string> {
  const baseUrl = settings.baseUrl || 'https://api.openai.com/v1';
  const model = settings.model || 'gpt-4o';

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant that generates software specification documents.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}
