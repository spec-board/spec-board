/**
 * SyncService (T045)
 * Business logic for push/pull sync operations
 */

import prisma from '@/lib/prisma';
import { generateChecksum, contentsMatch } from '@/lib/sync/checksum';
import type { SyncFileType, ConflictStatus } from '@/types';

// ============================================
// Types
// ============================================

export interface SpecFile {
  type: SyncFileType;
  content: string;
  checksum?: string;
}

export interface FeatureSpec {
  featureId: string;
  featureName: string;
  files: SpecFile[];
}

export interface PushResult {
  success: boolean;
  syncedFeatures: string[];
  errors: string[];
  conflicts: string[];
}

export interface PullResult {
  features: Array<{
    featureId: string;
    featureName: string;
    files: Array<{
      type: SyncFileType;
      content: string;
      checksum: string;
      lastModified: string;
      lastModifiedBy?: string;
      version: number;
    }>;
  }>;
  hasConflicts: boolean;
  conflictCount: number;
}

export interface SyncStatusResult {
  projectId: string;
  projectName: string;
  projectSlug: string;
  userRole: string;
  lastSyncAt: string | null;
  stats: {
    totalSpecs: number;
    totalFeatures: number;
    totalMembers: number;
    pendingConflicts: number;
  };
  lastActivity: {
    specUpdate: string | null;
    userSync: {
      type: string;
      at: string;
      featuresAffected: string[];
    } | null;
  };
}

// ============================================
// Service
// ============================================

export class SyncService {
  /**
   * Push specs to cloud with conflict detection
   */
  static async push(
    projectId: string,
    userId: string,
    specs: FeatureSpec[],
    options: { forceOverwrite?: boolean } = {}
  ): Promise<PushResult> {
    const syncedFeatures: string[] = [];
    const errors: string[] = [];
    const conflicts: string[] = [];

    for (const spec of specs) {
      try {
        for (const file of spec.files) {
          const localChecksum = file.checksum || generateChecksum(file.content);

          // Check for existing spec
          const existing = await prisma.syncedSpec.findUnique({
            where: {
              cloudProjectId_featureId_fileType: {
                cloudProjectId: projectId,
                featureId: spec.featureId,
                fileType: file.type,
              },
            },
          });

          // Conflict detection (if not forcing overwrite)
          if (existing && !options.forceOverwrite) {
            const cloudChecksum = generateChecksum(existing.content);

            // If cloud has different content and local doesn't match cloud
            if (!contentsMatch(file.content, existing.content)) {
              // Check if there's already a pending conflict
              const existingConflict = await prisma.conflictRecord.findFirst({
                where: {
                  specId: existing.id,
                  status: 'PENDING',
                },
              });

              if (!existingConflict) {
                // Create conflict record
                await prisma.conflictRecord.create({
                  data: {
                    specId: existing.id,
                    localContent: file.content,
                    localChecksum,
                    cloudContent: existing.content,
                    cloudChecksum,
                    status: 'PENDING',
                  },
                });
                conflicts.push(`${spec.featureId}/${file.type}`);
                continue; // Skip this file, don't overwrite
              }
            }
          }

          // Upsert the spec
          await prisma.syncedSpec.upsert({
            where: {
              cloudProjectId_featureId_fileType: {
                cloudProjectId: projectId,
                featureId: spec.featureId,
                fileType: file.type,
              },
            },
            update: {
              content: file.content,
              featureName: spec.featureName,
              lastModifiedBy: userId,
              version: { increment: 1 },
              updatedAt: new Date(),
            },
            create: {
              cloudProjectId: projectId,
              featureId: spec.featureId,
              featureName: spec.featureName,
              fileType: file.type,
              content: file.content,
              lastModifiedBy: userId,
              version: 1,
            },
          });
        }

        if (!syncedFeatures.includes(spec.featureId)) {
          syncedFeatures.push(spec.featureId);
        }
      } catch (err) {
        errors.push(`Failed to sync ${spec.featureId}: ${err}`);
      }
    }

    // Record sync event
    if (syncedFeatures.length > 0) {
      await prisma.syncEvent.create({
        data: {
          cloudProjectId: projectId,
          userId,
          eventType: conflicts.length > 0 ? 'CONFLICT_DETECTED' : 'PUSH',
          featuresAffected: syncedFeatures,
        },
      });

      // Update member's lastSyncAt
      await prisma.projectMember.updateMany({
        where: {
          cloudProjectId: projectId,
          userId,
        },
        data: {
          lastSyncAt: new Date(),
        },
      });
    }

    return {
      success: errors.length === 0 && conflicts.length === 0,
      syncedFeatures,
      errors,
      conflicts,
    };
  }

