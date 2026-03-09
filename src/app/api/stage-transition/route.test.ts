import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    feature: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock BullMQ queue
vi.mock('@/lib/queue', () => ({
  addStageTransitionJob: vi.fn().mockResolvedValue({ id: 'job-123' }),
}));

import { prisma } from '@/lib/prisma';
import { addStageTransitionJob } from '@/lib/queue';

describe('/api/stage-transition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET - Job Status', () => {
    it('should return job status for a feature', async () => {
      const mockFeature = {
        id: 'feature-123',
        stage: 'specs',
        jobStatus: 'running',
        jobProgress: 50,
        jobMessage: 'Generating spec...',
        jobStartedAt: new Date(),
        jobCompletedAt: null,
      };

      vi.mocked(prisma.feature.findUnique).mockResolvedValueOnce(mockFeature);

      const request = new NextRequest('http://localhost/api/stage-transition?featureId=feature-123');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.featureId).toBe('feature-123');
      expect(data.stage).toBe('specs');
      expect(data.jobStatus).toBe('running');
      expect(data.jobProgress).toBe(50);
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

    it('should return null/undefined jobStatus when job is completed', async () => {
      const mockFeature = {
        id: 'feature-123',
        stage: 'plan',
        jobStatus: null,
        jobProgress: null,
        jobMessage: null,
        jobStartedAt: new Date(),
        jobCompletedAt: new Date(),
      };

      vi.mocked(prisma.feature.findUnique).mockResolvedValueOnce(mockFeature);

      const request = new NextRequest('http://localhost/api/stage-transition?featureId=feature-123');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.jobStatus).toBeNull();
    });
  });

  describe('POST - Stage Transition', () => {
    it('should queue a job for valid stage transition', async () => {
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
      vi.mocked(prisma.feature.update).mockResolvedValueOnce({ ...mockFeature, jobStatus: 'queued' });
      vi.mocked(addStageTransitionJob).mockResolvedValueOnce({ id: 'job-123' });

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
      expect(data.status).toBe('queued');
      expect(data.jobId).toBe('job-123');
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

    it('should handle job failure status', async () => {
      const mockFeature = {
        id: 'feature-123',
        stage: 'specs',
        jobStatus: 'failed',
        jobProgress: 0,
        jobMessage: 'AI generation failed',
        jobStartedAt: new Date(),
        jobCompletedAt: new Date(),
      };

      vi.mocked(prisma.feature.findUnique).mockResolvedValueOnce(mockFeature);

      const request = new NextRequest('http://localhost/api/stage-transition?featureId=feature-123');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.jobStatus).toBe('failed');
    });
  });
});
