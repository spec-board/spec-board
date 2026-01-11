import * as keytar from 'keytar';

/**
 * Keychain integration for secure credential storage.
 * Uses OS-level keychain (macOS Keychain, Windows Credential Vault, Linux Secret Service).
 *
 * SECURITY: Credentials are NEVER stored in the database or logs.
 */

const SERVICE_NAME = 'spec-board-drivers';

/**
 * Store credentials in OS keychain
 */
export async function storeCredentials(
  configId: string,
  credentials: Record<string, string>
): Promise<void> {
  const account = `driver-${configId}`;
  const credentialsJson = JSON.stringify(credentials);

  await keytar.setPassword(SERVICE_NAME, account, credentialsJson);
}

/**
 * Retrieve credentials from OS keychain
 */
export async function getCredentials(
  configId: string
): Promise<Record<string, string> | null> {
  const account = `driver-${configId}`;
  const credentialsJson = await keytar.getPassword(SERVICE_NAME, account);

  if (!credentialsJson) {
    return null;
  }

  try {
    return JSON.parse(credentialsJson);
  } catch (error) {
    console.error('Failed to parse credentials from keychain:', error);
    return null;
  }
}

/**
 * Delete credentials from OS keychain
 */
export async function deleteCredentials(configId: string): Promise<boolean> {
  const account = `driver-${configId}`;
  return await keytar.deletePassword(SERVICE_NAME, account);
}

/**
 * Check if credentials exist in keychain
 */
export async function hasCredentials(configId: string): Promise<boolean> {
  const credentials = await getCredentials(configId);
  return credentials !== null;
}

/**
 * Update specific credential fields without replacing all
 */
export async function updateCredentials(
  configId: string,
  updates: Record<string, string>
): Promise<void> {
  const existing = await getCredentials(configId) || {};
  const merged = { ...existing, ...updates };
  await storeCredentials(configId, merged);
}
