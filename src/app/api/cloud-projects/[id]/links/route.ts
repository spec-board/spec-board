/**
 * Project Link Codes API (T028)
 * POST /api/cloud-projects/[id]/links - Generate a new link code
 * GET /api/cloud-projects/[id]/links - List active link codes
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth/session';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

// Generate a 6-character alphanumeric code
function generateLinkCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars (0, O, 1, I)
  let code = '';
  const bytes = randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

// POST /api/cloud-projects/[id]/links - Generate a new link code
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
    // Check user has admin access to the project
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

    // Parse optional expiration from body (default 24 hours)
    let expiresInHours = 24;
    try {
      const body = await request.json();
      if (body.expiresInHours && typeof body.expiresInHours === 'number') {
        expiresInHours = Math.min(Math.max(body.expiresInHours, 1), 168); // 1-168 hours (1 week max)
      }
    } catch {
      // No body or invalid JSON, use default
    }

    // Generate unique code
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
      return NextResponse.json(
        { error: 'Failed to generate unique code' },
        { status: 500 }
      );
    }

    // Create link code
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    const linkCode = await prisma.projectLinkCode.create({
      data: {
        cloudProjectId: project.id,
        code,
        expiresAt,
      },
    });

    return NextResponse.json({
      code: linkCode.code,
      expiresAt: linkCode.expiresAt,
      projectId: project.id,
      projectName: project.name,
    }, { status: 201 });
  } catch (error) {
    console.error('Error generating link code:', error);
    return NextResponse.json(
      { error: 'Failed to generate link code' },
      { status: 500 }
    );
  }
}

// GET /api/cloud-projects/[id]/links - List active link codes
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

    // Get active (non-expired, unused) link codes
    const linkCodes = await prisma.projectLinkCode.findMany({
      where: {
        cloudProjectId: project.id,
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

    return NextResponse.json(linkCodes);
  } catch (error) {
    console.error('Error fetching link codes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch link codes' },
      { status: 500 }
    );
  }
}
