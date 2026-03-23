import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface ProviderRow {
  provider: string;
  baseUrl: string;
}

// Mapping from env var patterns to provider configs
const ENV_PROVIDER_MAP: {
  envKey: string;
  envBaseUrl?: string;
  envModel?: string;
  provider: string;
  label: string;
  defaultBaseUrl: string;
  defaultModel: string;
}[] = [
  {
    envKey: 'OPENAI_API_KEY',
    envBaseUrl: 'OPENAI_BASE_URL',
    envModel: 'OPENAI_MODEL',
    provider: 'openai',
    label: 'OpenAI Compatible API',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
  },
  {
    envKey: 'ANTHROPIC_API_KEY',
    envBaseUrl: 'ANTHROPIC_BASE_URL',
    envModel: 'ANTHROPIC_MODEL',
    provider: 'anthropic',
    label: 'Anthropic Claude Compatible API',
    defaultBaseUrl: 'https://api.anthropic.com',
    defaultModel: 'claude-sonnet-4-20250514',
  },
  {
    envKey: 'GEMINI_API_KEY',
    envBaseUrl: 'GEMINI_BASE_URL',
    envModel: 'GEMINI_MODEL',
    provider: 'gemini',
    label: 'Google Gemini API',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.5-flash',
  },
  {
    envKey: 'GOOGLE_API_KEY',
    envModel: 'GOOGLE_MODEL',
    provider: 'gemini',
    label: 'Google Gemini API',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-2.5-flash',
  },
  {
    envKey: 'MISTRAL_API_KEY',
    envModel: 'MISTRAL_MODEL',
    provider: 'mistral',
    label: 'Mistral / Codestral',
    defaultBaseUrl: 'https://api.mistral.ai/v1',
    defaultModel: 'codestral-latest',
  },
  {
    envKey: 'QWEN_API_KEY',
    envBaseUrl: 'QWEN_BASE_URL',
    envModel: 'QWEN_MODEL',
    provider: 'qwen',
    label: 'Qwen',
    defaultBaseUrl: 'https://chat.qwen.ai/api/v1',
    defaultModel: 'qwen-max',
  },
  {
    envKey: 'IFLOW_API_KEY',
    envModel: 'IFLOW_MODEL',
    provider: 'iflow',
    label: 'iFlow',
    defaultBaseUrl: 'https://apis.iflow.cn/v1',
    defaultModel: 'Qwen3-Coder',
  },
];

// GET - Scan env vars and return what's available (preview, no write)
export async function GET() {
  const found: { provider: string; label: string; envKey: string; hasBaseUrl: boolean; hasModel: boolean }[] = [];
  const seen = new Set<string>();

  for (const mapping of ENV_PROVIDER_MAP) {
    const apiKey = process.env[mapping.envKey];
    if (apiKey && !seen.has(mapping.provider)) {
      seen.add(mapping.provider);
      found.push({
        provider: mapping.provider,
        label: mapping.label,
        envKey: mapping.envKey,
        hasBaseUrl: !!(mapping.envBaseUrl && process.env[mapping.envBaseUrl]),
        hasModel: !!(mapping.envModel && process.env[mapping.envModel]),
      });
    }
  }

  return NextResponse.json({ found });
}

// POST - Import providers from env vars into database
export async function POST() {
  try {
    const imported: string[] = [];
    const skipped: string[] = [];
    const seen = new Set<string>();

    // Get existing providers to avoid duplicates
    const existing = await prisma.$queryRawUnsafe<ProviderRow[]>(
      `SELECT "provider", "baseUrl" FROM "ai_provider_configs"`
    );
    const existingKeys = new Set(existing.map(e => `${e.provider}:${e.baseUrl}`));

    // Get max priority
    const maxResult = await prisma.$queryRawUnsafe<[{ max: number | null }]>(
      `SELECT MAX("priority") as max FROM "ai_provider_configs"`
    );
    let nextPriority = ((maxResult[0]?.max) ?? -1) + 1;

    for (const mapping of ENV_PROVIDER_MAP) {
      const apiKey = process.env[mapping.envKey];
      if (!apiKey || seen.has(mapping.provider)) continue;
      seen.add(mapping.provider);

      const baseUrl = (mapping.envBaseUrl && process.env[mapping.envBaseUrl]) || mapping.defaultBaseUrl;
      const model = (mapping.envModel && process.env[mapping.envModel]) || mapping.defaultModel;

      const key = `${mapping.provider}:${baseUrl}`;
      if (existingKeys.has(key)) {
        skipped.push(`${mapping.label} (already exists)`);
        continue;
      }

      await prisma.$executeRawUnsafe(
        `INSERT INTO "ai_provider_configs" ("id", "provider", "label", "baseUrl", "model", "apiKey", "priority", "enabled", "created_at", "updated_at")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, true, NOW(), NOW())`,
        mapping.provider, mapping.label, baseUrl, model, apiKey, nextPriority++
      );

      imported.push(mapping.label);
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      message: imported.length > 0
        ? `Imported ${imported.length} provider(s): ${imported.join(', ')}`
        : 'No new providers found in environment variables.',
    });
  } catch (error) {
    console.error('Failed to import env providers:', error);
    return NextResponse.json({ error: 'Failed to import providers' }, { status: 500 });
  }
}
