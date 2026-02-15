import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/tasks/[id]/toggle
 * Toggle task status between pending and completed
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get current task
    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Toggle status
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { status: newStatus },
      include: {
        feature: true,
        userStory: true,
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Error toggling task:', error);
    return NextResponse.json({ error: 'Failed to toggle task' }, { status: 500 });
  }
}
