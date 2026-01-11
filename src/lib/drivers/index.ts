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

// Keychain utilities
export {
  storeCredentials,
  getCredentials,
  deleteCredentials,
  hasCredentials,
  updateCredentials,
} from './keychain';
