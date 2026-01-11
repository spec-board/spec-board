import type {
  DriverConfig,
  ExecutionResult,
  OutputChunk,
  FileManifest,
  ResourceMetrics,
  SessionStatus,
} from '@/types/drivers';
import type { IRemoteDriver, IRemoteSession } from './types';

/**
 * Base class for all remote drivers.
 * Provides common functionality and enforces the driver interface.
 */
export abstract class BaseDriver implements IRemoteDriver {
  protected activeSessions: Map<string, IRemoteSession> = new Map();

  // Abstract methods that must be implemented by concrete drivers
  abstract connect(config: DriverConfig): Promise<IRemoteSession>;
  abstract disconnect(session: IRemoteSession): Promise<void>;
  abstract execute(session: IRemoteSession, command: string): Promise<ExecutionResult>;
  abstract streamOutput(session: IRemoteSession): AsyncIterable<OutputChunk>;
  abstract cancel(session: IRemoteSession): Promise<void>;
  abstract uploadFiles(session: IRemoteSession, files: FileManifest): Promise<void>;
  abstract downloadFiles(session: IRemoteSession, paths: string[]): Promise<FileManifest>;

  /**
   * Get current session status
   */
  async getStatus(session: IRemoteSession): Promise<SessionStatus> {
    const activeSession = this.activeSessions.get(session.id);
    if (!activeSession) {
      return 'disconnected';
    }
    return activeSession.status;
  }

  /**
   * Get resource usage metrics
   * Default implementation returns basic elapsed time
   */
  async getResourceMetrics(session: IRemoteSession): Promise<ResourceMetrics> {
    const elapsedSeconds = Math.floor(
      (Date.now() - session.startedAt.getTime()) / 1000
    );

    return {
      elapsedSeconds,
    };
  }

  /**
   * Register an active session
   */
  protected registerSession(session: IRemoteSession): void {
    this.activeSessions.set(session.id, session);
  }

  /**
   * Unregister a session
   */
  protected unregisterSession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
  }

  /**
   * Update session status
   */
  protected updateSessionStatus(sessionId: string, status: SessionStatus): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = status;
      session.lastActivity = new Date();
    }
  }

  /**
   * Get all active sessions for this driver
   */
  getActiveSessions(): IRemoteSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Cleanup all active sessions (useful for shutdown)
   */
  async cleanup(): Promise<void> {
    const sessions = this.getActiveSessions();
    await Promise.all(
      sessions.map(session => this.disconnect(session).catch(err => {
        console.error(`Failed to disconnect session ${session.id}:`, err);
      }))
    );
  }
}
