/**
 * POST /api/sync/[projectId]/conflicts/[conflictId]/resolve
 * Resolve a specific conflict (T064)
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateApiToken } from '@/lib/auth/api-token';
import { ConflictService } from '@/lib/services/conflict';
import { SyncService } from '@/lib/services/sync';

export const dynamic = 'force-dynamic';

interface ResolveRequestBody {
  resolution: 'LOCAL' | 'CLOUD' | 'MERGED';
  mergedContent?: string;
}

export async function POST(
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

  // Check user has EDIT access to project
  const hasAccess = await SyncService.hasAccess(projectId, authResult.userId!, 'EDIT');
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Access denied. EDIT permission required.' },
      { status: 403 }
    );
  }

  try {
    // Parse request body
    const body: ResolveRequestBody = await request.json();
    const { resolution, mergedContent } = body;

    // Validate resolution type
    if (!['LOCAL', 'CLOUD', 'MERGED'].includes(resolution)) {
      return NextResponse.json(
        { error: 'Invalid resolution type. Must be LOCAL, CLOUD, or MERGED.' },
        { status: 400 }
      );
    }

    // Validate merged content for MERGED resolution
    if (resolution === 'MERGED' && !mergedContent) {
      return NextResponse.json(
        { error: 'mergedContent is required for MERGED resolution' },
        { status: 400 }
      );
    }

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
