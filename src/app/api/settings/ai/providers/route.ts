import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - List all providers (sorted by priority)
export async function GET() {
  try {
    const providers = await prisma.aIProviderConfig.findMany({
      orderBy: { priority: 'asc' },
    });

    // Mask API keys in response
    const masked = providers.map((p) => ({
      ...p,
      apiKey: p.apiKey ? '***' : null,
      oauthToken: p.oauthToken ? '***' : null,
      oauthRefresh: undefined,
      hasApiKey: !!p.apiKey,
      hasOAuth: !!p.oauthToken,
    }));

    return NextResponse.json(masked);
  } catch (error) {
    console.error('Failed to load providers:', error);
    return NextResponse.json([], { status: 200 });
  }
}

// POST - Add a new provider
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { provider, label, baseUrl, model, apiKey } = body;

    if (!provider || !label || !baseUrl || !model) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get max priority to append at end
    const maxPriority = await prisma.aIProviderConfig.aggregate({
      _max: { priority: true },
    });
    const nextPriority = (maxPriority._max.priority ?? -1) + 1;

    const created = await prisma.aIProviderConfig.create({
      data: {
        provider,
        label,
        baseUrl,
        model,
        apiKey: apiKey || null,
        priority: nextPriority,
        enabled: true,
      },
    });

    return NextResponse.json({
      ...created,
      apiKey: created.apiKey ? '***' : null,
      hasApiKey: !!created.apiKey,
      hasOAuth: !!created.oauthToken,
    });
  } catch (error) {
    console.error('Failed to create provider:', error);
    return NextResponse.json({ error: 'Failed to create provider' }, { status: 500 });
  }
}

// PUT - Update provider(s): supports single update or batch priority reorder
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    // Batch priority reorder: { reorder: [{ id, priority }] }
    if (body.reorder && Array.isArray(body.reorder)) {
      await prisma.$transaction(
        body.reorder.map((item: { id: string; priority: number }) =>
          prisma.aIProviderConfig.update({
            where: { id: item.id },
            data: { priority: item.priority },
          })
        )
      );
      return NextResponse.json({ success: true });
    }

    // Single provider update: { id, ...fields }
    const { id, ...updateFields } = body;
    if (!id) {
      return NextResponse.json({ error: 'Missing provider id' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (updateFields.label !== undefined) updateData.label = updateFields.label;
    if (updateFields.baseUrl !== undefined) updateData.baseUrl = updateFields.baseUrl;
    if (updateFields.model !== undefined) updateData.model = updateFields.model;
    if (updateFields.apiKey !== undefined) updateData.apiKey = updateFields.apiKey || null;
    if (updateFields.enabled !== undefined) updateData.enabled = updateFields.enabled;
    if (updateFields.priority !== undefined) updateData.priority = updateFields.priority;

    const updated = await prisma.aIProviderConfig.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      ...updated,
      apiKey: updated.apiKey ? '***' : null,
      hasApiKey: !!updated.apiKey,
      hasOAuth: !!updated.oauthToken,
    });
  } catch (error) {
    console.error('Failed to update provider:', error);
    return NextResponse.json({ error: 'Failed to update provider' }, { status: 500 });
  }
}

// DELETE - Remove a provider
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing provider id' }, { status: 400 });
    }

    await prisma.aIProviderConfig.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete provider:', error);
    return NextResponse.json({ error: 'Failed to delete provider' }, { status: 500 });
  }
}
