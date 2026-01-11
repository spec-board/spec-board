/**
 * Single Cloud Project API
 * GET /api/cloud-projects/[id] - Get project details
 * PUT /api/cloud-projects/[id] - Update project
 * DELETE /api/cloud-projects/[id] - Delete project
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

// GET /api/cloud-projects/[id] - Get project details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const project = await prisma.cloudProject.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        AND: {
          OR: [
            { ownerId: user.id },
            { members: { some: { userId: user.id } } },
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
        specs: {
          select: {
            id: true,
            featureId: true,
            featureName: true,
            fileType: true,
            updatedAt: true,
            lastModifiedBy: true,
          },
          orderBy: { featureId: 'asc' },
        },
        _count: {
          select: { specs: true, members: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching cloud project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PUT /api/cloud-projects/[id] - Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check user has admin access
    const project = await prisma.cloudProject.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        AND: {
          OR: [
            { ownerId: user.id },
            { members: { some: { userId: user.id, role: 'ADMIN' } } },
          ],
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    const updated = await prisma.cloudProject.update({
      where: { id: project.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating cloud project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE /api/cloud-projects/[id] - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Only owner can delete
    const project = await prisma.cloudProject.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        ownerId: user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or not owner' },
        { status: 404 }
      );
    }

    await prisma.cloudProject.delete({
      where: { id: project.id },
    });

    return NextResponse.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    console.error('Error deleting cloud project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
