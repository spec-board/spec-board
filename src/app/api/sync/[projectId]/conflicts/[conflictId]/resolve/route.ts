/**
 * POST /api/sync/[projectId]/conflicts/[conflictId]/resolve
 * Resolve a specific conflict (T064)
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateApiToken } from '@/lib/auth/api-token';
import { ConflictService } from '@/lib/services/conflict';
import { SyncService } from '@/lib/services/sync';
import { resolveConflictSchema } from '@/lib/validations/sync';
import { validateBody, validateUuid } from '@/lib/validations/utils';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; conflictId: string }> }
) {
  const { projectId, conflictId } = await params;

  // Validate path parameters
  const projectIdResult = validateUuid(projectId, 'projectId');
  if (!projectIdResult.success) {
    return projectIdResult.error;
  }

  const conflictIdResult = validateUuid(conflictId, 'conflictId');
  if (!conflictIdResult.success) {
    return conflictIdResult.error;
  }

  // Validate API token
  const authResult = await validateApiToken(request);
  if (!authResult.valid) {
    return NextResponse.json(
      { error: authResult.error },
      { status: 401 }
    );
  }

  // Check user has EDIT access to project
  const hasAccess = await SyncService.hasAccess(projectId, authResult.userId!, 'EDIT');
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Access denied. EDIT permission required.' },
      { status: 403 }
    );
  }

  // Validate request body with zod schema
  const bodyResult = await validateBody(request, resolveConflictSchema);
  if (!bodyResult.success) {
    return bodyResult.error;
  }

  const { resolution, mergedContent } = bodyResult.data;

  try {
    // Resolve the conflict
    const result = await ConflictService.resolve(
      conflictId,
      authResult.userId!,
      resolution,
      mergedContent
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      conflictId,
      resolution,
      resolvedContent: result.resolvedContent,
    });
  } catch (error) {
    console.error('Error resolving conflict:', error);
    return NextResponse.json(
      { error: 'Failed to resolve conflict' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sync/[projectId]/conflicts/[conflictId]/resolve
 * Get auto-merge suggestion for a conflict
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; conflictId: string }> }
) {
  const { projectId, conflictId } = await params;

  // Validate API token
  const authResult = await validateApiToken(request);
  if (!authResult.valid) {
    return NextResponse.json(
      { error: authResult.error },
      { status: 401 }
    );
  }

  // Check user has VIEW access to project
  const hasAccess = await SyncService.hasAccess(projectId, authResult.userId!, 'VIEW');
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }

  try {
    // Get conflict details
    const conflict = await ConflictService.getConflict(conflictId);
    if (!conflict) {
      return NextResponse.json(
        { error: 'Conflict not found' },
        { status: 404 }
      );
    }

    // Try auto-merge
    const autoMergeResult = await ConflictService.tryAutoMerge(conflictId);

    return NextResponse.json({
      conflict,
      autoMerge: autoMergeResult,
    });
  } catch (error) {
    console.error('Error fetching conflict details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conflict details' },
      { status: 500 }
    );
  }
}
