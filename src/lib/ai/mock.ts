import type {
  GenerateUserStoriesOptions,
  GenerateSpecKitOptions,
  GeneratedUserStory,
  GeneratedSpecKit
} from './types';

/**
 * Mock AI Service - Simulates Claude/OpenAI API responses
 * Replace with real AI calls by implementing the same interface
 */

const MOCK_DELAY_MS = 1500;

// Extract key topics/entities from PRD for smart story generation
function extractTopics(content: string): string[] {
  const words = content.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3);

  // Common tech/business terms to look for
  const keywords = [
    'user', 'login', 'register', 'dashboard', 'admin', 'profile',
    'search', 'filter', 'sort', 'upload', 'download', 'export',
    'payment', 'checkout', 'cart', 'order', 'invoice',
    'notification', 'email', 'message', 'chat',
    'api', 'database', 'authentication', 'authorization',
    'mobile', 'desktop', 'responsive', 'offline',
    'analytics', 'report', 'chart', 'graph',
    'settings', 'preferences', 'configuration'
  ];

  return keywords.filter(k => words.some(w => w.includes(k)));
}

// Infer priority from content
function inferPriority(content: string): 'P1' | 'P2' | 'P3' {
  const lower = content.toLowerCase();
  if (lower.includes('critical') || lower.includes('must have') || lower.includes('essential')) {
    return 'P1';
  }
  if (lower.includes('should have') || lower.includes('important')) {
    return 'P2';
  }
  return 'P3';
}

// Generate user stories from PRD content
export async function generateUserStories(options: GenerateUserStoriesOptions): Promise<GeneratedUserStory[]> {
  const { prdContent } = options;

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));

  const topics = extractTopics(prdContent);
  const stories: GeneratedUserStory[] = [];

  // Generate 3-5 user stories based on content
  const storyTemplates = [
    {
      title: 'User Authentication',
      description: 'As a new user, I want to register and login so that I can access the system securely',
      criteria: [
        'User can register with email and password',
        'User receives confirmation email',
        'User can login with registered credentials',
        'User can reset forgotten password'
      ]
    },
    {
      title: 'Dashboard Overview',
      description: 'As a user, I want to see a dashboard overview so that I can quickly see important information',
      criteria: [
        'Dashboard displays key metrics',
        'Dashboard shows recent activity',
        'User can customize dashboard layout',
        'Data refreshes automatically'
      ]
    },
    {
      title: 'Data Management',
      description: 'As a user, I want to manage data entries so that I can create, read, update, and delete records',
      criteria: [
        'User can create new entries',
        'User can view entry details',
        'User can edit existing entries',
        'User can delete entries with confirmation'
      ]
    },
    {
      title: 'Search and Filter',
      description: 'As a user, I want to search and filter data so that I can find what I need quickly',
      criteria: [
        'Search returns results in real-time',
        'User can filter by multiple criteria',
        'User can save filter presets',
        'Results are paginated'
      ]
    },
    {
      title: 'Settings and Preferences',
      description: 'As a user, I want to customize my settings so that the app fits my needs',
      criteria: [
        'User can change password',
        'User can update profile information',
        'User can set notification preferences',
        'User can choose theme (light/dark)'
      ]
    }
  ];

  // Select relevant stories based on topics
  const topicMap: Record<string, number[]> = {
    'login': [0], 'register': [0], 'authentication': [0],
    'dashboard': [1], 'overview': [1], 'metrics': [1],
    'data': [2], 'crud': [2], 'manage': [2],
    'search': [3], 'filter': [3], 'find': [3],
    'settings': [4], 'preferences': [4], 'config': [4]
  };

  const selectedIndices = new Set<number>();

  for (const topic of topics) {
    const indices = topicMap[topic];
    if (indices) {
      indices.forEach(i => selectedIndices.add(i));
    }
  }

  // If no matches, select first 3
  if (selectedIndices.size === 0) {
    [0, 1, 2].forEach(i => selectedIndices.add(i));
  }

  // Generate 3-5 stories
  const count = Math.min(Math.max(selectedIndices.size, 3), 5);
  const shuffled = Array.from(selectedIndices).sort(() => Math.random() - 0.5);

  // Safety check
  if (!storyTemplates.length) {
    return [{
      id: 'US01',
      title: 'Default Story',
      description: 'Process the provided PRD content',
      priority: 'P2',
      acceptanceCriteria: ['Content is processed']
    }];
  }

  for (let i = 0; i < count; i++) {
    const idx = shuffled[i] % storyTemplates.length;
    const template = storyTemplates[idx];
    if (!template) continue; // Skip if template not found
    const priority = inferPriority(prdContent);

    stories.push({
      id: `US${String(i + 1).padStart(2, '0')}`,
      title: template.title,
      description: template.description,
      priority,
      acceptanceCriteria: template.criteria
    });
  }

  return stories;
}

// Generate full spec-kit from PRD
export async function generateSpecKit(options: GenerateSpecKitOptions): Promise<GeneratedSpecKit> {
  const { prdContent, featureName } = options;

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS * 2));

  // First generate user stories
  const userStories = await generateUserStories({ prdContent });

  // Generate spec-kit structure
  const specKit: GeneratedSpecKit = {
    spec: {
      userStories,
      clarifications: [
        {
          question: 'What is the target user audience?',
          answer: 'General users who need the core functionality described in the PRD.'
        },
        {
          question: 'Are there any specific design requirements?',
          answer: 'Follow existing design patterns in the project. Use consistent spacing and typography.'
        }
      ]
    },
    plan: {
      summary: `Implementation plan for ${featureName}. This feature enables users to ${prdContent.substring(0, 100)}...`,
      technicalContext: {
        language: 'TypeScript',
        dependencies: [],
        storage: 'Local state with potential for backend persistence',
        testing: 'Unit tests with Vitest, E2E with Playwright',
        platform: 'Web (responsive)'
      }
    },
    tasks: {
      phases: [
        {
          name: 'Setup',
          tasks: [
            { id: 'T001', description: 'Create feature branch' },
            { id: 'T002', description: 'Set up component structure' },
            { id: 'T003', description: 'Add required dependencies' }
          ]
        },
        {
          name: 'Implementation',
          tasks: [
            { id: 'T004', description: 'Implement user stories', userStory: 'US01' },
            { id: 'T005', description: 'Add API endpoints', userStory: 'US02' },
            { id: 'T006', description: 'Create UI components', userStory: 'US03' }
          ]
        },
        {
          name: 'Testing',
          tasks: [
            { id: 'T007', description: 'Write unit tests' },
            { id: 'T008', description: 'Write integration tests' },
            { id: 'T009', description: 'Perform E2E testing' }
          ]
        },
        {
          name: 'Deployment',
          tasks: [
            { id: 'T010', description: 'Update documentation' },
            { id: 'T011', description: 'Deploy to staging' },
            { id: 'T012', description: 'Deploy to production' }
          ]
        }
      ]
    }
  };

  return specKit;
}

// Get available models for a provider
export function getAvailableModels(provider: 'claude' | 'openai' | 'mock'): string[] {
  switch (provider) {
    case 'claude':
      return ['claude-sonnet-4-20250514', 'claude-haiku-4-20250514'];
    case 'openai':
      return ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'];
    case 'mock':
    default:
      return ['mock-model'];
  }
}
