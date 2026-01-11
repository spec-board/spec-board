/**
 * GET /api/sync/[projectId]/conflicts
 * List all conflicts for a cloud project (T063)
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateApiToken } from '@/lib/auth/api-token';
import { ConflictService } from '@/lib/services/conflict';
import { SyncService } from '@/lib/services/sync';

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

  // Check user has access to project
  const hasAccess = await SyncService.hasAccess(projectId, authResult.userId!, 'VIEW');
  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }

  try {
    // Parse query params
    const { searchParams } = new URL(request.url);
    const includeResolved = searchParams.get('includeResolved') === 'true';

    // Get conflicts
    const result = await ConflictService.listConflicts(projectId, { includeResolved });

    return NextResponse.json({
      conflicts: result.conflicts,
      total: result.total,
      projectId,
    });
  } catch (error) {
    console.error('Error fetching conflicts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conflicts' },
      { status: 500 }
    );
  }
}
