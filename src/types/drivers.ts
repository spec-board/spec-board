// ============================================
// Remote Driver Types (Feature 010)
// ============================================

/** Supported driver types */
export type DriverType = 'e2b' | 'docker' | 'daytona';

/** Driver connection status */
export type SessionStatus = 'connecting' | 'active' | 'disconnected' | 'error';

/** File sync direction */
export type SyncDirection = 'upload' | 'download';

/** Driver configuration stored in database */
export interface DriverConfig {
  id: string;
  name: string;
  driverType: DriverType;
  settings: Record<string, unknown>;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Remote session metadata */
export interface RemoteSession {
  id: string;
  configId: string;
  status: SessionStatus;
  startedAt: Date;
  lastActivity: Date;
  metadata?: Record<string, unknown>;
}

/** File sync manifest entry */
export interface SyncManifest {
  id: string;
  sessionId: string;
  localPath: string;
  remotePath: string;
  checksum: string;
  syncedAt: Date;
  direction: SyncDirection;
}

/** Command execution result */
export interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
  error?: string;
}

/** Output chunk for streaming */
export interface OutputChunk {
  type: 'stdout' | 'stderr' | 'error' | 'complete';
  data: string;
  timestamp: Date;
}

/** File manifest for upload/download */
export interface FileManifest {
  files: Array<{
    path: string;
    content: string | Buffer;
    mode?: number;
  }>;
}

/** Resource usage metrics */
export interface ResourceMetrics {
  cpuPercent?: number;
  memoryMB?: number;
  diskMB?: number;
  elapsedSeconds: number;
}

/** E2B-specific settings */
export interface E2BSettings {
  apiKey: string;
  template?: string;
  timeoutSeconds?: number;
}

/** Docker-specific settings */
export interface DockerSettings {
  image: string;
  containerName?: string;
  volumes?: Record<string, string>;
  environment?: Record<string, string>;
}

/** Daytona-specific settings */
export interface DaytonaSettings {
  apiUrl: string;
  apiKey: string;
  workspaceId?: string;
}

/** Union type for all driver settings */
export type DriverSettings = E2BSettings | DockerSettings | DaytonaSettings;
