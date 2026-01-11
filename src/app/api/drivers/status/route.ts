import { NextRequest } from 'next/server';
import { driverManager } from '@/lib/drivers';

/**
 * GET /api/drivers/status?sessionId=xxx
 * Stream session status updates using Server-Sent Events (SSE)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return new Response('sessionId is required', { status: 400 });
  }

  // Get the session
  const session = driverManager.getSession(sessionId);
  if (!session) {
    return new Response('Session not found', { status: 404 });
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Get the config to determine driver type
        const config = await driverManager.getConfig(session.configId);
        if (!config) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'Driver configuration not found' })}\n\n`)
          );
          controller.close();
          return;
        }

        // Get the driver
        const driver = driverManager.getDriver(config.driverType as any);
        if (!driver) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'Driver not available' })}\n\n`)
          );
          controller.close();
          return;
        }

        // Send initial status
        const status = await driver.getStatus(session);
        const metrics = await driver.getResourceMetrics(session);

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'status',
              status,
              metrics,
              timestamp: new Date().toISOString(),
            })}\n\n`
          )
        );

        // Poll for status updates every 2 seconds
        const interval = setInterval(async () => {
          try {
            const currentStatus = await driver.getStatus(session);
            const currentMetrics = await driver.getResourceMetrics(session);

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'status',
                  status: currentStatus,
                  metrics: currentMetrics,
                  timestamp: new Date().toISOString(),
                })}\n\n`
              )
            );

            // Close stream if session is disconnected
            if (currentStatus === 'disconnected' || currentStatus === 'error') {
              clearInterval(interval);
              controller.close();
            }
          } catch (error) {
            console.error('Error polling status:', error);
            clearInterval(interval);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'error',
                  error: error instanceof Error ? error.message : String(error),
                })}\n\n`
              )
            );
            controller.close();
          }
        }, 2000);

        // Cleanup on client disconnect
        request.signal.addEventListener('abort', () => {
          clearInterval(interval);
          controller.close();
        });
      } catch (error) {
        console.error('Error in status stream:', error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'error',
              error: error instanceof Error ? error.message : String(error),
            })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
