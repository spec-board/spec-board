/**
 * ProjectLinkService (T031)
 * Business logic for project link code management
 */

import prisma from '@/lib/prisma';
import { randomBytes } from 'crypto';

export interface LinkCodeResult {
  code: string;
  expiresAt: Date;
  projectId: string;
  projectName: string;
}

export interface RedeemResult {
  success: boolean;
  message: string;
  project?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  };
  alreadyMember?: boolean;
}

// Generate a 6-character alphanumeric code (excludes confusing chars)
function generateLinkCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const bytes = randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

export class ProjectLinkService {
  /**
   * Generate a new link code for a project
   */
  static async generateCode(
    projectId: string,
    expiresInHours: number = 24
  ): Promise<LinkCodeResult> {
    // Clamp expiration to 1-168 hours (1 week max)
    const clampedHours = Math.min(Math.max(expiresInHours, 1), 168);

    // Get project info
    const project = await prisma.cloudProject.findUnique({
      where: { id: projectId },
      select: { id: true, name: true },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Generate unique code with retry
    let code: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      code = generateLinkCode();
      const existing = await prisma.projectLinkCode.findUnique({
        where: { code },
      });
      if (!existing) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique code');
    }

    // Create link code
    const expiresAt = new Date(Date.now() + clampedHours * 60 * 60 * 1000);
    await prisma.projectLinkCode.create({
      data: {
        cloudProjectId: project.id,
        code,
        expiresAt,
      },
    });

    return {
      code,
      expiresAt,
      projectId: project.id,
      projectName: project.name,
    };
  }

  /**
   * Validate a link code without redeeming it
   */
  static async validate(code: string): Promise<{
    valid: boolean;
    error?: string;
    projectName?: string;
  }> {
    const normalizedCode = code.toUpperCase().trim();

    const linkCode = await prisma.projectLinkCode.findUnique({
      where: { code: normalizedCode },
      include: {
        cloudProject: { select: { name: true } },
      },
    });

    if (!linkCode) {
      return { valid: false, error: 'Invalid link code' };
    }

    if (linkCode.expiresAt < new Date()) {
      return { valid: false, error: 'Link code has expired' };
    }

    if (linkCode.usedAt) {
      return { valid: false, error: 'Link code has already been used' };
    }

    return {
      valid: true,
      projectName: linkCode.cloudProject.name,
    };
  }

  /**
   * Redeem a link code to join a project
   */
  static async redeem(code: string, userId: string): Promise<RedeemResult> {
    const normalizedCode = code.toUpperCase().trim();

    const linkCode = await prisma.projectLinkCode.findUnique({
      where: { code: normalizedCode },
      include: {
        cloudProject: {
          include: {
            owner: { select: { id: true, name: true, email: true } },
            members: { select: { userId: true } },
          },
        },
      },
    });

    if (!linkCode) {
      return { success: false, message: 'Invalid link code' };
    }

    if (linkCode.expiresAt < new Date()) {
      return { success: false, message: 'Link code has expired' };
    }

    if (linkCode.usedAt) {
      return { success: false, message: 'Link code has already been used' };
    }

    const project = linkCode.cloudProject;

    // Check if user is already a member
    const isAlreadyMember = project.members.some(m => m.userId === userId);
    const isOwner = project.ownerId === userId;

    if (isAlreadyMember || isOwner) {
      return {
        success: true,
        message: 'Already a member of this project',
        project: {
          id: project.id,
          name: project.name,
          slug: project.slug,
          description: project.description,
        },
        alreadyMember: true,
      };
    }

    // Add user as member and mark code as used
    await prisma.$transaction([
      prisma.projectMember.create({
        data: {
          cloudProjectId: project.id,
          userId,
          role: 'EDIT',
        },
      }),
      prisma.projectLinkCode.update({
        where: { id: linkCode.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return {
      success: true,
      message: 'Successfully joined project',
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
        description: project.description,
      },
      alreadyMember: false,
    };
  }

  /**
   * List active link codes for a project
   */
  static async listActive(projectId: string) {
    return prisma.projectLinkCode.findMany({
      where: {
        cloudProjectId: projectId,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  }

  /**
   * Revoke (delete) a link code
   */
  static async revoke(codeId: string, projectId: string): Promise<boolean> {
    const result = await prisma.projectLinkCode.deleteMany({
      where: {
        id: codeId,
        cloudProjectId: projectId,
      },
    });

    return result.count > 0;
  }

  /**
   * Clean up expired link codes (for maintenance)
   */
  static async cleanupExpired(): Promise<number> {
    const result = await prisma.projectLinkCode.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { usedAt: { not: null } },
        ],
      },
    });

    return result.count;
  }
}
