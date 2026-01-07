/**
 * Cloud Project management API
 * GET /api/cloud-projects - List user's cloud projects
 * POST /api/cloud-projects - Create a new cloud project
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

// Generate URL-safe slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// GET /api/cloud-projects - List user's cloud projects
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get projects where user is owner or member
    const projects = await prisma.cloudProject.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          { members: { some: { userId: user.id } } },
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
          select: { specs: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching cloud projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/cloud-projects - Create a new cloud project
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

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
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
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
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating cloud project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
