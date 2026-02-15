import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/stories - List user stories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featureId = searchParams.get('featureId');

    const where = featureId ? { featureId } : {};

    const stories = await prisma.userStory.findMany({
      where,
      include: {
        feature: true,
        tasks: { orderBy: { order: 'asc' } },
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(stories);
  } catch (error) {
    console.error('Error fetching user stories:', error);
    return NextResponse.json({ error: 'Failed to fetch user stories' }, { status: 500 });
  }
}

// POST /api/stories - Create a new user story
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { featureId, storyId, title, description, status, order } = body;

    if (!featureId || !storyId || !title) {
      return NextResponse.json(
        { error: 'featureId, storyId, and title are required' },
        { status: 400 }
      );
    }

    // Check if story already exists
    const existing = await prisma.userStory.findUnique({
      where: {
        featureId_storyId: { featureId, storyId },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'User story already exists' }, { status: 409 });
    }

    const story = await prisma.userStory.create({
      data: {
        featureId,
        storyId,
        title,
        description,
        status: status || 'pending',
        order: order || 0,
      },
      include: {
        feature: true,
        tasks: true,
      },
    });

    return NextResponse.json(story, { status: 201 });
  } catch (error) {
    console.error('Error creating user story:', error);
    return NextResponse.json({ error: 'Failed to create user story' }, { status: 500 });
  }
}
