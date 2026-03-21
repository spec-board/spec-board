import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const settings = await prisma.appSettings.findFirst();
    if (!settings) {
      return NextResponse.json({ error: 'No settings found' }, { status: 404 });
    }

    await prisma.appSettings.update({
      where: { id: settings.id },
      data: {
        oauthAccessToken: null,
        oauthRefreshToken: null,
        oauthExpiresAt: null,
        oauthProvider: null,
      },
    });

    return NextResponse.json({ status: 'disconnected' });
  } catch (error) {
    console.error('Disconnect error:', error);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
