import { NextRequest, NextResponse } from 'next/server';
import { driverManager } from '@/lib/drivers';

/**
 * POST /api/drivers/execute
 * Execute a command in a remote session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, command } = body;

    if (!sessionId || !command) {
      return NextResponse.json(
        { error: 'sessionId and command are required' },
        { status: 400 }
      );
    }

    // Get the session
    const session = driverManager.getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Get the config to determine driver type
    const config = await driverManager.getConfig(session.configId);
    if (!config) {
      return NextResponse.json(
        { error: 'Driver configuration not found' },
        { status: 404 }
      );
    }

    // Get the driver
    const driver = driverManager.getDriver(config.driverType as any);
    if (!driver) {
      return NextResponse.json(
        { error: 'Driver not available' },
        { status: 500 }
      );
    }

    // Execute the command
    const result = await driver.execute(session, command);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Failed to execute command:', error);
    return NextResponse.json(
      {
        error: 'Failed to execute command',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
