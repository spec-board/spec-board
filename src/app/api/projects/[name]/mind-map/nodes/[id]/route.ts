import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ name: string; id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const node = await prisma.mindMapNode.update({
      where: { id },
      data: {
        ...(body.label !== undefined && { label: body.label }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.positionX !== undefined && { positionX: body.positionX }),
        ...(body.positionY !== undefined && { positionY: body.positionY }),
        ...(body.type !== undefined && { type: body.type }),
      },
    });

    return NextResponse.json(node);
  } catch (error) {
    console.error('Failed to update node:', error);
    return NextResponse.json({ error: 'Failed to update node' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string; id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.mindMapNode.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete node:', error);
    return NextResponse.json({ error: 'Failed to delete node' }, { status: 500 });
  }
}
