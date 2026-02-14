// AI Service exports
export * from './types';
export * from './mock';
export { AIService } from './client';

// Re-export functions directly to avoid Turbopack class instance issues
import { generateUserStories as mockGenerateUserStories, generateSpecKit as mockGenerateSpecKit } from './mock';
import type { GenerateUserStoriesOptions, GenerateSpecKitOptions, GeneratedUserStory, GeneratedSpecKit } from './types';

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

export { getProvider };
