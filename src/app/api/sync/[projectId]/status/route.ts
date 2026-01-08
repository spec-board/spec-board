/**
 * GET /api/sync/[projectId]/status
 * Get sync status for a cloud project (used by MCP and dashboard)
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateApiToken } from '@/lib/auth/api-token';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  // Validate API token
  const authResult = await validateApiToken(request);
  if (!authResult.valid) {
    return NextResponse.json(
      { error: authResult.error },
      { status: 401 }
    );
  }

  try {
    // Find cloud project with related data
    const cloudProject = await prisma.cloudProject.findUnique({
      where: { id: projectId },
      include: {
        members: {
          where: { userId: authResult.userId },
        },
        specs: {
          select: {
            id: true,
            featureId: true,
            fileType: true,
            updatedAt: true,
          },
        },
        _count: {
          select: {
            specs: true,
            members: true,
          },
        },
      },
    });

    if (!cloudProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check user has access
    const member = cloudProject.members[0];
    if (!member) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Count pending conflicts for this project's specs
    const specIds = cloudProject.specs.map(s => s.id);
    const pendingConflicts = specIds.length > 0
      ? await prisma.conflictRecord.count({
          where: {
            specId: { in: specIds },
            status: 'PENDING',
          },
        })
      : 0;

    // Get last sync event for this user
    const lastSyncEvent = await prisma.syncEvent.findFirst({
      where: {
        cloudProjectId: projectId,
        userId: authResult.userId,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        eventType: true,
        createdAt: true,
        featuresAffected: true,
      },
    });

    // Count unique features
    const uniqueFeatures = new Set(cloudProject.specs.map(s => s.featureId));

    // Find most recent spec update
    const lastSpecUpdate = cloudProject.specs.length > 0
      ? cloudProject.specs.reduce((latest, spec) =>
          spec.updatedAt > latest ? spec.updatedAt : latest,
          cloudProject.specs[0].updatedAt
        )
      : null;

    return NextResponse.json({
      projectId: cloudProject.id,
      projectName: cloudProject.name,
      projectSlug: cloudProject.slug,
      userRole: member.role,
      lastSyncAt: member.lastSyncAt?.toISOString() || null,
      stats: {
        totalSpecs: cloudProject._count.specs,
        totalFeatures: uniqueFeatures.size,
        totalMembers: cloudProject._count.members,
        pendingConflicts,
      },
      lastActivity: {
        specUpdate: lastSpecUpdate?.toISOString() || null,
        userSync: lastSyncEvent
          ? {
              type: lastSyncEvent.eventType,
              at: lastSyncEvent.createdAt.toISOString(),
              featuresAffected: lastSyncEvent.featuresAffected,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Error fetching sync status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync status' },
      { status: 500 }
    );
  }
}
