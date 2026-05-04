import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;

  try {
    const project = await prisma.project.findUnique({ where: { name } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const [nodes, edges] = await Promise.all([
      prisma.mindMapNode.findMany({
        where: { projectId: project.id },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.mindMapEdge.findMany({
        where: { projectId: project.id },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return NextResponse.json({ nodes, edges });
  } catch (error) {
    console.error('Failed to load mind map:', error);
    return NextResponse.json({ error: 'Failed to load mind map' }, { status: 500 });
  }
}

export async function PUT(
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
    const { nodes, edges } = body;

    await prisma.$transaction(async (tx) => {
      await tx.mindMapEdge.deleteMany({ where: { projectId: project.id } });
      await tx.mindMapNode.deleteMany({ where: { projectId: project.id } });

      if (nodes?.length) {
        await tx.mindMapNode.createMany({
          data: nodes.map((n: { id: string; label: string; color: string; positionX: number; positionY: number; type?: string }) => ({
            id: n.id,
            projectId: project.id,
            label: n.label || 'New Idea',
            color: n.color || '#f6ad55',
            positionX: n.positionX,
            positionY: n.positionY,
            type: n.type || 'default',
          })),
        });
      }

      if (edges?.length) {
        await tx.mindMapEdge.createMany({
          data: edges.map((e: { id: string; sourceId: string; targetId: string; label?: string }) => ({
            id: e.id,
            projectId: project.id,
            sourceId: e.sourceId,
            targetId: e.targetId,
            label: e.label || null,
          })),
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save mind map:', error);
    return NextResponse.json({ error: 'Failed to save mind map' }, { status: 500 });
  }
}
