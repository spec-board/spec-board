/**
 * OAuth provider configurations for AI providers
 * Supports PKCE Authorization Code flow (Codex)
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
  // OAuth providers removed - Codex CLI client_id only works with localhost:1455
  // To add OAuth providers in the future, register a custom OAuth app with the provider
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
