import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface ProviderRow {
  id: string;
  provider: string;
  label: string;
  baseUrl: string;
  model: string;
  apiKey: string | null;
  oauthToken: string | null;
  oauthRefresh: string | null;
  oauthExpiresAt: Date | null;
  enabled: boolean;
  priority: number;
  created_at: Date;
  updated_at: Date;
}

// GET - List all providers (sorted by priority)
export async function GET() {
  try {
    const providers = await prisma.$queryRawUnsafe<ProviderRow[]>(
      `SELECT * FROM "ai_provider_configs" ORDER BY "priority" ASC`
    );

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
    const maxResult = await prisma.$queryRawUnsafe<[{ max: number | null }]>(
      `SELECT MAX("priority") as max FROM "ai_provider_configs"`
    );
    const nextPriority = ((maxResult[0]?.max) ?? -1) + 1;

    const created = await prisma.$queryRawUnsafe<ProviderRow[]>(
      `INSERT INTO "ai_provider_configs"
        ("id", "provider", "label", "baseUrl", "model", "apiKey", "priority", "enabled", "created_at", "updated_at")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, true, NOW(), NOW())
       RETURNING *`,
      provider, label, baseUrl, model, apiKey || null, nextPriority
    );

    const row = created[0];
    return NextResponse.json({
      ...row,
      apiKey: row.apiKey ? '***' : null,
      hasApiKey: !!row.apiKey,
      hasOAuth: !!row.oauthToken,
    });
  } catch (error) {
    console.error('Failed to create provider:', error);
    const message = error instanceof Error ? error.message : 'Failed to create provider';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT - Update provider(s): supports single update or batch priority reorder
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    // Batch priority reorder: { reorder: [{ id, priority }] }
    if (body.reorder && Array.isArray(body.reorder)) {
      for (const item of body.reorder) {
        await prisma.$executeRawUnsafe(
          `UPDATE "ai_provider_configs" SET "priority" = $1, "updated_at" = NOW() WHERE "id" = $2`,
          item.priority, item.id
        );
      }
      return NextResponse.json({ success: true });
    }

    // Single provider update: { id, ...fields }
    const { id, ...updateFields } = body;
    if (!id) {
      return NextResponse.json({ error: 'Missing provider id' }, { status: 400 });
    }

    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (updateFields.label !== undefined) { setClauses.push(`"label" = $${paramIndex++}`); values.push(updateFields.label); }
    if (updateFields.baseUrl !== undefined) { setClauses.push(`"baseUrl" = $${paramIndex++}`); values.push(updateFields.baseUrl); }
    if (updateFields.model !== undefined) { setClauses.push(`"model" = $${paramIndex++}`); values.push(updateFields.model); }
    if (updateFields.apiKey !== undefined) { setClauses.push(`"apiKey" = $${paramIndex++}`); values.push(updateFields.apiKey || null); }
    if (updateFields.enabled !== undefined) { setClauses.push(`"enabled" = $${paramIndex++}`); values.push(updateFields.enabled); }
    if (updateFields.priority !== undefined) { setClauses.push(`"priority" = $${paramIndex++}`); values.push(updateFields.priority); }

    setClauses.push(`"updated_at" = NOW()`);
    values.push(id);

    const updated = await prisma.$queryRawUnsafe<ProviderRow[]>(
      `UPDATE "ai_provider_configs" SET ${setClauses.join(', ')} WHERE "id" = $${paramIndex} RETURNING *`,
      ...values
    );

    const row = updated[0];
    if (!row) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...row,
      apiKey: row.apiKey ? '***' : null,
      hasApiKey: !!row.apiKey,
      hasOAuth: !!row.oauthToken,
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

    await prisma.$executeRawUnsafe(
      `DELETE FROM "ai_provider_configs" WHERE "id" = $1`,
      id
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete provider:', error);
    return NextResponse.json({ error: 'Failed to delete provider' }, { status: 500 });
  }
}
