/**
 * Project Members API
 * GET /api/cloud-projects/[id]/members - List project members
 * POST /api/cloud-projects/[id]/members - Add a member
 * DELETE /api/cloud-projects/[id]/members/[userId] - Remove a member
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

// GET /api/cloud-projects/[id]/members - List project members
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
    // Check user has access to project
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
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const members = await prisma.projectMember.findMany({
      where: { cloudProjectId: project.id },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

// POST /api/cloud-projects/[id]/members - Add a member
export async function POST(
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
        { error: 'Project not found or admin access required' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { email, role = 'EDIT' } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['VIEW', 'EDIT', 'ADMIN'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be VIEW, EDIT, or ADMIN' },
        { status: 400 }
      );
    }

    // Find user by email
    const targetUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found with that email' },
        { status: 404 }
      );
    }

    // Check if already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        cloudProjectId_userId: {
          cloudProjectId: project.id,
          userId: targetUser.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this project' },
        { status: 409 }
      );
    }

    // Add member
    const member = await prisma.projectMember.create({
      data: {
        cloudProjectId: project.id,
        userId: targetUser.id,
        role,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Error adding member:', error);
    return NextResponse.json(
      { error: 'Failed to add member' },
      { status: 500 }
    );
  }
}
