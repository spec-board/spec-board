/**
 * Keychain integration for credential storage.
 * Uses environment variables instead of OS keychain.
 *
 * SECURITY: Credentials are stored in environment variables, never in database.
 *
 * Available environment variables:
 * - E2B_API_KEY: E2B sandbox API key
 */

const SERVICE_NAME = 'spec-board-drivers';

/**
 * Store credentials in environment variable
 * Note: Actual storage is handled by OS environment
 */
export async function storeCredentials(
  _configId: string,
  _credentials: Record<string, string>
): Promise<void> {
  console.warn('[Keychain] Use environment variables instead: E2B_API_KEY');
}

/**
 * Retrieve credentials from environment variables
 */
export function getCredentials(
  configId: string
): Record<string, string> | null {
  if (configId === 'e2b') {
    const apiKey = process.env.E2B_API_KEY;
    if (apiKey) {
      return { apiKey };
    }
  }
  return null;
}

export async function getCredentialsAsync(
  configId: string
): Promise<Record<string, string> | null> {
  return getCredentials(configId);
}

/**
 * Delete credentials - N/A for env vars
 */
export async function deleteCredentials(_configId: string): Promise<boolean> {
  console.warn('[Keychain] Cannot delete env vars at runtime');
  return false;
}

/**
 * Check if credentials exist
 */
export function hasCredentials(configId: string): boolean {
  if (configId === 'e2b') {
    return !!process.env.E2B_API_KEY;
  }
  return false;
}

export async function hasCredentialsAsync(configId: string): Promise<boolean> {
  return hasCredentials(configId);
}

/**
 * Update credentials - N/A for env vars
 */
export async function updateCredentials(
  _configId: string,
  _updates: Record<string, string>
): Promise<void> {
  console.warn('[Keychain] Cannot update env vars at runtime');
}
