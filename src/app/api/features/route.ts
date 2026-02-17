import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/features - List all features
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const where = projectId ? { projectId } : {};

    const features = await prisma.feature.findMany({
      where,
      include: {
        userStories: { orderBy: { order: 'asc' } },
        tasks: { orderBy: { order: 'asc' } },
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(features);
  } catch (error) {
    console.error('Error fetching features:', error);
    return NextResponse.json({ error: 'Failed to fetch features' }, { status: 500 });
  }
}

// POST /api/features - Create a new feature
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, featureId, name, description, stage, order } = body;

    if (!projectId || !featureId || !name) {
      return NextResponse.json(
        { error: 'projectId, featureId, and name are required' },
        { status: 400 }
      );
    }

    // Check if feature already exists
    const existing = await prisma.feature.findUnique({
      where: {
        projectId_featureId: { projectId, featureId },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Feature already exists' },
        { status: 409 }
      );
    }

    const feature = await prisma.feature.create({
      data: {
        projectId,
        featureId,
        name,
        description,
        stage: stage || 'specify',
        order: order || 0,
      },
      include: {
        userStories: true,
        tasks: true,
      },
    });

    return NextResponse.json(feature, { status: 201 });
  } catch (error) {
    console.error('Error creating feature:', error);
    return NextResponse.json({ error: 'Failed to create feature' }, { status: 500 });
  }
}
