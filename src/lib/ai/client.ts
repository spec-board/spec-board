import type {
  AIConfig,
  AIProvider,
  GenerateUserStoriesOptions,
  GenerateSpecKitOptions,
  GeneratedUserStory,
  GeneratedSpecKit
} from './types';
import { generateUserStories as mockGenerateUserStories, generateSpecKit as mockGenerateSpecKit } from './mock';
import { getAISettings } from './settings';

/**
 * AI Client - Unified interface for AI generation
 * Supports Anthropic (Claude), OpenAI, and OpenAI-compatible APIs
 */

const DEFAULT_CONFIG: AIConfig = {
  provider: 'anthropic',
  model: 'claude-sonnet-4-20250514'
};

// Environment variables as fallback
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

class AIService {
  private config: AIConfig;

  constructor(config: AIConfig = DEFAULT_CONFIG) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Update configuration
  setConfig(config: Partial<AIConfig>) {
    this.config = { ...this.config, ...config };
  }

  getConfig(): AIConfig {
    return { ...this.config };
  }

  // Get current provider
  getProvider(): AIProvider {
    const settings = getAISettings();
    return settings.provider as AIProvider;
  }

  // Check if using real AI
  isRealAI(): boolean {
    const settings = getAISettings();
    return !!(settings.anthropicApiKey || settings.openaiApiKey);
  }

  // Generate user stories
  async generateUserStories(options: GenerateUserStoriesOptions): Promise<GeneratedUserStory[]> {
    const provider = this.getProvider();

    switch (provider) {
      case 'anthropic':
        return this.generateWithClaude(options);
      case 'openai':
        return this.generateWithOpenAI(options);
      default:
        return mockGenerateUserStories(options);
    }
  }

  // Generate full spec-kit
  async generateSpecKit(options: GenerateSpecKitOptions): Promise<GeneratedSpecKit> {
    const provider = this.getProvider();

    switch (provider) {
      case 'anthropic':
        return this.generateSpecKitWithClaude(options);
      case 'openai':
        return this.generateSpecKitWithOpenAI(options);
      default:
        return mockGenerateSpecKit(options);
    }
  }

  // Claude API implementation
  private async generateWithClaude(options: GenerateUserStoriesOptions): Promise<GeneratedUserStory[]> {
    const settings = getAISettings();
    if (!settings.anthropicApiKey) {
      console.warn('[AI] No Anthropic API key, falling back to mock');
      return mockGenerateUserStories(options);
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': settings.anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: this.buildUserStoriesPrompt(options.prdContent, options.projectContext)
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data = await response.json();
    return this.parseUserStoriesResponse(data.content[0].text);
  }

  private async generateSpecKitWithClaude(options: GenerateSpecKitOptions): Promise<GeneratedSpecKit> {
    const settings = getAISettings();
    if (!settings.anthropicApiKey) {
      console.warn('[AI] No Anthropic API key, falling back to mock');
      return mockGenerateSpecKit(options);
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': settings.anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content: this.buildSpecKitPrompt(options.prdContent, options.featureName, options.projectContext)
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data = await response.json();
    return this.parseSpecKitResponse(data.content[0].text);
  }

  // OpenAI API implementation (supports custom baseUrl)
  private async generateWithOpenAI(options: GenerateUserStoriesOptions): Promise<GeneratedUserStory[]> {
    const settings = getAISettings();
    if (!settings.openaiApiKey) {
      console.warn('[AI] No OpenAI API key, falling back to mock');
      return mockGenerateUserStories(options);
    }

    const baseUrl = settings.baseUrl || 'https://api.openai.com/v1';
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.openaiApiKey}`
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a product analyst that creates user stories from PRD documents.' },
          { role: 'user', content: this.buildUserStoriesPrompt(options.prdContent, options.projectContext) }
        ],
        temperature: 0.7,
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return this.parseUserStoriesResponse(data.choices[0].message.content);
  }

  private async generateSpecKitWithOpenAI(options: GenerateSpecKitOptions): Promise<GeneratedSpecKit> {
    const settings = getAISettings();
    if (!settings.openaiApiKey) {
      console.warn('[AI] No OpenAI API key, falling back to mock');
      return mockGenerateSpecKit(options);
    }

    const baseUrl = settings.baseUrl || 'https://api.openai.com/v1';
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.openaiApiKey}`
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a product analyst that creates full spec-kit from PRD documents.' },
          { role: 'user', content: this.buildSpecKitPrompt(options.prdContent, options.featureName, options.projectContext) }
        ],
        temperature: 0.7,
        max_tokens: 8192
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return this.parseSpecKitResponse(data.choices[0].message.content);
  }

  // Prompt builders
  private buildUserStoriesPrompt(prdContent: string, projectContext?: string): string {
    return `You are a product analyst. Generate user stories from the following PRD.

${projectContext ? `Project Context: ${projectContext}\n` : ''}
PRD Content:
${prdContent}

Generate user stories in the following JSON format:
{
  "userStories": [
    {
      "id": "US01",
      "title": "Story title",
      "description": "As a [user], I want [action], so that [benefit]",
      "priority": "P1|P2|P3",
      "acceptanceCriteria": ["Criterion 1", "Criterion 2", "Criterion 3"]
    }
  ]
}

Return ONLY valid JSON, no other text.`;
  }

  private buildSpecKitPrompt(prdContent: string, featureName: string, projectContext?: string): string {
    return `You are a product analyst and technical writer. Generate a complete spec-kit from the following PRD.

${projectContext ? `Project Context: ${projectContext}\n` : ''}
Feature Name: ${featureName}
PRD Content:
${prdContent}

Generate a complete spec-kit in the following JSON format:
{
  "spec": {
    "userStories": [...],
    "clarifications": [{"question": "...", "answer": "..."}]
  },
  "plan": {
    "summary": "...",
    "technicalContext": {
      "language": "...",
      "dependencies": [...],
      "storage": "...",
      "testing": "...",
      "platform": "..."
    }
  },
  "tasks": {
    "phases": [
      {
        "name": "Phase Name",
        "tasks": [{"id": "T001", "description": "...", "userStory": "US01"}]
      }
    ]
  }
}

Return ONLY valid JSON, no other text.`;
  }

  // Response parsers - extract JSON from AI response
  private parseUserStoriesResponse(content: string): GeneratedUserStory[] {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.userStories || parsed.stories || [];
      }
      return [];
    } catch {
      console.error('Failed to parse user stories response');
      return [];
    }
  }

  private parseSpecKitResponse(content: string): GeneratedSpecKit {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed as GeneratedSpecKit;
      }
    } catch {
      console.error('Failed to parse spec-kit response');
    }
    // Return default on parse failure
    return {
      spec: { userStories: [], clarifications: [] },
      plan: { summary: '', technicalContext: { language: '', dependencies: [], storage: '', testing: '', platform: '' } },
      tasks: { phases: [] }
    };
  }
}

// Export singleton instance
export const aiService = new AIService();

// Export class for custom configurations
export { AIService };
