/**
 * POST /api/sync/[projectId]/push
 * Upload specs to cloud (used by MCP set_spec tool)
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateApiToken } from '@/lib/auth/api-token';
import prisma from '@/lib/prisma';
import { pushSpecsSchema } from '@/lib/validations/sync';
import { validateBody, validateUuid } from '@/lib/validations/utils';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  // Validate projectId is a valid UUID
  const uuidResult = validateUuid(projectId, 'projectId');
  if (!uuidResult.success) {
    return uuidResult.error;
  }

  // Validate API token
  const authResult = await validateApiToken(request);
  if (!authResult.valid) {
    return NextResponse.json(
      { error: authResult.error },
      { status: 401 }
    );
  }

  // Validate request body with zod schema
  const bodyResult = await validateBody(request, pushSpecsSchema);
  if (!bodyResult.success) {
    return bodyResult.error;
  }

  const { specs } = bodyResult.data;

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

    // Check user has edit access
    const member = cloudProject.members[0];
    if (!member || member.role === 'VIEW') {
      return NextResponse.json(
        { error: 'Access denied: edit permission required' },
        { status: 403 }
      );
    }

    // Upsert specs
    const syncedFeatures: string[] = [];
    const errors: string[] = [];

    for (const spec of specs) {
      try {
        for (const file of spec.files) {
          await prisma.syncedSpec.upsert({
            where: {
              cloudProjectId_featureId_fileType: {
                cloudProjectId: projectId,
                featureId: spec.featureId,
                fileType: file.type,
              },
            },
            update: {
              content: file.content,
              featureName: spec.featureName,
              lastModifiedBy: authResult.userId,
              updatedAt: new Date(),
            },
            create: {
              cloudProjectId: projectId,
              featureId: spec.featureId,
              featureName: spec.featureName,
              fileType: file.type,
              content: file.content,
              lastModifiedBy: authResult.userId,
            },
          });
        }

        if (!syncedFeatures.includes(spec.featureId)) {
          syncedFeatures.push(spec.featureId);
        }
      } catch (err) {
        errors.push(`Failed to sync ${spec.featureId}: ${err}`);
      }
    }

    // Record sync event (userId is guaranteed when authResult.valid is true)
    if (authResult.userId) {
      await prisma.syncEvent.create({
        data: {
          cloudProjectId: projectId,
          userId: authResult.userId,
          eventType: 'PUSH',
          featuresAffected: syncedFeatures,
        },
      });
    }

    return NextResponse.json({
      success: errors.length === 0,
      message: errors.length === 0
        ? `Successfully synced ${syncedFeatures.length} feature(s)`
        : `Synced with ${errors.length} error(s)`,
      syncedFeatures,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error pushing specs:', error);
    return NextResponse.json(
      { error: 'Failed to push specs' },
      { status: 500 }
    );
  }
}
