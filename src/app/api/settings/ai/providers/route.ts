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

function maskProvider(p: ProviderRow) {
  return {
    ...p,
    apiKey: p.apiKey ? '***' : null,
    oauthToken: p.oauthToken ? '***' : null,
    oauthRefresh: undefined,
    hasApiKey: !!p.apiKey,
    hasOAuth: !!p.oauthToken,
  };
}

export async function GET() {
  try {
    const providers = await prisma.$queryRawUnsafe<ProviderRow[]>(
      `SELECT * FROM "ai_provider_configs" ORDER BY "priority" ASC`
    );
    return NextResponse.json(providers.map(maskProvider));
  } catch (error) {
    console.error('Failed to load providers:', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const { provider, label, baseUrl, model, apiKey } = await request.json();

    if (!provider || !label || !baseUrl || !model) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const maxResult = await prisma.$queryRawUnsafe<[{ max: number | null }]>(
      `SELECT MAX("priority") as max FROM "ai_provider_configs"`
    );
    const nextPriority = ((maxResult[0]?.max) ?? -1) + 1;

    const rows = await prisma.$queryRawUnsafe<ProviderRow[]>(
      `INSERT INTO "ai_provider_configs"
       ("id","provider","label","baseUrl","model","apiKey","priority","enabled","created_at","updated_at")
       VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,true,NOW(),NOW())
       RETURNING *`,
      provider, label, baseUrl, model, apiKey || null, nextPriority
    );

    return NextResponse.json(maskProvider(rows[0]));
  } catch (error) {
    console.error('Failed to create provider:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create provider' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    if (body.reorder && Array.isArray(body.reorder)) {
      for (const item of body.reorder) {
        await prisma.$executeRawUnsafe(
          `UPDATE "ai_provider_configs" SET "priority"=$1,"updated_at"=NOW() WHERE "id"=$2::uuid`,
          item.priority, item.id
        );
      }
      return NextResponse.json({ success: true });
    }

    const { id, ...fields } = body;
    if (!id) {
      return NextResponse.json({ error: 'Missing provider id' }, { status: 400 });
    }

    const sets: string[] = [];
    const vals: unknown[] = [];
    let pi = 1;

    if (fields.label !== undefined) { sets.push(`"label"=$${pi++}`); vals.push(fields.label); }
    if (fields.baseUrl !== undefined) { sets.push(`"baseUrl"=$${pi++}`); vals.push(fields.baseUrl); }
    if (fields.model !== undefined) { sets.push(`"model"=$${pi++}`); vals.push(fields.model); }
    if (fields.apiKey !== undefined) { sets.push(`"apiKey"=$${pi++}`); vals.push(fields.apiKey || null); }
    if (fields.enabled !== undefined) { sets.push(`"enabled"=$${pi++}`); vals.push(fields.enabled); }
    if (fields.priority !== undefined) { sets.push(`"priority"=$${pi++}`); vals.push(fields.priority); }

    sets.push(`"updated_at"=NOW()`);
    vals.push(id);

    const rows = await prisma.$queryRawUnsafe<ProviderRow[]>(
      `UPDATE "ai_provider_configs" SET ${sets.join(',')} WHERE "id"=$${pi}::uuid RETURNING *`,
      ...vals
    );

    if (!rows[0]) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }
    return NextResponse.json(maskProvider(rows[0]));
  } catch (error) {
    console.error('Failed to update provider:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update provider' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing provider id' }, { status: 400 });
    }

    await prisma.$executeRawUnsafe(
      `DELETE FROM "ai_provider_configs" WHERE "id"=$1::uuid`,
      id
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete provider:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete provider' },
      { status: 500 }
    );
  }
}
