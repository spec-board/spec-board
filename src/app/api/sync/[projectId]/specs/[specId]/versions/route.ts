/**
 * GET /api/sync/[projectId]/specs/[specId]/versions
 * Get version history for a specific spec (T081)
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateApiToken } from '@/lib/auth/api-token';
import prisma from '@/lib/prisma';
import { SpecVersionService } from '@/lib/services/spec-version';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; specId: string }> }
) {
  const { projectId, specId } = await params;

  // Validate API token
  const authResult = await validateApiToken(request);
  if (!authResult.valid) {
    return NextResponse.json(
      { error: authResult.error },
      { status: 401 }
    );
  }

  // Parse query params for pagination
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  try {
    // Verify spec exists and belongs to the project
    const spec = await prisma.syncedSpec.findUnique({
      where: { id: specId },
      select: {
        id: true,
        cloudProjectId: true,
        featureId: true,
        featureName: true,
        fileType: true,
        cloudProject: {
          select: {
            members: {
              where: { userId: authResult.userId },
              select: { role: true },
            },
          },
        },
      },
    });

    if (!spec) {
      return NextResponse.json(
        { error: 'Spec not found' },
        { status: 404 }
      );
    }

    // Verify spec belongs to the requested project
    if (spec.cloudProjectId !== projectId) {
      return NextResponse.json(
        { error: 'Spec does not belong to this project' },
        { status: 404 }
      );
    }

    // Check user has access to the project
    const member = spec.cloudProject.members[0];
    if (!member) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get version history using the service
    const history = await SpecVersionService.getHistory(specId, { limit, offset });

    return NextResponse.json({
      specId: history.specId,
      featureId: history.featureId,
      featureName: spec.featureName,
      fileType: history.fileType,
      currentVersion: history.currentVersion,
      versions: history.versions.map((v) => ({
        id: v.id,
        version: v.version,
        checksum: v.checksum,
        modifiedBy: {
          id: v.modifiedBy,
          name: v.modifierName,
          email: v.modifierEmail,
        },
        createdAt: v.createdAt,
      })),
      pagination: {
        total: history.totalVersions,
        limit,
        offset,
        hasMore: offset + limit < history.totalVersions,
      },
    });
  } catch (error) {
    console.error('Error fetching version history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch version history' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sync/[projectId]/specs/[specId]/versions/[version]
 * Get a specific version's content
 * Note: This is handled by a separate route file
 */
