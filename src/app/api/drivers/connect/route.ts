import { NextRequest, NextResponse } from 'next/server';
import { driverManager } from '@/lib/drivers';

/**
 * POST /api/drivers/connect
 * Establish a connection to a remote driver
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { configId } = body;

    if (!configId) {
      return NextResponse.json(
        { error: 'configId is required' },
        { status: 400 }
      );
    }

    // Connect to the driver
    const session = await driverManager.connect(configId);

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        configId: session.configId,
        status: session.status,
        startedAt: session.startedAt,
        driverType: session.driverType,
      },
    });
  } catch (error) {
    console.error('Failed to connect to driver:', error);
    return NextResponse.json(
      {
        error: 'Failed to connect to driver',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
