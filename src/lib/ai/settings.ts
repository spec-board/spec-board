// Shared AI settings store - used by both API routes and AI client

export interface AISettingsData {
  provider: string;
  openaiBaseUrl?: string;
  anthropicBaseUrl?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;
}

// In-memory storage (note: this resets on server restart)
// In production, use database or secure storage
const store: Record<string, AISettingsData> = {};

export function getAISettings(sessionId: string = 'default'): AISettingsData {
  return store[sessionId] || {
    provider: 'anthropic',
  };
}

export function setAISettings(settings: AISettingsData, sessionId: string = 'default') {
  store[sessionId] = { ...store[sessionId], ...settings };
}

export function clearAISettings(sessionId: string = 'default') {
  delete store[sessionId];
}
