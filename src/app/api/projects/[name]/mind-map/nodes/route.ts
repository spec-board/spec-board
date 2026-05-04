import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;

  try {
    const project = await prisma.project.findUnique({ where: { name } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const node = await prisma.mindMapNode.create({
      data: {
        projectId: project.id,
        label: body.label || 'New Idea',
        color: body.color || '#f6ad55',
        positionX: body.positionX ?? 0,
        positionY: body.positionY ?? 0,
        parentId: body.parentId || null,
        type: body.type || 'default',
      },
    });

    return NextResponse.json(node, { status: 201 });
  } catch (error) {
    console.error('Failed to create node:', error);
    return NextResponse.json({ error: 'Failed to create node' }, { status: 500 });
  }
}
