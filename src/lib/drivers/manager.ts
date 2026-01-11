import type { DriverConfig, DriverType } from '@/types/drivers';
import type { IRemoteDriver, IRemoteSession } from './types';
import { BaseDriver } from './base';
import { E2BDriver } from './e2b';
import prisma from '@/lib/prisma';

/**
 * Driver Manager Singleton
 * Manages driver registry, active sessions, and configuration store.
 */
class DriverManager {
  private static instance: DriverManager;
  private drivers: Map<DriverType, IRemoteDriver> = new Map();
  private activeSessions: Map<string, IRemoteSession> = new Map();

  private constructor() {
    // Register available drivers
    this.registerDriver('e2b', new E2BDriver());
    // Future: Register Docker and Daytona drivers
    // this.registerDriver('docker', new DockerDriver());
    // this.registerDriver('daytona', new DaytonaDriver());
  }

  /**
   * Get singleton instance
   */
  static getInstance(): DriverManager {
    if (!DriverManager.instance) {
      DriverManager.instance = new DriverManager();
    }
    return DriverManager.instance;
  }

  /**
   * Register a driver implementation
   */
  private registerDriver(type: DriverType, driver: IRemoteDriver): void {
    this.drivers.set(type, driver);
  }

  /**
   * Get driver by type
   */
  getDriver(type: DriverType): IRemoteDriver | undefined {
    return this.drivers.get(type);
  }

  /**
   * Get all registered driver types
   */
  getAvailableDriverTypes(): DriverType[] {
    return Array.from(this.drivers.keys());
  }

  /**
   * Create a new driver configuration
   */
  async createConfig(
    name: string,
    driverType: DriverType,
    settings: Record<string, unknown>,
    isDefault = false
  ): Promise<DriverConfig> {
    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.driverConfig.updateMany({
        where: { driverType, isDefault: true },
        data: { isDefault: false },
      });
    }

    const config = await prisma.driverConfig.create({
      data: {
        name,
        driverType,
        settings: settings as any,
        isDefault,
      },
    });

    return config as DriverConfig;
  }

  /**
   * Get driver configuration by ID
   */
  async getConfig(id: string): Promise<DriverConfig | null> {
    const config = await prisma.driverConfig.findUnique({
      where: { id },
    });
    return config as DriverConfig | null;
  }

  /**
   * Get all driver configurations
   */
  async getAllConfigs(): Promise<DriverConfig[]> {
    const configs = await prisma.driverConfig.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return configs as DriverConfig[];
  }

  /**
   * Get default configuration for a driver type
   */
  async getDefaultConfig(driverType: DriverType): Promise<DriverConfig | null> {
    const config = await prisma.driverConfig.findFirst({
      where: { driverType, isDefault: true },
    });
    return config as DriverConfig | null;
  }

  /**
   * Update driver configuration
   */
  async updateConfig(
    id: string,
    updates: Partial<Pick<DriverConfig, 'name' | 'settings' | 'isDefault'>>
  ): Promise<DriverConfig> {
    // If setting as default, unset other defaults
    if (updates.isDefault) {
      const config = await this.getConfig(id);
      if (config) {
        await prisma.driverConfig.updateMany({
          where: { driverType: config.driverType, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }
    }

    const config = await prisma.driverConfig.update({
      where: { id },
      data: {
        ...updates,
        settings: updates.settings as any,
      },
    });

    return config as DriverConfig;
  }

  /**
   * Delete driver configuration
   */
  async deleteConfig(id: string): Promise<void> {
    await prisma.driverConfig.delete({
      where: { id },
    });
  }

  /**
   * Connect to a remote environment using a configuration
   */
  async connect(configId: string): Promise<IRemoteSession> {
    const config = await this.getConfig(configId);
    if (!config) {
      throw new Error(`Driver configuration not found: ${configId}`);
    }

    const driver = this.getDriver(config.driverType as DriverType);
    if (!driver) {
      throw new Error(`Driver not available: ${config.driverType}`);
    }

    const session = await driver.connect(config);
    this.activeSessions.set(session.id, session);

    return session;
  }

  /**
   * Disconnect from a remote session
   */
  async disconnect(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const config = await this.getConfig(session.configId);
    if (!config) {
      throw new Error(`Driver configuration not found: ${session.configId}`);
    }

    const driver = this.getDriver(config.driverType as DriverType);
    if (!driver) {
      throw new Error(`Driver not available: ${config.driverType}`);
    }

    await driver.disconnect(session);
    this.activeSessions.delete(sessionId);
  }

  /**
   * Get active session by ID
   */
  getSession(sessionId: string): IRemoteSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Get all active sessions
   */
  getAllSessions(): IRemoteSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Cleanup all active sessions (useful for shutdown)
   */
  async cleanup(): Promise<void> {
    const sessions = this.getAllSessions();
    await Promise.all(
      sessions.map(session =>
        this.disconnect(session.id).catch(err => {
          console.error(`Failed to disconnect session ${session.id}:`, err);
        })
      )
    );
  }
}

// Export singleton instance
export const driverManager = DriverManager.getInstance();
