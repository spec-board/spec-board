/**
 * Project Connect API (T029)
 * POST /api/cloud-projects/connect - Redeem a link code to join a project
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

// POST /api/cloud-projects/connect - Redeem a link code
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Link code is required' },
        { status: 400 }
      );
    }

    // Normalize code (uppercase, trim)
    const normalizedCode = code.toUpperCase().trim();

    // Find the link code
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
      return NextResponse.json(
        { error: 'Invalid link code' },
        { status: 404 }
      );
    }

    // Check if code is expired
    if (linkCode.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Link code has expired' },
        { status: 410 }
      );
    }

    // Check if code was already used
    if (linkCode.usedAt) {
      return NextResponse.json(
        { error: 'Link code has already been used' },
        { status: 410 }
      );
    }

    const project = linkCode.cloudProject;

    // Check if user is already a member
    const isAlreadyMember = project.members.some(m => m.userId === user.id);
    const isOwner = project.ownerId === user.id;

    if (isAlreadyMember || isOwner) {
      return NextResponse.json({
        message: 'Already a member of this project',
        project: {
          id: project.id,
          name: project.name,
          slug: project.slug,
          description: project.description,
        },
        alreadyMember: true,
      });
    }

    // Add user as member and mark code as used
    await prisma.$transaction([
      prisma.projectMember.create({
        data: {
          cloudProjectId: project.id,
          userId: user.id,
          role: 'EDIT', // Default role for invited members
        },
      }),
      prisma.projectLinkCode.update({
        where: { id: linkCode.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({
      message: 'Successfully joined project',
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
        description: project.description,
        owner: project.owner,
      },
      alreadyMember: false,
    });
  } catch (error) {
    console.error('Error connecting to project:', error);
    return NextResponse.json(
      { error: 'Failed to connect to project' },
      { status: 500 }
    );
  }
}
