import type {
  DriverConfig,
  RemoteSession,
  ExecutionResult,
  OutputChunk,
  FileManifest,
  ResourceMetrics,
  SessionStatus,
} from '@/types/drivers';

/**
 * Core interface that all remote drivers must implement.
 * Provides lifecycle management, command execution, and file operations.
 */
export interface IRemoteDriver {
  // Lifecycle management
  connect(config: DriverConfig): Promise<IRemoteSession>;
  disconnect(session: IRemoteSession): Promise<void>;

  // Command execution
  execute(session: IRemoteSession, command: string): Promise<ExecutionResult>;
  streamOutput(session: IRemoteSession): AsyncIterable<OutputChunk>;
  cancel(session: IRemoteSession): Promise<void>;

  // File operations
  uploadFiles(session: IRemoteSession, files: FileManifest): Promise<void>;
  downloadFiles(session: IRemoteSession, paths: string[]): Promise<FileManifest>;

  // Status and monitoring
  getStatus(session: IRemoteSession): Promise<SessionStatus>;
  getResourceMetrics(session: IRemoteSession): Promise<ResourceMetrics>;
}

/**
 * Extended session interface with driver-specific metadata
 */
export interface IRemoteSession extends RemoteSession {
  driverType: string;
  internalHandle?: unknown; // Driver-specific session handle
}

/**
 * Driver configuration interface
 */
export interface IDriverConfig extends DriverConfig {
  // Additional runtime configuration
  validateSettings(): Promise<boolean>;
  getCredentials(): Promise<Record<string, string>>;
}
