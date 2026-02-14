/**
 * Remote Driver Module
 * Provides unified interface for executing spec-kit operations in isolated remote environments.
 */

// Core types and interfaces
export type {
  DriverType,
  DriverConfig,
  RemoteSession,
  SyncManifest,
  ExecutionResult,
  OutputChunk,
  FileManifest,
  ResourceMetrics,
  SessionStatus,
  SyncDirection,
  E2BSettings,
  DockerSettings,
  DaytonaSettings,
  DriverSettings,
} from '@/types/drivers';

export type {
  IRemoteDriver,
  IRemoteSession,
  IDriverConfig,
} from './types';

// Driver implementations
export { BaseDriver } from './base';
export { E2BDriver } from './e2b';

// Driver manager singleton
export { driverManager } from './manager';

/**
 * Keychain utilities - STUB IMPLEMENTATION
 * Note: Full keychain support requires native keytar module which may not be available.
 * These functions are stubs that return safe defaults.
 */

export async function storeCredentials(
  _configId: string,
  _credentials: Record<string, string>
): Promise<void> {
  console.warn('Keychain not available - credentials not stored');
}

export async function getCredentials(
  _configId: string
): Promise<Record<string, string> | null> {
  return null;
}

export async function deleteCredentials(_configId: string): Promise<boolean> {
  return false;
}

export async function hasCredentials(_configId: string): Promise<boolean> {
  return false;
}

export async function updateCredentials(
  _configId: string,
  _updates: Record<string, string>
): Promise<void> {
  console.warn('Keychain not available - credentials not updated');
}
