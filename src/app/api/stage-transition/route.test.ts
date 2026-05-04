import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';

// Mock Prisma
vi.mock('@/lib/prisma', () => {
  const prisma = {
    feature: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    appSettings: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
    aIProviderConfig: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  };
  return { prisma, default: prisma };
});

// Mock AI settings
vi.mock('@/lib/ai/settings', () => ({
  getAISettings: vi.fn().mockResolvedValue({
    provider: 'openai',
    apiKey: 'test-key',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
  }),
  getAppSettings: vi.fn().mockResolvedValue({ language: 'en' }),
}));

// Mock AI generation functions (used by the route's local generateStageTransitionContent)
vi.mock('@/lib/ai', () => ({
  generateSpec: vi.fn().mockResolvedValue({ userStories: [], functionalRequirements: [], edgeCases: [] }),
  generateClarify: vi.fn().mockResolvedValue([]),
  generatePlan: vi.fn().mockResolvedValue({ summary: 'Plan', technicalContext: {} }),
  generateTasks: vi.fn().mockResolvedValue({ phases: [] }),
}));

import { prisma } from '@/lib/prisma';

describe('/api/stage-transition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET - Job Status', () => {
    it('should return job status for a feature', async () => {
      const mockFeature = {
        id: 'feature-123',
        stage: 'specs',
        jobStatus: 'completed',
        jobProgress: 100,
        jobMessage: 'Processing complete',
        jobStartedAt: new Date(),
        jobCompletedAt: new Date(),
      };

      vi.mocked(prisma.feature.findUnique).mockResolvedValueOnce(mockFeature);

      const request = new NextRequest('http://localhost/api/stage-transition?featureId=feature-123');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.featureId).toBe('feature-123');
      expect(data.stage).toBe('specs');
      expect(data.jobStatus).toBe('completed');
      expect(data.jobProgress).toBe(100);
    });

    it('should return 400 if featureId is missing', async () => {
      const request = new NextRequest('http://localhost/api/stage-transition');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Feature ID is required');
    });

    it('should return 404 if feature not found', async () => {
      vi.mocked(prisma.feature.findUnique).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost/api/stage-transition?featureId=nonexistent');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Feature not found');
    });
  });

  describe('POST - Stage Transition', () => {
    it('should process a valid stage transition', async () => {
      const mockFeature = {
        id: 'feature-123',
        projectId: 'project-1',
        name: 'Test Feature',
        description: 'Test description',
        stage: 'backlog',
        specContent: null,
        clarificationsContent: null,
        planContent: null,
        constitutionVersionId: null,
      };

      vi.mocked(prisma.feature.findUnique).mockResolvedValueOnce(mockFeature);
      vi.mocked(prisma.feature.update)
        .mockResolvedValueOnce(mockFeature) // jobStatus update
        .mockResolvedValueOnce({ ...mockFeature, stage: 'specs' }); // final update

      const request = new NextRequest('http://localhost/api/stage-transition', {
        method: 'POST',
        body: JSON.stringify({
          featureId: 'feature-123',
          fromStage: 'backlog',
          toStage: 'specs',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.stage).toBe('specs');
    });

    it('should return 400 for invalid transition', async () => {
      const mockFeature = {
        id: 'feature-123',
        projectId: 'project-1',
        name: 'Test Feature',
        stage: 'backlog',
      };

      vi.mocked(prisma.feature.findUnique).mockResolvedValueOnce(mockFeature);

      const request = new NextRequest('http://localhost/api/stage-transition', {
        method: 'POST',
        body: JSON.stringify({
          featureId: 'feature-123',
          fromStage: 'backlog',
          toStage: 'plan', // Invalid - can only go to specs from backlog
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid transition');
    });

    it('should return 400 if featureId is missing', async () => {
      const request = new NextRequest('http://localhost/api/stage-transition', {
        method: 'POST',
        body: JSON.stringify({
          fromStage: 'backlog',
          toStage: 'specs',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Feature ID is required');
    });

    it('should return 404 if feature not found', async () => {
      vi.mocked(prisma.feature.findUnique).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost/api/stage-transition', {
        method: 'POST',
        body: JSON.stringify({
          featureId: 'nonexistent',
          fromStage: 'backlog',
          toStage: 'specs',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Feature not found');
    });
  });
});
