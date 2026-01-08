/**
 * Auth middleware for API routes (T021)
 * Protects cloud sync API routes with session validation
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/api/cloud-projects',
  '/api/sync',
  '/api/tokens',
];

// Routes that are always public
const PUBLIC_ROUTES = [
  '/api/auth',
  '/api/health',
  '/api/project',
  '/api/projects',
  '/api/browse',
  '/api/watch',
  '/api/checklist',
  '/api/analysis',
  '/api/app-info',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if route requires authentication
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    // Check for API token (used by MCP server)
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      // API token auth - let the route handler validate the token
      return NextResponse.next();
    }

    // Check for session cookie (used by web app)
    const sessionCookie = request.cookies.get('better-auth.session_token');
    if (sessionCookie) {
      // Session auth - let Better Auth validate the session
      return NextResponse.next();
    }

    // No authentication found
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all API routes except static files
    '/api/:path*',
  ],
};
