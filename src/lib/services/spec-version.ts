/**
 * SpecVersionService (T046)
 * Business logic for spec version history management
 */

import prisma from '@/lib/prisma';
import { generateChecksum } from '@/lib/sync/checksum';

// ============================================
// Types
// ============================================

export interface SpecVersionRecord {
  id: string;
  specId: string;
  version: number;
  content: string;
  checksum: string;
  modifiedBy: string;
  modifierName: string | null;
  modifierEmail: string;
  createdAt: string;
}

export interface VersionHistoryResult {
  specId: string;
  featureId: string;
  fileType: string;
  currentVersion: number;
  versions: SpecVersionRecord[];
  totalVersions: number;
}

export interface CreateVersionInput {
  specId: string;
  content: string;
  modifiedBy: string;
}

// ============================================
// Service
// ============================================

export class SpecVersionService {
  /**
   * Create a new version for a spec
   * Called automatically when a spec is updated via push
   */
  static async createVersion(input: CreateVersionInput): Promise<SpecVersionRecord> {
    const { specId, content, modifiedBy } = input;

    // Get current spec to determine next version number
    const spec = await prisma.syncedSpec.findUnique({
      where: { id: specId },
    });

    if (!spec) {
      throw new Error(`Spec not found: ${specId}`);
    }

    const nextVersion = spec.version;
    const checksum = generateChecksum(content);

    // Create version record
    const version = await prisma.specVersion.create({
      data: {
        specId,
        version: nextVersion,
        content,
        checksum,
        modifiedBy,
      },
      include: {
        modifier: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return {
      id: version.id,
      specId: version.specId,
      version: version.version,
      content: version.content,
      checksum: version.checksum,
      modifiedBy: version.modifiedBy,
      modifierName: version.modifier.name,
      modifierEmail: version.modifier.email,
      createdAt: version.createdAt.toISOString(),
    };
  }

  /**
   * Get version history for a spec
   */
  static async getHistory(
    specId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<VersionHistoryResult> {
    const { limit = 20, offset = 0 } = options;

    const spec = await prisma.syncedSpec.findUnique({
      where: { id: specId },
      select: {
        id: true,
        featureId: true,
        fileType: true,
        version: true,
      },
    });

    if (!spec) {
      throw new Error(`Spec not found: ${specId}`);
    }

    const [versions, totalVersions] = await Promise.all([
      prisma.specVersion.findMany({
        where: { specId },
        orderBy: { version: 'desc' },
        skip: offset,
        take: limit,
        include: {
          modifier: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.specVersion.count({ where: { specId } }),
    ]);

    return {
      specId: spec.id,
      featureId: spec.featureId,
      fileType: spec.fileType,
      currentVersion: spec.version,
      versions: versions.map((v) => ({
        id: v.id,
        specId: v.specId,
        version: v.version,
        content: v.content,
        checksum: v.checksum,
        modifiedBy: v.modifiedBy,
        modifierName: v.modifier.name,
        modifierEmail: v.modifier.email,
        createdAt: v.createdAt.toISOString(),
      })),
      totalVersions,
    };
  }

  /**
   * Get a specific version of a spec
   */
  static async getVersion(specId: string, version: number): Promise<SpecVersionRecord | null> {
    const versionRecord = await prisma.specVersion.findUnique({
      where: {
        specId_version: {
          specId,
          version,
        },
      },
      include: {
        modifier: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!versionRecord) {
      return null;
    }

    return {
      id: versionRecord.id,
      specId: versionRecord.specId,
      version: versionRecord.version,
      content: versionRecord.content,
      checksum: versionRecord.checksum,
      modifiedBy: versionRecord.modifiedBy,
      modifierName: versionRecord.modifier.name,
      modifierEmail: versionRecord.modifier.email,
      createdAt: versionRecord.createdAt.toISOString(),
    };
  }

  /**
   * Compare two versions of a spec
   */
  static async compareVersions(
    specId: string,
    versionA: number,
    versionB: number
  ): Promise<{ versionA: SpecVersionRecord; versionB: SpecVersionRecord } | null> {
    const [a, b] = await Promise.all([
      this.getVersion(specId, versionA),
      this.getVersion(specId, versionB),
    ]);

    if (!a || !b) {
      return null;
    }

    return { versionA: a, versionB: b };
  }

  /**
   * Prune old versions, keeping only the most recent N versions
   * Useful for storage management
   */
  static async pruneOldVersions(specId: string, keepCount: number = 10): Promise<number> {
    // Get versions to keep
    const versionsToKeep = await prisma.specVersion.findMany({
      where: { specId },
      orderBy: { version: 'desc' },
      take: keepCount,
      select: { id: true },
    });

    const keepIds = versionsToKeep.map((v) => v.id);

    // Delete older versions
    const result = await prisma.specVersion.deleteMany({
      where: {
        specId,
        id: { notIn: keepIds },
      },
    });

    return result.count;
  }

  /**
   * Restore a spec to a previous version
   */
  static async restoreVersion(
    specId: string,
    version: number,
    userId: string
  ): Promise<boolean> {
    const versionRecord = await prisma.specVersion.findUnique({
      where: {
        specId_version: {
          specId,
          version,
        },
      },
    });

    if (!versionRecord) {
      return false;
    }

    // Update the spec with the old content
    await prisma.syncedSpec.update({
      where: { id: specId },
      data: {
        content: versionRecord.content,
        lastModifiedBy: userId,
        version: { increment: 1 },
      },
    });

    // Create a new version record for the restore
    await this.createVersion({
      specId,
      content: versionRecord.content,
      modifiedBy: userId,
    });

    return true;
  }
}
