import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/features/[id] - Get a feature by ID
// PUT /api/features/[id] - Update a feature
// DELETE /api/features/[id] - Delete a feature

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const feature = await prisma.feature.findUnique({
      where: { id },
      include: {
        userStories: { orderBy: { order: 'asc' } },
        tasks: { orderBy: { order: 'asc' } },
      },
    });

    if (!feature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
    }

    return NextResponse.json(feature);
  } catch (error) {
    console.error('Error fetching feature:', error);
    return NextResponse.json({ error: 'Failed to fetch feature' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { name, description, stage, status, order } = body;

    const feature = await prisma.feature.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(stage && { stage }),
        ...(status && { status }),
        ...(order !== undefined && { order }),
      },
      include: {
        userStories: true,
        tasks: true,
      },
    });

    return NextResponse.json(feature);
  } catch (error) {
    console.error('Error updating feature:', error);
    return NextResponse.json({ error: 'Failed to update feature' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.feature.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting feature:', error);
    return NextResponse.json({ error: 'Failed to delete feature' }, { status: 500 });
  }
}
