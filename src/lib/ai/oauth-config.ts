/**
 * OAuth provider configurations for AI providers
 * Supports Device Code flow (Qwen, Kimi) and PKCE Authorization Code flow (Codex)
 */

export interface OAuthProviderConfig {
  name: string;
  flow: 'device_code' | 'pkce';
  baseUrl?: string;
  // Device Code flow endpoints
  deviceAuthorizationUrl?: string;
  tokenUrl?: string;
  clientId?: string;
  // PKCE flow endpoints
  authorizeUrl?: string;
  scopes?: string[];
  audience?: string;
}

export const OAUTH_PROVIDERS: Record<string, OAuthProviderConfig> = {
  codex: {
    name: 'OpenAI Codex',
    flow: 'pkce',
    baseUrl: 'https://api.openai.com/v1',
    authorizeUrl: 'https://auth.openai.com/authorize',
    tokenUrl: 'https://auth.openai.com/oauth/token',
    clientId: 'app_EMoamEEZ73f0CkXaXp7hrann',
    scopes: ['openid', 'profile', 'email', 'offline_access'],
    audience: 'https://api.openai.com/v1',
  },
  qwen: {
    name: 'Qwen',
    flow: 'device_code',
    baseUrl: 'https://chat.qwen.ai/api/v1',
    deviceAuthorizationUrl: 'https://chat.qwen.ai/api/v1/auths/device/code',
    tokenUrl: 'https://chat.qwen.ai/api/v1/auths/device/token',
    clientId: 'qwen-cli',
  },
  kimi: {
    name: 'Kimi',
    flow: 'device_code',
    baseUrl: 'https://api.kimi.ai/v1',
    deviceAuthorizationUrl: 'https://auth.kimi.com/api/oauth/device_authorization',
    tokenUrl: 'https://auth.kimi.com/api/oauth/token',
    clientId: '17e5f671-d194-4dfb-9706-5516cb48c098',
  },
  iflow: {
    name: 'iFlow',
    flow: 'device_code',
    baseUrl: 'https://apis.iflow.cn/v1',
    deviceAuthorizationUrl: 'https://apis.iflow.cn/v1/auth/device/code',
    tokenUrl: 'https://apis.iflow.cn/v1/auth/device/token',
    clientId: 'iflow-cli',
  },
};

// PKCE helpers
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => chars[b % chars.length]).join('');
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
