import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/kanban?projectId=xxx - Get kanban board data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const features = await prisma.feature.findMany({
      where: { projectId },
      include: {
        userStories: {
          orderBy: { order: 'asc' },
          include: {
            tasks: { orderBy: { order: 'asc' } },
          },
        },
        tasks: { orderBy: { order: 'asc' } },
      },
      orderBy: { order: 'asc' },
    });

    // Group by stage for kanban (stage now replaces status)
    const kanbanData = {
      backlog: features.filter(f => f.stage === 'backlog'),
      planning: features.filter(f => f.stage === 'planning'),
      in_progress: features.filter(f => f.stage === 'in_progress'),
      done: features.filter(f => f.stage === 'done'),
    };

    return NextResponse.json(kanbanData);
  } catch (error) {
    console.error('Error fetching kanban data:', error);
    return NextResponse.json({ error: 'Failed to fetch kanban data' }, { status: 500 });
  }
}
