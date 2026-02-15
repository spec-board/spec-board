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

// Generation options
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
