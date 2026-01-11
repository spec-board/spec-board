import { NextRequest, NextResponse } from 'next/server';
import { driverManager } from '@/lib/drivers';

/**
 * POST /api/drivers/disconnect
 * Disconnect from a remote session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // Disconnect from the session
    await driverManager.disconnect(sessionId);

    return NextResponse.json({
      success: true,
      message: 'Session disconnected successfully',
    });
  } catch (error) {
    console.error('Failed to disconnect from session:', error);
    return NextResponse.json(
      {
        error: 'Failed to disconnect from session',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
