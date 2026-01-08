/**
 * ConflictService (T065)
 * Business logic for conflict detection, listing, and resolution
 */

import prisma from '@/lib/prisma';
import { generateChecksum } from '@/lib/sync/checksum';
import { generateDiff, threeWayMerge, getDiffSummary } from '@/lib/sync/diff';
import type { ConflictStatus, SyncConflict, DiffResult } from '@/types';

// ============================================
// Types
// ============================================

export interface ConflictWithDiff extends SyncConflict {
  diff: DiffResult;
  summary: string;
}

export interface ConflictListResult {
  conflicts: ConflictWithDiff[];
  total: number;
}

export interface ResolveResult {
  success: boolean;
  error?: string;
  resolvedContent?: string;
}

export interface AutoMergeResult {
  canAutoMerge: boolean;
  mergedContent?: string;
  hasConflictMarkers: boolean;
}

// ============================================
// Service
// ============================================

export class ConflictService {
  /**
   * List all pending conflicts for a project
   */
  static async listConflicts(
    projectId: string,
    options: { includeResolved?: boolean } = {}
  ): Promise<ConflictListResult> {
    const { includeResolved = false } = options;

    // Get all specs for this project
    const specs = await prisma.syncedSpec.findMany({
      where: { cloudProjectId: projectId },
      select: { id: true },
    });

    const specIds = specs.map(s => s.id);
    if (specIds.length === 0) {
      return { conflicts: [], total: 0 };
    }

    // Build status filter
    const statusFilter = includeResolved
      ? undefined
      : { status: 'PENDING' as const };

    // Fetch conflicts
    const conflicts = await prisma.conflictRecord.findMany({
      where: {
        specId: { in: specIds },
        ...statusFilter,
      },
      include: {
        spec: {
          select: {
            featureId: true,
            fileType: true,
            featureName: true,
          },
        },
        resolver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform to ConflictWithDiff
    const conflictsWithDiff: ConflictWithDiff[] = conflicts.map(c => {
      const diff = generateDiff(c.cloudContent, c.localContent);
      const summary = getDiffSummary(c.cloudContent, c.localContent);

      return {
        id: c.id,
        specId: c.specId,
        featureId: c.spec.featureId,
        fileType: c.spec.fileType as SyncConflict['fileType'],
        localContent: c.localContent,
        localChecksum: c.localChecksum,
        cloudContent: c.cloudContent,
        cloudChecksum: c.cloudChecksum,
        status: c.status as ConflictStatus,
        detectedAt: c.createdAt.toISOString(),
        resolvedAt: c.resolvedAt?.toISOString(),
        resolvedBy: c.resolver?.name || c.resolver?.email,
        diff,
        summary,
      };
    });

    return {
      conflicts: conflictsWithDiff,
      total: conflictsWithDiff.length,
    };
  }

  /**
   * Get a single conflict by ID with full diff details
   */
  static async getConflict(conflictId: string): Promise<ConflictWithDiff | null> {
    const conflict = await prisma.conflictRecord.findUnique({
      where: { id: conflictId },
      include: {
        spec: {
          select: {
            featureId: true,
            fileType: true,
            featureName: true,
            cloudProjectId: true,
          },
        },
        resolver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!conflict) return null;

    const diff = generateDiff(conflict.cloudContent, conflict.localContent);
    const summary = getDiffSummary(conflict.cloudContent, conflict.localContent);

    return {
      id: conflict.id,
      specId: conflict.specId,
      featureId: conflict.spec.featureId,
      fileType: conflict.spec.fileType as SyncConflict['fileType'],
      localContent: conflict.localContent,
      localChecksum: conflict.localChecksum,
      cloudContent: conflict.cloudContent,
      cloudChecksum: conflict.cloudChecksum,
      status: conflict.status as ConflictStatus,
      detectedAt: conflict.createdAt.toISOString(),
      resolvedAt: conflict.resolvedAt?.toISOString(),
      resolvedBy: conflict.resolver?.name || conflict.resolver?.email,
      diff,
      summary,
    };
  }

  /**
   * Attempt automatic three-way merge
   */
  static async tryAutoMerge(conflictId: string): Promise<AutoMergeResult> {
    const conflict = await prisma.conflictRecord.findUnique({
      where: { id: conflictId },
      include: {
        spec: {
          include: {
            versions: {
              orderBy: { version: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!conflict) {
      return { canAutoMerge: false, hasConflictMarkers: false };
    }

    // Get base version (the version before both changes)
    // Use the previous version's content as base, or empty string if no history
    const baseContent = conflict.spec.versions[0]?.content || '';

    const { merged, hasConflicts } = threeWayMerge(
      baseContent,
      conflict.localContent,
      conflict.cloudContent
    );

    // Check for conflict markers in merged content
    const hasConflictMarkers = merged.includes('<<<<<<<') ||
                               merged.includes('=======') ||
                               merged.includes('>>>>>>>');

    return {
      canAutoMerge: !hasConflicts && !hasConflictMarkers,
      mergedContent: merged,
      hasConflictMarkers,
    };
  }

  /**
   * Resolve a conflict with the chosen resolution strategy
   */
  static async resolve(
    conflictId: string,
    userId: string,
    resolution: 'LOCAL' | 'CLOUD' | 'MERGED',
    mergedContent?: string
  ): Promise<ResolveResult> {
    const conflict = await prisma.conflictRecord.findUnique({
      where: { id: conflictId },
      include: { spec: true },
    });

    if (!conflict) {
      return { success: false, error: 'Conflict not found' };
    }

    if (conflict.status !== 'PENDING') {
      return { success: false, error: 'Conflict already resolved' };
    }

    // Determine final content
    let finalContent: string;
    let status: ConflictStatus;

    switch (resolution) {
      case 'LOCAL':
        finalContent = conflict.localContent;
        status = 'RESOLVED_LOCAL';
        break;
      case 'CLOUD':
        finalContent = conflict.cloudContent;
        status = 'RESOLVED_CLOUD';
        break;
      case 'MERGED':
        if (!mergedContent) {
          return { success: false, error: 'Merged content required for MERGED resolution' };
        }
        finalContent = mergedContent;
        status = 'RESOLVED_MERGED';
        break;
      default:
        return { success: false, error: 'Invalid resolution type' };
    }

    // Create new version before updating
    const newVersion = conflict.spec.version + 1;

    try {
      await prisma.$transaction([
        // Create version history entry
        prisma.specVersion.create({
          data: {
            specId: conflict.specId,
            version: newVersion,
            content: finalContent,
            checksum: generateChecksum(finalContent),
            modifiedBy: userId,
          },
        }),
        // Update the spec with resolved content
        prisma.syncedSpec.update({
          where: { id: conflict.specId },
          data: {
            content: finalContent,
            lastModifiedBy: userId,
            version: newVersion,
          },
        }),
        // Mark conflict as resolved
        prisma.conflictRecord.update({
          where: { id: conflictId },
          data: {
            status,
            resolvedBy: userId,
            resolvedAt: new Date(),
          },
        }),
        // Log sync event
        prisma.syncEvent.create({
          data: {
            cloudProjectId: conflict.spec.cloudProjectId,
            userId,
            eventType: 'CONFLICT_RESOLVED',
            featuresAffected: [conflict.spec.featureId],
          },
        }),
      ]);

      return { success: true, resolvedContent: finalContent };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to resolve conflict'
      };
    }
  }

  /**
   * Check if a project has any pending conflicts
   */
  static async hasPendingConflicts(projectId: string): Promise<boolean> {
    const specs = await prisma.syncedSpec.findMany({
      where: { cloudProjectId: projectId },
      select: { id: true },
    });

    const specIds = specs.map(s => s.id);
    if (specIds.length === 0) return false;

    const count = await prisma.conflictRecord.count({
      where: {
        specId: { in: specIds },
        status: 'PENDING',
      },
    });

    return count > 0;
  }

  /**
   * Get conflict count for a project
   */
  static async getConflictCount(
    projectId: string,
    options: { status?: ConflictStatus } = {}
  ): Promise<number> {
    const specs = await prisma.syncedSpec.findMany({
      where: { cloudProjectId: projectId },
      select: { id: true },
    });

    const specIds = specs.map(s => s.id);
    if (specIds.length === 0) return 0;

    return prisma.conflictRecord.count({
      where: {
        specId: { in: specIds },
        ...(options.status ? { status: options.status } : {}),
      },
    });
  }

  /**
   * Dismiss/cancel a conflict (mark as resolved without changing content)
   */
  static async dismiss(conflictId: string, userId: string): Promise<ResolveResult> {
    const conflict = await prisma.conflictRecord.findUnique({
      where: { id: conflictId },
      include: { spec: true },
    });

    if (!conflict) {
      return { success: false, error: 'Conflict not found' };
    }

    if (conflict.status !== 'PENDING') {
      return { success: false, error: 'Conflict already resolved' };
    }

    try {
      await prisma.$transaction([
        // Mark conflict as resolved (keeping cloud version)
        prisma.conflictRecord.update({
          where: { id: conflictId },
          data: {
            status: 'RESOLVED_CLOUD',
            resolvedBy: userId,
            resolvedAt: new Date(),
          },
        }),
        // Log sync event
        prisma.syncEvent.create({
          data: {
            cloudProjectId: conflict.spec.cloudProjectId,
            userId,
            eventType: 'CONFLICT_RESOLVED',
            featuresAffected: [conflict.spec.featureId],
          },
        }),
      ]);

      return { success: true, resolvedContent: conflict.cloudContent };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to dismiss conflict'
      };
    }
  }
}
