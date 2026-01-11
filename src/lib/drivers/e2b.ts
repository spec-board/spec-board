import { Sandbox } from '@e2b/code-interpreter';
import type {
  DriverConfig,
  ExecutionResult,
  OutputChunk,
  FileManifest,
  ResourceMetrics,
  E2BSettings,
} from '@/types/drivers';
import type { IRemoteSession } from './types';
import { BaseDriver } from './base';
import { getCredentials } from './keychain';
import prisma from '@/lib/prisma';

/**
 * E2B Driver Implementation
 * Provides cloud-based sandboxed execution using E2B Code Interpreter.
 */
export class E2BDriver extends BaseDriver {
  /**
   * Connect to E2B sandbox
   */
  async connect(config: DriverConfig): Promise<IRemoteSession> {
    const settings = config.settings as unknown as E2BSettings;

    // Get API key from keychain
    const credentials = await getCredentials(config.id);
    if (!credentials?.apiKey) {
      throw new Error('E2B API key not found in keychain');
    }

    // Create E2B sandbox
    const sandbox = await Sandbox.create(settings.template || 'base', {
      apiKey: credentials.apiKey,
      timeoutMs: (settings.timeoutSeconds || 300) * 1000,
    });

    // Create session in database
    const session = await prisma.remoteSession.create({
      data: {
        configId: config.id,
        status: 'active' as const,
        metadata: {
          sandboxId: sandbox.sandboxId,
          template: settings.template,
        },
      },
    });

    const remoteSession: IRemoteSession = {
      id: session.id,
      configId: session.configId,
      status: session.status as any,
      startedAt: session.startedAt,
      lastActivity: session.lastActivity,
      metadata: session.metadata as Record<string, unknown> | undefined,
      driverType: 'e2b',
      internalHandle: sandbox,
    };

    this.registerSession(remoteSession);
    return remoteSession;
  }

  /**
   * Disconnect from E2B sandbox
   */
  async disconnect(session: IRemoteSession): Promise<void> {
    const sandbox = session.internalHandle as Sandbox;

    if (sandbox) {
      await sandbox.kill();
    }

    // Update session status in database
    await prisma.remoteSession.update({
      where: { id: session.id },
      data: { status: 'disconnected' },
    });

    this.unregisterSession(session.id);
  }

  /**
   * Execute command in E2B sandbox
   */
  async execute(session: IRemoteSession, command: string): Promise<ExecutionResult> {
    const sandbox = session.internalHandle as Sandbox;
    if (!sandbox) {
      throw new Error('Sandbox not initialized');
    }

    const startTime = Date.now();

    try {
      // Execute command using E2B's commands API
      const result = await sandbox.commands.run(command);

      const duration = Date.now() - startTime;

      return {
        success: result.exitCode === 0,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        duration,
        error: result.exitCode !== 0 ? result.stderr : undefined,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error),
        exitCode: 1,
        duration,
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      // Update last activity
      await prisma.remoteSession.update({
        where: { id: session.id },
        data: { lastActivity: new Date() },
      });
    }
  }

  /**
   * Stream output from E2B execution
   * Note: E2B Code Interpreter doesn't support real-time streaming,
   * so we execute and return results as a single chunk
   */
  async *streamOutput(session: IRemoteSession): AsyncIterable<OutputChunk> {
    // E2B Code Interpreter executes cells atomically
    // For streaming support, we would need to use E2B's lower-level sandbox API
    // For now, this is a placeholder that yields completion
    yield {
      type: 'complete',
      data: 'Execution complete',
      timestamp: new Date(),
    };
  }

  /**
   * Cancel running execution
   */
  async cancel(session: IRemoteSession): Promise<void> {
    // E2B Code Interpreter doesn't support cancellation mid-execution
    // The best we can do is close the sandbox
    await this.disconnect(session);
  }

  /**
   * Upload files to E2B sandbox
   */
  async uploadFiles(session: IRemoteSession, files: FileManifest): Promise<void> {
    const sandbox = session.internalHandle as Sandbox;
    if (!sandbox) {
      throw new Error('Sandbox not initialized');
    }

    // Upload each file
    for (const file of files.files) {
      const content = typeof file.content === 'string'
        ? file.content
        : file.content.toString('utf-8');

      await sandbox.files.write(file.path, content);
    }

    // Update last activity
    await prisma.remoteSession.update({
      where: { id: session.id },
      data: { lastActivity: new Date() },
    });
  }

  /**
   * Download files from E2B sandbox
   */
  async downloadFiles(session: IRemoteSession, paths: string[]): Promise<FileManifest> {
    const sandbox = session.internalHandle as Sandbox;
    if (!sandbox) {
      throw new Error('Sandbox not initialized');
    }

    const files: FileManifest['files'] = [];

    // Download each file
    for (const path of paths) {
      try {
        const content = await sandbox.files.read(path);
        files.push({
          path,
          content,
        });
      } catch (error) {
        console.error(`Failed to download file ${path}:`, error);
        // Continue with other files
      }
    }

    // Update last activity
    await prisma.remoteSession.update({
      where: { id: session.id },
      data: { lastActivity: new Date() },
    });

    return { files };
  }

  /**
   * Get resource metrics from E2B sandbox
   */
  async getResourceMetrics(session: IRemoteSession): Promise<ResourceMetrics> {
    // E2B doesn't expose resource metrics via the Code Interpreter API
    // Return basic elapsed time
    const elapsedSeconds = Math.floor(
      (Date.now() - session.startedAt.getTime()) / 1000
    );

    return {
      elapsedSeconds,
    };
  }
}
