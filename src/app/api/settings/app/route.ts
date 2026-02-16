import { NextRequest, NextResponse } from 'next/server';
import { getAppSettings, setAppSettings } from '@/lib/ai/settings';

// GET /api/settings/app - Get current app settings
export async function GET() {
  try {
    const settings = await getAppSettings();

    return NextResponse.json({
      theme: settings.theme,
      shortcutsEnabled: settings.shortcutsEnabled,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error getting app settings:', message);
    return NextResponse.json(
      { error: 'Failed to get app settings', details: message },
      { status: 500 }
    );
  }
}

// POST /api/settings/app - Save app settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { theme, shortcutsEnabled } = body;

    const settings = await setAppSettings({
      theme,
      shortcutsEnabled,
    });

    return NextResponse.json({
      success: true,
      theme: settings.theme,
      shortcutsEnabled: settings.shortcutsEnabled,
    });
  } catch (error) {
    console.error('Error saving app settings:', error);
    return NextResponse.json(
      { error: 'Failed to save app settings' },
      { status: 500 }
    );
  }
}
