import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/features/[id]/status
 * Update feature status (for Kanban drag-and-drop)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['backlog', 'planning', 'in_progress', 'done'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const feature = await prisma.feature.update({
      where: { id },
      data: { status },
      include: {
        userStories: { orderBy: { order: 'asc' } },
        tasks: { orderBy: { order: 'asc' } },
      },
    });

    return NextResponse.json(feature);
  } catch (error) {
    console.error('Error updating feature status:', error);
    return NextResponse.json({ error: 'Failed to update feature status' }, { status: 500 });
  }
}
