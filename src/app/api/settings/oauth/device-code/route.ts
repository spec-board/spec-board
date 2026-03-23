import { NextResponse } from 'next/server';
import { OAUTH_PROVIDERS } from '@/lib/ai/oauth-config';

export async function POST(request: Request) {
  try {
    const { provider } = await request.json();
    const config = OAUTH_PROVIDERS[provider];

    if (!config || config.flow !== 'device_code' || !config.deviceAuthorizationUrl) {
      return NextResponse.json({ error: 'Invalid provider for device code flow' }, { status: 400 });
    }

    const res = await fetch(config.deviceAuthorizationUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: config.clientId }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Provider error: ${text}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({
      device_code: data.device_code,
      user_code: data.user_code,
      verification_uri: data.verification_uri || data.verification_url,
      expires_in: data.expires_in,
      interval: data.interval || 5,
    });
  } catch (error) {
    console.error('Device code error:', error);
    return NextResponse.json({ error: 'Failed to initiate device code flow' }, { status: 500 });
  }
}
