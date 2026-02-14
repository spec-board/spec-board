/**
 * Keychain integration for secure credential storage.
 * Uses OS-level keychain (macOS Keychain, Windows Credential Vault, Linux Secret Service).
 *
 * SECURITY: Credentials are NEVER stored in the database or logs.
 *
 * Note: This is a STUB implementation. Full keychain support requires native keytar module.
 * In production, you would install keytar and use it here.
 */

const SERVICE_NAME = 'spec-board-drivers';

/**
 * Store credentials in OS keychain
 * STUB: Returns without doing anything
 */
export async function storeCredentials(
  _configId: string,
  _credentials: Record<string, string>
): Promise<void> {
  console.warn('[Keychain] Not available - credentials not stored');
}

/**
 * Retrieve credentials from OS keychain
 * STUB: Always returns null
 */
export async function getCredentials(
  _configId: string
): Promise<Record<string, string> | null> {
  return null;
}

/**
 * Delete credentials from OS keychain
 * STUB: Always returns false
 */
export async function deleteCredentials(_configId: string): Promise<boolean> {
  return false;
}

/**
 * Check if credentials exist in keychain
 * STUB: Always returns false
 */
export async function hasCredentials(_configId: string): Promise<boolean> {
  return false;
}

/**
 * Update specific credential fields without replacing all
 * STUB: Does nothing
 */
export async function updateCredentials(
  _configId: string,
  _updates: Record<string, string>
): Promise<void> {
  console.warn('[Keychain] Not available - credentials not updated');
}
