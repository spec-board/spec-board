import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tasks - List tasks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featureId = searchParams.get('featureId');
    const userStoryId = searchParams.get('userStoryId');

    const where: Record<string, string> = {};
    if (featureId) where.featureId = featureId;
    if (userStoryId) where.userStoryId = userStoryId;

    const tasks = await prisma.task.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        feature: true,
        userStory: true,
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { featureId, userStoryId, taskId, title, description, status, priority, order } = body;

    if (!featureId || !taskId || !title) {
      return NextResponse.json(
        { error: 'featureId, taskId, and title are required' },
        { status: 400 }
      );
    }

    // Check if task already exists
    const existing = await prisma.task.findUnique({
      where: {
        featureId_taskId: { featureId, taskId },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Task already exists' }, { status: 409 });
    }

    const task = await prisma.task.create({
      data: {
        featureId,
        userStoryId,
        taskId,
        title,
        description,
        status: status || 'pending',
        priority: priority || 'P',
        order: order || 0,
      },
      include: {
        feature: true,
        userStory: true,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
