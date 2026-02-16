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
export function getAvailableModels(provider: 'openai' | 'mock'): string[] {
  switch (provider) {
    case 'openai':
      return ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo', 'llama3', 'mistral'];
    case 'mock':
    default:
      return ['mock-model'];
  }
}

// ============================================================================
// Speckit-aligned workflow functions: specify → clarify → plan → tasks → analyze
// ============================================================================

// Step 1: Specify - Generate feature specification
export async function generateSpec(options: GenerateSpecOptions): Promise<GeneratedSpec> {
  const { featureName, description } = options;

  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));

  const userStories = await generateUserStories({ prdContent: description });

  return {
    userStories,
    edgeCases: [
      'What happens when input is empty?',
      'How does the system handle errors?',
      'What are the boundary conditions?'
    ],
    functionalRequirements: [
      'FR-001: System MUST allow users to perform core actions',
      'FR-002: System MUST validate user input',
      'FR-003: System MUST provide feedback on actions'
    ],
    successCriteria: [
      'SC-001: Users can complete primary task in under 2 minutes',
      'SC-002: System handles 1000 concurrent users',
      'SC-003: 90% of users complete task on first attempt'
    ],
    keyEntities: [
      'User: Represents system users',
      'Action: Core actions performed by users',
      'Result: Output of actions'
    ]
  };
}

// Step 2: Clarify - Generate clarification questions
export async function generateClarify(options: GenerateClarifyOptions): Promise<ClarificationQuestion[]> {
  const { specContent } = options;

  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));

  // Analyze spec content and generate relevant questions
  const hasAuth = specContent.toLowerCase().includes('auth');
  const hasData = specContent.toLowerCase().includes('data');
  const hasApi = specContent.toLowerCase().includes('api');

  const questions: ClarificationQuestion[] = [];

  if (hasAuth) {
    questions.push({
      question: 'What authentication method should be used?',
      context: 'Authentication was mentioned in the spec'
    });
  }

  if (hasData) {
    questions.push({
      question: 'What is the expected data volume?',
      context: 'Data handling was mentioned in the spec'
    });
  }

  if (hasApi) {
    questions.push({
      question: 'Should the API be REST or GraphQL?',
      context: 'API was mentioned in the spec'
    });
  }

  // Default questions
  questions.push(
    {
      question: 'What is the target user audience?',
      context: 'Clarifying target users helps prioritize features'
    },
    {
      question: 'Are there specific design requirements?',
      context: 'Design constraints affect implementation approach'
    }
  );

  return questions;
}

// Step 3: Plan - Generate technical plan
export async function generatePlan(options: GeneratePlanOptions): Promise<GeneratedPlan> {
  const { specContent, constitution } = options;

  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS * 2));

  const hasWeb = specContent.toLowerCase().includes('web') || specContent.toLowerCase().includes('frontend');
  const hasMobile = specContent.toLowerCase().includes('mobile') || specContent.toLowerCase().includes('ios') || specContent.toLowerCase().includes('android');

  return {
    summary: `Implementation plan based on the feature specification. ${hasWeb ? 'Web application architecture.' : ''} ${hasMobile ? 'Mobile-first responsive design.' : ''}`,
    technicalContext: {
      language: hasWeb ? 'TypeScript' : hasMobile ? 'Swift' : 'TypeScript',
      version: hasWeb ? '5.9' : hasMobile ? '5.9' : '3.11',
      dependencies: ['react', 'zustand', 'tailwindcss'],
      storage: constitution?.toLowerCase().includes('database') ? 'PostgreSQL' : 'Local state',
      testing: 'Vitest + Playwright',
      platform: hasWeb ? 'Web (responsive)' : hasMobile ? 'iOS 15+' : 'Cross-platform',
      performanceGoals: '<200ms p95 response time',
      constraints: 'Must be accessible (WCAG 2.2 AA)'
    },
    projectStructure: {
      decision: hasWeb ? 'Web application structure' : 'Single project structure',
      structure: hasWeb
        ? 'frontend/src/, backend/src/, tests/'
        : 'src/, tests/'
    }
  };
}

