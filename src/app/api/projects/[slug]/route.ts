import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * PUT /api/projects/[slug] - Update project name and/or description
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { displayName, description } = body;

    // Find the project by slug (name)
    const project = await prisma.project.findUnique({
      where: { name: slug },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Build update data - only update fields that are provided
    const updateData: Record<string, unknown> = {};

    if (displayName !== undefined) {
      if (typeof displayName !== 'string' || displayName.trim().length === 0) {
        return NextResponse.json(
          { error: 'Display name cannot be empty' },
          { status: 400 }
        );
      }
      updateData.displayName = displayName.trim();
    }

    if (description !== undefined) {
      updateData.description = description || null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const updated = await prisma.project.update({
      where: { name: slug },
      data: updateData,
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      displayName: updated.displayName,
      description: updated.description,
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}
