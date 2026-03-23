import { NextRequest, NextResponse } from 'next/server';
import { getAISettings, setAISettings } from '@/lib/ai/settings';
import { prisma } from '@/lib/prisma';

// GET /api/settings/ai - Get current AI settings
export async function GET() {
  try {
    const settings = await getAISettings();

    // Also check if any multi-provider configs are enabled
    let hasProviderConfigs = false;
    try {
      const count = await prisma.providerConfig.count({
        where: { enabled: true },
      });
      hasProviderConfigs = count > 0;
    } catch {
      // Table may not exist yet
    }

    return NextResponse.json({
      provider: settings.provider,
      baseUrl: settings.baseUrl || '',
      model: settings.model || '',
      hasApiKey: !!settings.apiKey || hasProviderConfigs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error getting AI settings:', message);
    return NextResponse.json(
      { error: 'Failed to get AI settings', details: message },
      { status: 500 }
    );
  }
}

// POST /api/settings/ai - Save AI settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, baseUrl, apiKey, model } = body;

    const settings = await setAISettings({
      provider: provider || 'openai',
      baseUrl,
      apiKey,
      model,
    });

    return NextResponse.json({
      success: true,
      provider: settings.provider,
      baseUrl: settings.baseUrl,
      model: settings.model,
      hasApiKey: !!settings.apiKey,
    });
  } catch (error) {
    console.error('Error saving AI settings:', error);
    return NextResponse.json(
      { error: 'Failed to save AI settings' },
      { status: 500 }
    );
  }
}
