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
    if (!body.sourceId || !body.targetId) {
      return NextResponse.json({ error: 'sourceId and targetId required' }, { status: 400 });
    }

    const edge = await prisma.mindMapEdge.create({
      data: {
        projectId: project.id,
        sourceId: body.sourceId,
        targetId: body.targetId,
        label: body.label || null,
        type: body.type || 'default',
      },
    });

    return NextResponse.json(edge, { status: 201 });
  } catch (error) {
    console.error('Failed to create edge:', error);
    return NextResponse.json({ error: 'Failed to create edge' }, { status: 500 });
  }
}
