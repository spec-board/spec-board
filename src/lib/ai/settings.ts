// Settings - stored in database via Prisma
import { prisma } from '@/lib/prisma';

const SETTINGS_KEY = 'app-settings';

// General App Settings
export interface AppSettingsData {
  theme: 'light' | 'dark' | 'system';
  shortcutsEnabled: boolean;
}

// AI Settings - OpenAI-Compatible API only
export interface AISettingsData {
  provider: string;
  baseUrl?: string;        // OpenAI-compatible base URL (e.g., Ollama, LM Studio, LocalAI)
  apiKey?: string;         // API key for the provider
  model?: string;          // Model name to use
}

// Cache for app settings
let cachedAppSettings: AppSettingsData | null = null;
let appSettingsCacheInitialized = false;

// In-memory cache for sync access (initialized on first request)
let cachedSettings: AISettingsData | null = null;
let cacheInitialized = false;

async function getOrCreateSettings() {
  let settings = await prisma.appSettings.findUnique({
    where: { key: SETTINGS_KEY }
  });

  if (!settings) {
    settings = await prisma.appSettings.create({
      data: { key: SETTINGS_KEY }
    });
  }

  return settings;
}

export async function getAISettings(): Promise<AISettingsData> {
  const settings = await getOrCreateSettings();

  const result = {
    provider: settings.aiProvider || 'openai',
    baseUrl: settings.openaiBaseUrl || undefined,
    apiKey: settings.openaiApiKey || undefined,
    model: settings.openaiModel || undefined,
  };

  // Update cache
  cachedSettings = result;
  cacheInitialized = true;

  return result;
}

// Sync version for use in sync contexts (uses cache after initial load)
export function getAISettingsSync(): AISettingsData {
  if (cacheInitialized && cachedSettings) {
    return cachedSettings;
  }

  // Return default if not yet initialized (will be updated on next async call)
  return {
    provider: 'openai',
  };
}

export async function setAISettings(settingsData: Partial<AISettingsData>): Promise<AISettingsData> {
  const settings = await getOrCreateSettings();

  const updateData: any = {};
  if (settingsData.provider !== undefined) updateData.aiProvider = settingsData.provider;
  if (settingsData.baseUrl !== undefined) updateData.openaiBaseUrl = settingsData.baseUrl;
  if (settingsData.apiKey !== undefined) updateData.openaiApiKey = settingsData.apiKey;
  if (settingsData.model !== undefined) updateData.openaiModel = settingsData.model;

  await prisma.appSettings.update({
    where: { id: settings.id },
    data: updateData
  });

  // Update cache
  cachedSettings = { ...cachedSettings, ...settingsData } as AISettingsData;

  return getAISettings();
}

export async function clearAISettings(): Promise<void> {
  const settings = await getOrCreateSettings();

  await prisma.appSettings.update({
    where: { id: settings.id },
    data: {
      openaiApiKey: null,
    }
  });

  // Update cache
  if (cachedSettings) {
    cachedSettings.apiKey = undefined;
  }
}

// =========================================
// General App Settings (theme, shortcuts)
// =========================================

export async function getAppSettings(): Promise<AppSettingsData> {
  const settings = await getOrCreateSettings();

  const result: AppSettingsData = {
    theme: settings.theme as 'light' | 'dark' | 'system',
    shortcutsEnabled: settings.shortcutsEnabled,
  };

  // Update cache
  cachedAppSettings = result;
  appSettingsCacheInitialized = true;

  return result;
}

// Sync version for use in sync contexts
export function getAppSettingsSync(): AppSettingsData {
  if (appSettingsCacheInitialized && cachedAppSettings) {
    return cachedAppSettings;
  }

  // Return default if not yet initialized
  return {
    theme: 'dark',
    shortcutsEnabled: true,
  };
}

export async function setAppSettings(settingsData: Partial<AppSettingsData>): Promise<AppSettingsData> {
  const settings = await getOrCreateSettings();

  const updateData: any = {};
  if (settingsData.theme !== undefined) updateData.theme = settingsData.theme;
  if (settingsData.shortcutsEnabled !== undefined) updateData.shortcutsEnabled = settingsData.shortcutsEnabled;

  await prisma.appSettings.update({
    where: { id: settings.id },
    data: updateData
  });

  // Update cache
  cachedAppSettings = { ...cachedAppSettings, ...settingsData } as AppSettingsData;

  return getAppSettings();
}
