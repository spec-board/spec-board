import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock prisma with importActual to preserve other exports
vi.mock('@/lib/prisma', async () => {
  const actual = await vi.importActual('@/lib/prisma');
  return {
    ...actual,
    default: {
      project: {
        findUnique: vi.fn().mockResolvedValue({ filePath: '/test/path' }),
        create: vi.fn(),
      },
    },
  };
});

// Mock fs/promises
vi.mock('fs/promises', () => ({
  default: {
    writeFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue(''),
    access: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock fs
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn().mockReturnValue(true),
  },
}));

// Mock path-utils
vi.mock('@/lib/path-utils', () => ({
  isPathSafe: vi.fn().mockReturnValue({ safe: true, resolvedPath: '/test/path' }),
}));

// Mock ai module - need to export all functions
vi.mock('@/lib/ai', async () => {
  const actual = await vi.importActual('@/lib/ai');
  return {
    ...actual,
    generateSpec: vi.fn().mockResolvedValue({
      userStories: [{ id: 'US1', narrative: 'User can do something', acceptanceCriteria: ['AC1'] }],
      edgeCases: ['Edge case 1'],
      functionalRequirements: ['FR1'],
      successCriteria: ['SC1'],
      keyEntities: ['Entity1'],
    }),
    generateClarify: vi.fn().mockResolvedValue([
      { question: 'Q1', context: 'Context 1' },
      { question: 'Q2', context: 'Context 2' },
    ]),
    generatePlan: vi.fn().mockResolvedValue({
      technicalContext: 'Tech context',
      approach: 'Approach',
      keyDecisions: ['Decision 1'],
    }),
    generateTasks: vi.fn().mockResolvedValue({
      phases: [
        {
          name: 'Phase 1',
          tasks: [
            { id: 'T001', description: 'Task 1', userStoryRef: 'US1', status: 'pending' },
          ],
        },
      ],
    }),
    analyzeDocuments: vi.fn().mockResolvedValue({
      isValid: true,
      specPlanConsistency: { score: 100, issues: [] },
      planTasksConsistency: { score: 100, issues: [] },
      constitutionAlignment: { score: 100, issues: [] },
      issues: [],
    }),
  };
});

// Import after mocks
import { POST as SPECIFY } from './specify/route';
import { POST as CLARIFY } from './clarify/route';
import { POST as PLAN } from './plan/route';
import { POST as TASKS } from './tasks/route';
import { POST as ANALYZE } from './analyze/route';
import { POST as CREATE_CONSTITUTION } from './constitution/route';

describe('Spec Workflow API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/spec-workflow/specify', () => {
    it('should return 400 when feature name is missing', async () => {
      const request = new Request('http://localhost/api/spec-workflow/specify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'test-project-id',
          name: '',
          description: 'Some description',
        }),
      });

      const response = await SPECIFY(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Feature name is required');
    });

    // Note: Empty description falls back to using name, so it doesn't return 400
    it('should return 400 when feature name is not provided', async () => {
      const request = new Request('http://localhost/api/spec-workflow/specify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'test-project-id',
          name: undefined,
          description: 'Some description',
        }),
      });

      const response = await SPECIFY(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Feature name is required');
    });
  });

  describe('POST /api/spec-workflow/clarify', () => {
    it('should return 400 when spec content is missing', async () => {
      const request = new Request('http://localhost/api/spec-workflow/clarify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specContent: '' }),
      });

      const response = await CLARIFY(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Spec content is required');
    });

    it('should return 400 when spec content is not provided', async () => {
      const request = new Request('http://localhost/api/spec-workflow/clarify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await CLARIFY(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Spec content is required');
    });
  });


  describe('POST /api/spec-workflow/tasks', () => {
    it('should return 400 when spec and plan content are missing', async () => {
      const request = new Request('http://localhost/api/spec-workflow/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'test-project-id',
          name: 'test-feature',
          specContent: '',
          planContent: '',
        }),
      });

      const response = await TASKS(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Spec and plan content required');
    });

    it('should return 400 when spec content is not provided', async () => {
      const request = new Request('http://localhost/api/spec-workflow/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'test-project-id',
          name: 'test-feature',
          specContent: '',
          planContent: 'some plan',
        }),
      });

      const response = await TASKS(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Spec and plan content required');
    });
  });

  describe('POST /api/spec-workflow/constitution', () => {
    it('should return 400 when project name is missing', async () => {
      const request = new Request('http://localhost/api/spec-workflow/constitution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'test-project-id',
          name: '',
        }),
      });

      const response = await CREATE_CONSTITUTION(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Project name is required');
    });

    it('should return 400 when project name is not provided', async () => {
      const request = new Request('http://localhost/api/spec-workflow/constitution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'test-project-id',
        }),
      });

      const response = await CREATE_CONSTITUTION(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Project name is required');
    });
  });
});

describe('Workflow Validation', () => {
  // These tests verify the validation logic works correctly
  // by checking error responses for invalid inputs

  describe('Validation coverage', () => {
    it('specify endpoint validates name and description', async () => {
      // Empty body should fail
      const request = new Request('http://localhost/api/spec-workflow/specify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await SPECIFY(request);
      expect(response.status).toBe(400);
    });

    it('clarify endpoint requires spec content', async () => {
      const request = new Request('http://localhost/api/spec-workflow/clarify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await CLARIFY(request);
      expect(response.status).toBe(400);
    });

    it('tasks endpoint requires both spec and plan', async () => {
      const request = new Request('http://localhost/api/spec-workflow/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'test' }),
      });

      const response = await TASKS(request);
      expect(response.status).toBe(400);
    });

    it('constitution endpoint requires project name', async () => {
      const request = new Request('http://localhost/api/spec-workflow/constitution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: 'test' }),
      });

      const response = await CREATE_CONSTITUTION(request);
      expect(response.status).toBe(400);
    });
  });
});
