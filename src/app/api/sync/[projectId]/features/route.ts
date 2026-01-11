/**
 * GET /api/sync/[projectId]/features
 * Fetch all specs for a cloud project (used by MCP get_spec tool)
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
    // Find cloud project
    const cloudProject = await prisma.cloudProject.findUnique({
      where: { id: projectId },
      include: {
        specs: {
          orderBy: { featureId: 'asc' },
        },
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

    // Check user has access
    if (cloudProject.members.length === 0) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Group specs by feature
    const featureMap = new Map<string, {
      featureId: string;
      featureName: string;
      files: Array<{
        type: 'spec' | 'plan' | 'tasks';
        content: string;
        lastModified: string;
        lastModifiedBy?: string;
      }>;
    }>();

    for (const spec of cloudProject.specs) {
      if (!featureMap.has(spec.featureId)) {
        featureMap.set(spec.featureId, {
          featureId: spec.featureId,
          featureName: spec.featureName || spec.featureId,
          files: [],
        });
      }

      const feature = featureMap.get(spec.featureId)!;
      feature.files.push({
        type: spec.fileType as 'spec' | 'plan' | 'tasks',
        content: spec.content,
        lastModified: spec.updatedAt.toISOString(),
        lastModifiedBy: spec.lastModifiedBy || undefined,
      });
    }

    return NextResponse.json(Array.from(featureMap.values()));
  } catch (error) {
    console.error('Error fetching specs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch specs' },
      { status: 500 }
    );
  }
}