  /**
   * Pull specs from cloud
   */
  static async pull(
    projectId: string,
    userId: string,
    options: { featureIds?: string[] } = {}
  ): Promise<PullResult> {
    // Build query filter
    const whereClause: { cloudProjectId: string; featureId?: { in: string[] } } = {
      cloudProjectId: projectId,
    };
    if (options.featureIds && options.featureIds.length > 0) {
      whereClause.featureId = { in: options.featureIds };
    }

    // Fetch specs
    const specs = await prisma.syncedSpec.findMany({
      where: whereClause,
      orderBy: { featureId: 'asc' },
    });

    // Group by feature
    const featureMap = new Map<string, {
      featureId: string;
      featureName: string;
      files: Array<{
        type: SyncFileType;
        content: string;
        checksum: string;
        lastModified: string;
        lastModifiedBy?: string;
        version: number;
      }>;
    }>();

    for (const spec of specs) {
      if (!featureMap.has(spec.featureId)) {
        featureMap.set(spec.featureId, {
          featureId: spec.featureId,
          featureName: spec.featureName || spec.featureId,
          files: [],
        });
      }

      const feature = featureMap.get(spec.featureId)!;
      feature.files.push({
        type: spec.fileType as SyncFileType,
        content: spec.content,
        checksum: generateChecksum(spec.content),
        lastModified: spec.updatedAt.toISOString(),
        lastModifiedBy: spec.lastModifiedBy || undefined,
        version: spec.version,
      });
    }

    // Check for pending conflicts
    const specIds = specs.map(s => s.id);
    const conflictCount = specIds.length > 0
      ? await prisma.conflictRecord.count({
          where: {
            specId: { in: specIds },
            status: 'PENDING',
          },
        })
      : 0;

    // Record pull event
    await prisma.syncEvent.create({
      data: {
        cloudProjectId: projectId,
        userId,
        eventType: 'PULL',
        featuresAffected: Array.from(featureMap.keys()),
      },
    });

    // Update member's lastSyncAt
    await prisma.projectMember.updateMany({
      where: {
        cloudProjectId: projectId,
        userId,
      },
      data: {
        lastSyncAt: new Date(),
      },
    });

    return {
      features: Array.from(featureMap.values()),
      hasConflicts: conflictCount > 0,
      conflictCount,
    };
  }

