import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OAUTH_PROVIDERS } from '@/lib/ai/oauth-config';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { provider, device_code, code, code_verifier, redirect_uri } = body;
    const config = OAUTH_PROVIDERS[provider];

    if (!config || !config.tokenUrl) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    const tokenParams = new URLSearchParams();

    if (config.flow === 'device_code' && device_code) {
      // Device code token exchange (Qwen, Kimi)
      tokenParams.set('grant_type', 'urn:ietf:params:oauth:grant-type:device_code');
      tokenParams.set('device_code', device_code);
      tokenParams.set('client_id', config.clientId || '');
    } else if (config.flow === 'pkce' && code) {
      // PKCE authorization code exchange (Codex)
      tokenParams.set('grant_type', 'authorization_code');
      tokenParams.set('code', code);
      tokenParams.set('client_id', config.clientId || '');
      tokenParams.set('code_verifier', code_verifier || '');
      tokenParams.set('redirect_uri', redirect_uri || '');
      // OpenAI requires audience parameter
      if (config.audience) {
        tokenParams.set('audience', config.audience);
      }
    } else {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const res = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    });

    const data = await res.json();

    // Handle "authorization_pending" for device code flow
    if (data.error === 'authorization_pending') {
      return NextResponse.json({ status: 'pending' });
    }

    if (data.error === 'slow_down') {
      return NextResponse.json({ status: 'pending', slow_down: true });
    }

    if (data.error) {
      return NextResponse.json({ status: 'error', error: data.error_description || data.error }, { status: 400 });
    }

    if (!data.access_token) {
      return NextResponse.json({ status: 'error', error: 'No access token received' }, { status: 400 });
    }

    // Save OAuth tokens to ai_provider_configs table
    const expiresAt = data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : null;

    // Check if provider config already exists for this provider
    const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT "id" FROM "ai_provider_configs" WHERE "provider" = $1 LIMIT 1`,
      provider
    );

    const baseUrl = (config.flow === 'device_code' && data.resource_url)
      ? data.resource_url
      : (config as any).baseUrl || 'https://api.openai.com/v1';

    if (existing.length > 0) {
      // Update existing provider config with new OAuth tokens
      await prisma.$executeRawUnsafe(
        `UPDATE "ai_provider_configs"
         SET "oauthToken" = $1, "oauthRefresh" = $2, "oauthExpiresAt" = $3,
             "baseUrl" = $4, "enabled" = true, "updated_at" = NOW()
         WHERE "id" = $5::uuid`,
        data.access_token, data.refresh_token || null, expiresAt,
        baseUrl, existing[0].id
      );
    } else {
      // Create new provider config with OAuth tokens
      const maxResult = await prisma.$queryRawUnsafe<[{ max: number | null }]>(
        `SELECT MAX("priority") as max FROM "ai_provider_configs"`
      );
      const nextPriority = ((maxResult[0]?.max) ?? -1) + 1;

      // Get model from PROVIDER_PRESETS equivalent
      const defaultModels: Record<string, string> = {
        codex: 'codex-mini-latest',
        kimi: 'kimi-latest',
        iflow: 'Qwen3-Coder',
      };

      await prisma.$executeRawUnsafe(
        `INSERT INTO "ai_provider_configs"
         ("id","provider","label","baseUrl","model","oauthToken","oauthRefresh","oauthExpiresAt","priority","enabled","created_at","updated_at")
         VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,$8,true,NOW(),NOW())`,
        provider, config.name, baseUrl, defaultModels[provider] || 'default',
        data.access_token, data.refresh_token || null, expiresAt, nextPriority
      );
    }

    // Also update appSettings for backward compatibility
    let settings = await prisma.appSettings.findFirst();
    if (!settings) {
      settings = await prisma.appSettings.create({ data: {} });
    }
    await prisma.appSettings.update({
      where: { id: settings.id },
      data: {
        aiProvider: provider,
        oauthAccessToken: data.access_token,
        oauthRefreshToken: data.refresh_token || null,
        oauthExpiresAt: expiresAt,
        oauthProvider: provider,
      },
    });

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Token exchange error:', error);
    return NextResponse.json({ status: 'error', error: 'Token exchange failed' }, { status: 500 });
  }
}
