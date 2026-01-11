/**
 * ProjectMemberService (T057)
 * Business logic for project member management
 */

import prisma from '@/lib/prisma';
import type { MemberRole } from '@/types';

// ============================================
// Types
// ============================================

export interface ProjectMemberRecord {
  id: string;
  userId: string;
  cloudProjectId: string;
  role: MemberRole;
  joinedAt: string;
  lastSyncAt: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

export interface MemberListResult {
  projectId: string;
  projectName: string;
  ownerId: string;
  members: ProjectMemberRecord[];
  totalMembers: number;
}

export interface UpdateRoleInput {
  projectId: string;
  targetUserId: string;
  newRole: MemberRole;
  requesterId: string;
}

// ============================================
// Service
// ============================================

export class ProjectMemberService {
  /**
   * List all members of a project
   */
  static async listMembers(projectId: string): Promise<MemberListResult | null> {
    const project = await prisma.cloudProject.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        ownerId: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });

    if (!project) {
      return null;
    }

    return {
      projectId: project.id,
      projectName: project.name,
      ownerId: project.ownerId,
      members: project.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        cloudProjectId: m.cloudProjectId,
        role: m.role as MemberRole,
        joinedAt: m.joinedAt.toISOString(),
        lastSyncAt: m.lastSyncAt?.toISOString() || null,
        user: {
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          avatarUrl: m.user.avatarUrl,
        },
      })),
      totalMembers: project.members.length,
    };
  }

  /**
   * Get a specific member's details
   */
  static async getMember(
    projectId: string,
    userId: string
  ): Promise<ProjectMemberRecord | null> {
    const member = await prisma.projectMember.findUnique({
      where: {
        cloudProjectId_userId: {
          cloudProjectId: projectId,
          userId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!member) {
      return null;
    }

    return {
      id: member.id,
      userId: member.userId,
      cloudProjectId: member.cloudProjectId,
      role: member.role as MemberRole,
      joinedAt: member.joinedAt.toISOString(),
      lastSyncAt: member.lastSyncAt?.toISOString() || null,
      user: {
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        avatarUrl: member.user.avatarUrl,
      },
    };
  }

  /**
   * Update a member's role
   * Only ADMIN can update roles, and cannot demote themselves if they're the last admin
   */
  static async updateRole(input: UpdateRoleInput): Promise<{
    success: boolean;
    error?: string;
    member?: ProjectMemberRecord;
  }> {
    const { projectId, targetUserId, newRole, requesterId } = input;

    // Check requester has admin access
    const requesterMember = await prisma.projectMember.findUnique({
      where: {
        cloudProjectId_userId: {
          cloudProjectId: projectId,
          userId: requesterId,
        },
      },
    });

    // Also check if requester is owner
    const project = await prisma.cloudProject.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    const isOwner = project?.ownerId === requesterId;
    const isAdmin = requesterMember?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return { success: false, error: 'Only admins can update member roles' };
    }

    // Prevent demoting the last admin
    if (newRole !== 'ADMIN') {
      const adminCount = await prisma.projectMember.count({
        where: {
          cloudProjectId: projectId,
          role: 'ADMIN',
        },
      });

      const targetMember = await prisma.projectMember.findUnique({
        where: {
          cloudProjectId_userId: {
            cloudProjectId: projectId,
            userId: targetUserId,
          },
        },
      });

      if (targetMember?.role === 'ADMIN' && adminCount <= 1) {
        return { success: false, error: 'Cannot demote the last admin' };
      }
    }

    // Update the role
    const updated = await prisma.projectMember.update({
      where: {
        cloudProjectId_userId: {
          cloudProjectId: projectId,
          userId: targetUserId,
        },
      },
      data: { role: newRole },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      success: true,
      member: {
        id: updated.id,
        userId: updated.userId,
        cloudProjectId: updated.cloudProjectId,
        role: updated.role as MemberRole,
        joinedAt: updated.joinedAt.toISOString(),
        lastSyncAt: updated.lastSyncAt?.toISOString() || null,
        user: {
          id: updated.user.id,
          name: updated.user.name,
          email: updated.user.email,
          avatarUrl: updated.user.avatarUrl,
        },
      },
    };
  }

  /**
   * Remove a member from a project
   * Admins can remove members, members can remove themselves
   * Owner cannot be removed
   */
  static async removeMember(
    projectId: string,
    targetUserId: string,
    requesterId: string
  ): Promise<{ success: boolean; error?: string }> {
    // Get project to check owner
    const project = await prisma.cloudProject.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    // Cannot remove owner
    if (targetUserId === project.ownerId) {
      return { success: false, error: 'Cannot remove project owner' };
    }

    // Check permissions
    const isSelfRemoval = targetUserId === requesterId;
    const isOwner = project.ownerId === requesterId;

    if (!isSelfRemoval && !isOwner) {
      // Check if requester is admin
      const requesterMember = await prisma.projectMember.findUnique({
        where: {
          cloudProjectId_userId: {
            cloudProjectId: projectId,
            userId: requesterId,
          },
        },
      });

      if (requesterMember?.role !== 'ADMIN') {
        return { success: false, error: 'Only admins can remove other members' };
      }
    }

    // Remove the member
    await prisma.projectMember.delete({
      where: {
        cloudProjectId_userId: {
          cloudProjectId: projectId,
          userId: targetUserId,
        },
      },
    });

    return { success: true };
  }

  /**
   * Check if user has specific role access
   */
  static async hasRole(
    projectId: string,
    userId: string,
    requiredRole: MemberRole
  ): Promise<boolean> {
    const roleHierarchy: Record<MemberRole, number> = {
      VIEW: 1,
      EDIT: 2,
      ADMIN: 3,
    };

    // Check if owner
    const project = await prisma.cloudProject.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });

    if (project?.ownerId === userId) {
      return true; // Owner has all permissions
    }

    const member = await prisma.projectMember.findUnique({
      where: {
        cloudProjectId_userId: {
          cloudProjectId: projectId,
          userId,
        },
      },
    });

    if (!member) {
      return false;
    }

    const userRoleLevel = roleHierarchy[member.role as MemberRole] || 0;
    const requiredLevel = roleHierarchy[requiredRole];

    return userRoleLevel >= requiredLevel;
  }
}
