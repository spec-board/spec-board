/**
 * GET /api/sync/[projectId]/features/[featureId]
 * Fetch specs for a specific feature (used by MCP get_spec tool)
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateApiToken } from '@/lib/auth/api-token';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; featureId: string }> }
) {
  const { projectId, featureId } = await params;

  // Validate API token
  const authResult = await validateApiToken(request);
  if (!authResult.valid) {
    return NextResponse.json(
      { error: authResult.error },
      { status: 401 }
    );
  }

  try {
    // Find cloud project and check access
    const cloudProject = await prisma.cloudProject.findUnique({
      where: { id: projectId },
      include: {
        members: {
          where: { userId: authResult.userId },
        },
      },
    });

    if (!cloudProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    if (cloudProject.members.length === 0) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Fetch specs for this feature
    const specs = await prisma.syncedSpec.findMany({
      where: {
        cloudProjectId: projectId,
        featureId: featureId,
      },
    });

    if (specs.length === 0) {
      return NextResponse.json(
        { error: 'Feature not found' },
        { status: 404 }
      );
    }

    // Format response
    const result = {
      featureId,
      featureName: specs[0].featureName || featureId,
      files: specs.map((spec) => ({
        type: spec.fileType as 'spec' | 'plan' | 'tasks',
        content: spec.content,
        lastModified: spec.updatedAt.toISOString(),
        lastModifiedBy: spec.lastModifiedBy || undefined,
      })),
    };

    return NextResponse.json([result]);
  } catch (error) {
    console.error('Error fetching feature specs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feature specs' },
      { status: 500 }
    );
  }
}