  /**
   * Get sync status for a project
   */
  static async getStatus(
    projectId: string,
    userId: string
  ): Promise<SyncStatusResult | null> {
    const cloudProject = await prisma.cloudProject.findUnique({
      where: { id: projectId },
      include: {
        members: {
          where: { userId },
        },
        specs: {
          select: {
            id: true,
            featureId: true,
            updatedAt: true,
          },
        },
        _count: {
          select: {
            specs: true,
            members: true,
          },
        },
      },
    });

    if (!cloudProject) return null;

    const member = cloudProject.members[0];
    if (!member) return null;

    // Count pending conflicts
    const specIds = cloudProject.specs.map(s => s.id);
    const pendingConflicts = specIds.length > 0
      ? await prisma.conflictRecord.count({
          where: {
            specId: { in: specIds },
            status: 'PENDING',
          },
        })
      : 0;

    // Get last sync event
    const lastSyncEvent = await prisma.syncEvent.findFirst({
      where: {
        cloudProjectId: projectId,
        userId,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Count unique features
    const uniqueFeatures = new Set(cloudProject.specs.map(s => s.featureId));

    // Find most recent spec update
    const lastSpecUpdate = cloudProject.specs.length > 0
      ? cloudProject.specs.reduce((latest, spec) =>
          spec.updatedAt > latest ? spec.updatedAt : latest,
          cloudProject.specs[0].updatedAt
        )
      : null;

    return {
      projectId: cloudProject.id,
      projectName: cloudProject.name,
      projectSlug: cloudProject.slug,
      userRole: member.role,
      lastSyncAt: member.lastSyncAt?.toISOString() || null,
      stats: {
        totalSpecs: cloudProject._count.specs,
        totalFeatures: uniqueFeatures.size,
        totalMembers: cloudProject._count.members,
        pendingConflicts,
      },
      lastActivity: {
        specUpdate: lastSpecUpdate?.toISOString() || null,
        userSync: lastSyncEvent
          ? {
              type: lastSyncEvent.eventType,
              at: lastSyncEvent.createdAt.toISOString(),
              featuresAffected: lastSyncEvent.featuresAffected,
            }
          : null,
      },
    };
  }

  /**
   * Check if user has sync access to project
   */
  static async hasAccess(
    projectId: string,
    userId: string,
    requiredRole: 'VIEW' | 'EDIT' | 'ADMIN' = 'VIEW'
  ): Promise<boolean> {
    const roleHierarchy = { VIEW: 1, EDIT: 2, ADMIN: 3 };

    const member = await prisma.projectMember.findUnique({
      where: {
        cloudProjectId_userId: {
          cloudProjectId: projectId,
          userId,
        },
      },
    });

    if (!member) return false;

    const userRoleLevel = roleHierarchy[member.role as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole];

    return userRoleLevel >= requiredLevel;
  }

  /**
   * Get pending conflicts for a project
   */
  static async getPendingConflicts(projectId: string) {
    const specs = await prisma.syncedSpec.findMany({
      where: { cloudProjectId: projectId },
      select: { id: true, featureId: true, fileType: true },
    });

    const specIds = specs.map(s => s.id);
    if (specIds.length === 0) return [];

    const conflicts = await prisma.conflictRecord.findMany({
      where: {
        specId: { in: specIds },
        status: 'PENDING',
      },
      include: {
        spec: {
          select: {
            featureId: true,
            fileType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return conflicts.map(c => ({
      id: c.id,
      specId: c.specId,
      featureId: c.spec.featureId,
      fileType: c.spec.fileType,
      localContent: c.localContent,
      localChecksum: c.localChecksum,
      cloudContent: c.cloudContent,
      cloudChecksum: c.cloudChecksum,
      status: c.status as ConflictStatus,
      detectedAt: c.createdAt.toISOString(),
    }));
  }

  /**
   * Resolve a conflict
   */
  static async resolveConflict(
    conflictId: string,
    userId: string,
    resolution: 'LOCAL' | 'CLOUD' | 'MERGED',
    mergedContent?: string
  ): Promise<boolean> {
    const conflict = await prisma.conflictRecord.findUnique({
      where: { id: conflictId },
      include: { spec: true },
    });

    if (!conflict || conflict.status !== 'PENDING') {
      return false;
    }

    // Determine final content based on resolution
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
        if (!mergedContent) return false;
        finalContent = mergedContent;
        status = 'RESOLVED_MERGED';
        break;
      default:
        return false;
    }

    // Update spec with resolved content and mark conflict as resolved
    await prisma.$transaction([
      prisma.syncedSpec.update({
        where: { id: conflict.specId },
        data: {
          content: finalContent,
          lastModifiedBy: userId,
          version: { increment: 1 },
        },
      }),
      prisma.conflictRecord.update({
        where: { id: conflictId },
        data: {
          status,
          resolvedBy: userId,
          resolvedAt: new Date(),
        },
      }),
      prisma.syncEvent.create({
        data: {
          cloudProjectId: conflict.spec.cloudProjectId,
          userId,
          eventType: 'CONFLICT_RESOLVED',
          featuresAffected: [conflict.spec.featureId],
        },
      }),
    ]);

    return true;
  }
}
