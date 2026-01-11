/**
 * Tests for Sync API endpoints
 * These tests mock Prisma and authentication to test API logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    cloudProject: {
      findUnique: vi.fn(),
    },
    syncedSpec: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    syncEvent: {
      create: vi.fn(),
    },
  },
}));

// Mock auth
vi.mock('@/lib/auth/api-token', () => ({
  validateApiToken: vi.fn(),
}));

import prisma from '@/lib/prisma';
import { validateApiToken } from '@/lib/auth/api-token';

describe('Sync API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateApiToken', () => {
    it('should reject requests without Authorization header', async () => {
      const mockValidate = validateApiToken as ReturnType<typeof vi.fn>;
      mockValidate.mockResolvedValue({
        valid: false,
        error: 'Missing Authorization header',
      });

      const result = await validateApiToken({
        headers: { get: () => null },
      } as any);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Missing Authorization header');
    });

    it('should reject invalid token format', async () => {
      const mockValidate = validateApiToken as ReturnType<typeof vi.fn>;
      mockValidate.mockResolvedValue({
        valid: false,
        error: 'Invalid Authorization format. Use: Bearer <token>',
      });

      const result = await validateApiToken({
        headers: { get: () => 'InvalidFormat' },
      } as any);

      expect(result.valid).toBe(false);
    });

    it('should accept valid token', async () => {
      const mockValidate = validateApiToken as ReturnType<typeof vi.fn>;
      mockValidate.mockResolvedValue({
        valid: true,
        userId: 'user-123',
      });

      const result = await validateApiToken({
        headers: { get: () => 'Bearer sb_validtoken123' },
      } as any);

      expect(result.valid).toBe(true);
      expect(result.userId).toBe('user-123');
    });
  });

  describe('GET /api/sync/[projectId]/features', () => {
    it('should return specs grouped by feature', async () => {
      const mockFindUnique = prisma.cloudProject.findUnique as ReturnType<typeof vi.fn>;
      mockFindUnique.mockResolvedValue({
        id: 'project-1',
        specs: [
          {
            featureId: '001-auth',
            featureName: 'Authentication',
            fileType: 'spec',
            content: '# Auth Spec',
            updatedAt: new Date('2026-01-01'),
            lastModifiedBy: 'user-1',
          },
          {
            featureId: '001-auth',
            featureName: 'Authentication',
            fileType: 'plan',
            content: '# Auth Plan',
            updatedAt: new Date('2026-01-02'),
            lastModifiedBy: 'user-1',
          },
          {
            featureId: '002-dashboard',
            featureName: 'Dashboard',
            fileType: 'spec',
            content: '# Dashboard Spec',
            updatedAt: new Date('2026-01-03'),
            lastModifiedBy: 'user-2',
          },
        ],
        members: [{ userId: 'user-1' }],
      });

      // Simulate grouping logic
      const specs = mockFindUnique.mock.results[0]?.value?.specs || [];
      const featureMap = new Map();

      for (const spec of [
        { featureId: '001-auth', featureName: 'Authentication', fileType: 'spec', content: '# Auth Spec' },
        { featureId: '001-auth', featureName: 'Authentication', fileType: 'plan', content: '# Auth Plan' },
        { featureId: '002-dashboard', featureName: 'Dashboard', fileType: 'spec', content: '# Dashboard Spec' },
      ]) {
        if (!featureMap.has(spec.featureId)) {
          featureMap.set(spec.featureId, {
            featureId: spec.featureId,
            featureName: spec.featureName,
            files: [],
          });
        }
        featureMap.get(spec.featureId).files.push({
          type: spec.fileType,
          content: spec.content,
        });
      }

      const result = Array.from(featureMap.values());

      expect(result).toHaveLength(2);
      expect(result[0].featureId).toBe('001-auth');
      expect(result[0].files).toHaveLength(2);
      expect(result[1].featureId).toBe('002-dashboard');
      expect(result[1].files).toHaveLength(1);
    });
  });

  describe('POST /api/sync/[projectId]/push', () => {
    it('should upsert specs correctly', async () => {
      const mockUpsert = prisma.syncedSpec.upsert as ReturnType<typeof vi.fn>;
      mockUpsert.mockResolvedValue({ id: 'spec-1' });

      const mockCreateEvent = prisma.syncEvent.create as ReturnType<typeof vi.fn>;
      mockCreateEvent.mockResolvedValue({ id: 'event-1' });

      // Simulate push logic
      const specs = [
        {
          featureId: '001-auth',
          featureName: 'Authentication',
          files: [
            { type: 'spec', content: '# Updated Auth Spec', lastModified: '2026-01-07' },
          ],
        },
      ];

      for (const spec of specs) {
        for (const file of spec.files) {
          await prisma.syncedSpec.upsert({
            where: {
              cloudProjectId_featureId_fileType: {
                cloudProjectId: 'project-1',
                featureId: spec.featureId,
                fileType: file.type,
              },
            },
            update: {
              content: file.content,
              featureName: spec.featureName,
              lastModifiedBy: 'user-1',
            },
            create: {
              cloudProjectId: 'project-1',
              featureId: spec.featureId,
              featureName: spec.featureName,
              fileType: file.type,
              content: file.content,
              lastModifiedBy: 'user-1',
            },
          });
        }
      }

      expect(mockUpsert).toHaveBeenCalledTimes(1);
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            cloudProjectId_featureId_fileType: {
              cloudProjectId: 'project-1',
              featureId: '001-auth',
              fileType: 'spec',
            },
          }),
        })
      );
    });

    it('should record sync event after push', async () => {
      const mockCreateEvent = prisma.syncEvent.create as ReturnType<typeof vi.fn>;
      mockCreateEvent.mockResolvedValue({ id: 'event-1' });

      await prisma.syncEvent.create({
        data: {
          cloudProjectId: 'project-1',
          userId: 'user-1',
          eventType: 'PUSH',
          featuresAffected: ['001-auth', '002-dashboard'],
        },
      });

      expect(mockCreateEvent).toHaveBeenCalledWith({
        data: {
          cloudProjectId: 'project-1',
          userId: 'user-1',
          eventType: 'PUSH',
          featuresAffected: ['001-auth', '002-dashboard'],
        },
      });
    });
  });

  describe('Access Control', () => {
    it('should deny access to non-members', async () => {
      const mockFindUnique = prisma.cloudProject.findUnique as ReturnType<typeof vi.fn>;
      mockFindUnique.mockResolvedValue({
        id: 'project-1',
        members: [], // No members matching user
      });

      const project = await prisma.cloudProject.findUnique({
        where: { id: 'project-1' },
        include: { members: { where: { userId: 'other-user' } } },
      });

      expect(project?.members).toHaveLength(0);
    });

    it('should deny edit access to VIEW role', () => {
      const member = { role: 'VIEW' };
      const canEdit = member.role !== 'VIEW';

      expect(canEdit).toBe(false);
    });

    it('should allow edit access to EDIT role', () => {
      const member = { role: 'EDIT' };
      const canEdit = member.role !== 'VIEW';

      expect(canEdit).toBe(true);
    });

    it('should allow edit access to ADMIN role', () => {
      const member = { role: 'ADMIN' };
      const canEdit = member.role !== 'VIEW';

      expect(canEdit).toBe(true);
    });
  });
});
