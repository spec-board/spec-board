import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST - Save OAuth token to a specific provider config
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { providerId, oauthToken, oauthRefresh, oauthExpiresAt } = body;

    if (!providerId || !oauthToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updated = await prisma.aIProviderConfig.update({
      where: { id: providerId },
      data: {
        oauthToken,
        oauthRefresh: oauthRefresh || null,
        oauthExpiresAt: oauthExpiresAt ? new Date(oauthExpiresAt) : null,
      },
    });

    return NextResponse.json({
      success: true,
      hasOAuth: !!updated.oauthToken,
    });
  } catch (error) {
    console.error('Failed to save OAuth token:', error);
    return NextResponse.json({ error: 'Failed to save OAuth token' }, { status: 500 });
  }
}

// DELETE - Disconnect OAuth from a specific provider config
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    if (!providerId) {
      return NextResponse.json({ error: 'Missing providerId' }, { status: 400 });
    }

    await prisma.aIProviderConfig.update({
      where: { id: providerId },
      data: {
        oauthToken: null,
        oauthRefresh: null,
        oauthExpiresAt: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to disconnect OAuth:', error);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
