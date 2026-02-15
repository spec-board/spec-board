import { NextRequest, NextResponse } from 'next/server';
import { getAISettings, setAISettings } from '@/lib/ai/settings';

// GET /api/settings/ai - Get current AI settings
export async function GET() {
  try {
    const settings = getAISettings();

    return NextResponse.json({
      provider: settings.provider,
      openaiBaseUrl: settings.openaiBaseUrl || '',
      anthropicBaseUrl: settings.anthropicBaseUrl || '',
      hasOpenAI: !!settings.openaiApiKey,
      hasAnthropic: !!settings.anthropicApiKey,
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
    const { provider, openaiBaseUrl, anthropicBaseUrl, openaiApiKey, anthropicApiKey } = body;

    setAISettings({
      provider: provider || 'anthropic',
      openaiBaseUrl,
      anthropicBaseUrl,
      openaiApiKey,
      anthropicApiKey,
    });

    const settings = getAISettings();
    return NextResponse.json({
      success: true,
      provider: settings.provider,
      openaiBaseUrl: settings.openaiBaseUrl,
      anthropicBaseUrl: settings.anthropicBaseUrl,
    });
  } catch (error) {
    console.error('Error saving AI settings:', error);
    return NextResponse.json(
      { error: 'Failed to save AI settings' },
      { status: 500 }
    );
  }
}
