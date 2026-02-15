import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/stories/[id] - Get a user story by ID
// PUT /api/stories/[id] - Update a user story
// DELETE /api/stories/[id] - Delete a user story

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const story = await prisma.userStory.findUnique({
      where: { id },
      include: {
        feature: true,
        tasks: { orderBy: { order: 'asc' } },
      },
    });

    if (!story) {
      return NextResponse.json({ error: 'User story not found' }, { status: 404 });
    }

    return NextResponse.json(story);
  } catch (error) {
    console.error('Error fetching user story:', error);
    return NextResponse.json({ error: 'Failed to fetch user story' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { title, description, status, order } = body;

    const story = await prisma.userStory.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(order !== undefined && { order }),
      },
      include: {
        feature: true,
        tasks: true,
      },
    });

    return NextResponse.json(story);
  } catch (error) {
    console.error('Error updating user story:', error);
    return NextResponse.json({ error: 'Failed to update user story' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.userStory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user story:', error);
    return NextResponse.json({ error: 'Failed to delete user story' }, { status: 500 });
  }
}