// Step 4: Tasks - Generate task breakdown
export async function generateTasks(options: GenerateTasksOptions): Promise<GeneratedTasks> {
  const { specContent, planContent } = options;

  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS * 2));

  const hasApi = specContent.toLowerCase().includes('api');
  const hasDatabase = planContent.toLowerCase().includes('database');

  return {
    phases: [
      {
        name: 'Phase 1: Setup',
        purpose: 'Project initialization and basic structure',
        tasks: [
          { id: 'T001', description: 'Create project structure per implementation plan', parallel: true },
          { id: 'T002', description: 'Initialize project with required dependencies', parallel: true },
          { id: 'T003', description: 'Configure linting and formatting tools', parallel: true }
        ]
      },
      {
        name: 'Phase 2: Foundational',
        purpose: 'Core infrastructure that MUST be complete before any user story',
        checkpoint: 'Foundation ready - user story implementation can now begin',
        tasks: [
          { id: 'T004', description: hasDatabase ? 'Setup database schema and migrations' : 'Setup configuration management' },
          { id: 'T005', description: 'Create base models/entities', parallel: true },
          { id: 'T006', description: 'Setup error handling and logging infrastructure', parallel: true }
        ]
      },
      {
        name: 'Phase 3: User Story 1',
        purpose: 'Core functionality implementation',
        tasks: [
          { id: 'T007', description: 'Implement core feature components', userStory: 'US01' },
          { id: 'T008', description: hasApi ? 'Implement API endpoints' : 'Implement UI components', userStory: 'US01', parallel: true },
          { id: 'T009', description: 'Add validation and error handling', userStory: 'US01' }
        ]
      },
      {
        name: 'Phase 4: Polish',
        purpose: 'Cross-cutting concerns and improvements',
        tasks: [
          { id: 'T010', description: 'Documentation updates', parallel: true },
          { id: 'T011', description: 'Code cleanup and refactoring', parallel: true },
          { id: 'T012', description: 'Performance optimization' }
        ]
      }
    ]
  };
}

// Step 5: Analyze - Validate consistency across documents
export async function analyzeDocuments(options: AnalyzeOptions): Promise<AnalysisResult> {
  const { specContent, planContent, tasksContent, constitution } = options;

  await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));

  const issues: AnalysisResult['issues'] = [];

  // Check spec-plan consistency
  const specHasUserStories = specContent.toLowerCase().includes('user story');
  const planHasImplementation = planContent.toLowerCase().includes('implementation') || planContent.toLowerCase().includes('plan');
  const specPlanConsistent = specHasUserStories && planHasImplementation;

  // Check plan-tasks consistency
  const tasksHasPhases = tasksContent.toLowerCase().includes('phase');
  const planHasStructure = planContent.toLowerCase().includes('structure') || planContent.toLowerCase().includes('context');
  const planTasksConsistent = tasksHasPhases && planHasStructure;

  // Check constitution alignment
  let constitutionAligned = true;
  if (constitution) {
    const hasPrinciples = constitution.toLowerCase().includes('principle');
    constitutionAligned = hasPrinciples;
    if (!hasPrinciples) {
      issues.push({
        severity: 'warning',
        category: 'alignment',
        message: 'Constitution may not have core principles defined'
      });
    }
  }

  // Add issues if inconsistencies found
  if (!specPlanConsistent) {
    issues.push({
      severity: 'error',
      category: 'consistency',
      message: 'Plan does not appear to reference the specification',
      location: 'plan.md'
    });
  }

  if (!planTasksConsistent) {
    issues.push({
      severity: 'warning',
      category: 'consistency',
      message: 'Tasks may not align with the plan structure',
      location: 'tasks.md'
    });
  }

  // Check for completeness
  if (!specContent.includes('Acceptance') && !specContent.includes('Scenario')) {
    issues.push({
      severity: 'warning',
      category: 'completeness',
      message: 'Spec may be missing acceptance criteria'
    });
  }

  return {
    isValid: issues.filter(i => i.severity === 'error').length === 0,
    specPlanConsistency: {
      isConsistent: specPlanConsistent,
      score: specPlanConsistent ? 90 : 50,
      details: specPlanConsistent
        ? 'Plan properly references specification'
        : 'Potential disconnect between spec and plan'
    },
    planTasksConsistency: {
      isConsistent: planTasksConsistent,
      score: planTasksConsistent ? 85 : 40,
      details: planTasksConsistent
        ? 'Tasks properly derived from plan'
        : 'Tasks may not fully align with plan'
    },
    constitutionAlignment: {
      isConsistent: constitutionAligned,
      score: constitution ? (constitutionAligned ? 90 : 60) : 100,
      details: constitution
        ? (constitutionAligned ? 'Plan aligns with constitution' : 'Potential constitution violations')
        : 'No constitution to check'
    },
    issues
  };
}
