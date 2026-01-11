/**
 * CloudProjectService (T030)
 * Business logic for cloud project management
 */

import prisma from '@/lib/prisma';

export interface CreateProjectInput {
  name: string;
  description?: string;
  ownerId: string;
}

export interface ProjectWithDetails {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
  members: Array<{
    userId: string;
    role: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
  _count: {
    specs: number;
    members: number;
  };
}

// Generate URL-safe slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export class CloudProjectService {
  /**
   * Create a new cloud project
   */
  static async create(input: CreateProjectInput): Promise<ProjectWithDetails> {
    const { name, description, ownerId } = input;

    // Generate unique slug
    let slug = generateSlug(name);
    let slugSuffix = 0;

    while (true) {
      const existing = await prisma.cloudProject.findUnique({
        where: { slug: slugSuffix === 0 ? slug : `${slug}-${slugSuffix}` },
      });
      if (!existing) break;
      slugSuffix++;
    }

    if (slugSuffix > 0) {
      slug = `${slug}-${slugSuffix}`;
    }

    // Create project with owner as admin member
    const project = await prisma.cloudProject.create({
      data: {
        name,
        slug,
        description: description || null,
        ownerId,
        members: {
          create: {
            userId: ownerId,
            role: 'ADMIN',
          },
        },
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        members: {
          select: {
            userId: true,
            role: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        _count: {
          select: { specs: true, members: true },
        },
      },
    });

    return project;
  }

  /**
   * Get a project by ID or slug
   */
  static async getById(
    idOrSlug: string,
    userId: string
  ): Promise<ProjectWithDetails | null> {
    const project = await prisma.cloudProject.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        AND: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
        },
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        _count: {
          select: { specs: true, members: true },
        },
      },
    });

    return project;
  }

  /**
   * List all projects for a user (owned or member)
   */
  static async listForUser(userId: string): Promise<ProjectWithDetails[]> {
    const projects = await prisma.cloudProject.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        members: {
          select: {
            userId: true,
            role: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        _count: {
          select: { specs: true, members: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return projects;
  }

  /**
   * Update a project (requires admin access)
   */
  static async update(
    idOrSlug: string,
    userId: string,
    data: { name?: string; description?: string }
  ): Promise<ProjectWithDetails | null> {
    // Check user has admin access
    const project = await prisma.cloudProject.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        AND: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId, role: 'ADMIN' } } },
          ],
        },
      },
    });

    if (!project) {
      return null;
    }

    const updated = await prisma.cloudProject.update({
      where: { id: project.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        members: {
          select: {
            userId: true,
            role: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        _count: {
          select: { specs: true, members: true },
        },
      },
    });

    return updated;
  }

  /**
   * Delete a project (owner only)
   */
  static async delete(idOrSlug: string, userId: string): Promise<boolean> {
    const project = await prisma.cloudProject.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        ownerId: userId,
      },
    });

    if (!project) {
      return false;
    }

    await prisma.cloudProject.delete({
      where: { id: project.id },
    });

    return true;
  }

  /**
   * Check if user has specific role access to project
   */
  static async hasAccess(
    idOrSlug: string,
    userId: string,
    requiredRole?: 'VIEW' | 'EDIT' | 'ADMIN'
  ): Promise<boolean> {
    const roleHierarchy = { VIEW: 1, EDIT: 2, ADMIN: 3 };

    const project = await prisma.cloudProject.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        members: {
          where: { userId },
          select: { role: true },
        },
      },
    });

    if (!project) return false;

    // Owner has full access
    if (project.ownerId === userId) return true;

    // Check member role
    const membership = project.members[0];
    if (!membership) return false;

    if (!requiredRole) return true;

    const userRoleLevel = roleHierarchy[membership.role as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole];

    return userRoleLevel >= requiredLevel;
  }
}
