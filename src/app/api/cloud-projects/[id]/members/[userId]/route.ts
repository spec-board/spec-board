/**
 * Single Member API
 * PUT /api/cloud-projects/[id]/members/[userId] - Update member role
 * DELETE /api/cloud-projects/[id]/members/[userId] - Remove a member
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

// PUT /api/cloud-projects/[id]/members/[userId] - Update member role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { id, userId: targetUserId } = await params;

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
        { error: 'Project not found or admin access required' },
        { status: 404 }
      );
    }

    // Cannot change owner's role
    if (targetUserId === project.ownerId) {
      return NextResponse.json(
        { error: 'Cannot change owner role' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { role } = body;

    if (!['VIEW', 'EDIT', 'ADMIN'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be VIEW, EDIT, or ADMIN' },
        { status: 400 }
      );
    }

    const member = await prisma.projectMember.update({
      where: {
        cloudProjectId_userId: {
          cloudProjectId: project.id,
          userId: targetUserId,
        },
      },
      data: { role },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json(
      { error: 'Failed to update member' },
      { status: 500 }
    );
  }
}

// DELETE /api/cloud-projects/[id]/members/[userId] - Remove a member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const { id, userId: targetUserId } = await params;

  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check user has admin access OR is removing themselves
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

    const isSelfRemoval = targetUserId === user.id;

    if (!project && !isSelfRemoval) {
      return NextResponse.json(
        { error: 'Project not found or admin access required' },
        { status: 404 }
      );
    }

    // Cannot remove owner
    if (project && targetUserId === project.ownerId) {
      return NextResponse.json(
        { error: 'Cannot remove project owner' },
        { status: 400 }
      );
    }

    // Get project ID for self-removal case
    const projectId = project?.id || (await prisma.cloudProject.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      select: { id: true },
    }))?.id;

    if (!projectId) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    await prisma.projectMember.delete({
      where: {
        cloudProjectId_userId: {
          cloudProjectId: projectId,
          userId: targetUserId,
        },
      },
    });

    return NextResponse.json({ success: true, message: 'Member removed' });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    );
  }
}
