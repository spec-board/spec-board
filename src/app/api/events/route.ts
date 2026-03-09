// SSE endpoint - DISABLED
// Real-time updates removed. User manually refreshes (F5) after job completes.

export const dynamic = 'force-dynamic';

export async function GET() {
  return new Response('SSE disabled - please refresh manually after job completes', {
    status: 410,
    headers: {
      'Content-Type': 'text/plain',
    }
  });
}
