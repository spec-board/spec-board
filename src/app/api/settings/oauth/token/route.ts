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

    let tokenBody: Record<string, string>;

    if (config.flow === 'device_code' && device_code) {
      // Device code token exchange (Qwen, Kimi)
      tokenBody = {
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
        device_code,
        client_id: config.clientId || '',
      };
    } else if (config.flow === 'pkce' && code) {
      // PKCE authorization code exchange (Codex)
      tokenBody = {
        grant_type: 'authorization_code',
        code,
        client_id: config.clientId || '',
        code_verifier: code_verifier || '',
        redirect_uri: redirect_uri || '',
      };
    } else {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const res = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokenBody),
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

    // Save OAuth tokens to database
    const expiresAt = data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : null;

    // Get or create settings
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
        // Set the correct base URL and model for the provider
        openaiBaseUrl: config.flow === 'device_code' && data.resource_url
          ? data.resource_url
          : undefined,
      },
    });

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Token exchange error:', error);
    return NextResponse.json({ status: 'error', error: 'Token exchange failed' }, { status: 500 });
  }
}
