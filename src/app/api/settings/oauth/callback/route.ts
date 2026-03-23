import { NextResponse } from 'next/server';

// OAuth callback handler - receives the authorization code from the popup
// and posts it back to the parent window via postMessage
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  const html = `<!DOCTYPE html><html><body><script>
    window.opener.postMessage({
      type: 'oauth-callback',
      code: ${JSON.stringify(code)},
      state: ${JSON.stringify(state)},
      error: ${JSON.stringify(error)}
    }, window.location.origin);
    window.close();
  </script></body></html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
