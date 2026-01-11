/**
 * GET /api/sync/[projectId]/specs/[specId]/versions/[version]
 * Get a specific version's full content (T081)
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateApiToken } from '@/lib/auth/api-token';
import prisma from '@/lib/prisma';
import { SpecVersionService } from '@/lib/services/spec-version';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; specId: string; version: string }> }
) {
  const { projectId, specId, version: versionStr } = await params;
  const version = parseInt(versionStr, 10);

  if (isNaN(version) || version < 1) {
    return NextResponse.json(
      { error: 'Invalid version number' },
      { status: 400 }
    );
  }

  // Validate API token
  const authResult = await validateApiToken(request);
  if (!authResult.valid) {
    return NextResponse.json(
      { error: authResult.error },
      { status: 401 }
    );
  }

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

    // Get the specific version
    const versionRecord = await SpecVersionService.getVersion(specId, version);

    if (!versionRecord) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      specId: versionRecord.specId,
      featureId: spec.featureId,
      featureName: spec.featureName,
      fileType: spec.fileType,
      version: versionRecord.version,
      content: versionRecord.content,
      checksum: versionRecord.checksum,
      modifiedBy: {
        id: versionRecord.modifiedBy,
        name: versionRecord.modifierName,
        email: versionRecord.modifierEmail,
      },
      createdAt: versionRecord.createdAt,
    });
  } catch (error) {
    console.error('Error fetching version:', error);
    return NextResponse.json(
      { error: 'Failed to fetch version' },
      { status: 500 }
    );
  }
}
