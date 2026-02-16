import { NextRequest, NextResponse } from 'next/server';
import { getAISettings, setAISettings } from '@/lib/ai/settings';

// GET /api/settings/ai - Get current AI settings
export async function GET() {
  try {
    const settings = await getAISettings();

    return NextResponse.json({
      provider: settings.provider,
      baseUrl: settings.baseUrl || '',
      model: settings.model || '',
      hasApiKey: !!settings.apiKey,
    });
  } catch (error) {
    console.error('Error getting AI settings:', error);
    return NextResponse.json(
      { error: 'Failed to get AI settings' },
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
