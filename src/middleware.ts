/**
 * Auth middleware for API routes (T021)
 * Protects cloud sync API routes with session validation
 * Includes rate limiting for sync endpoints (T083)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  checkRateLimit,
  getRequestIdentifier,
  getRateLimitHeaders,
} from '@/lib/rate-limit';

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

// Routes that should be rate limited
const RATE_LIMITED_ROUTES = [
  '/api/sync',
  '/api/cloud-projects',
  '/api/tokens',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if route requires authentication
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  const isRateLimitedRoute = RATE_LIMITED_ROUTES.some(route => pathname.startsWith(route));

  // Apply rate limiting to protected routes
  if (isRateLimitedRoute) {
    const identifier = getRequestIdentifier(request);
    const rateLimitResult = checkRateLimit(identifier, pathname);

    if (rateLimitResult.limited) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
            ...getRateLimitHeaders(identifier, pathname),
          },
        }
      );
    }
  }

  if (isProtectedRoute) {
    // Check for API token (used by MCP server)
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      // API token auth - let the route handler validate the token
      const response = NextResponse.next();

      // Add rate limit headers to response
      if (isRateLimitedRoute) {
        const identifier = getRequestIdentifier(request);
        const headers = getRateLimitHeaders(identifier, pathname);
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }

      return response;
    }

    // Check for session cookie (used by web app)
    const sessionCookie = request.cookies.get('better-auth.session_token');
    if (sessionCookie) {
      // Session auth - let Better Auth validate the session
      const response = NextResponse.next();

      // Add rate limit headers to response
      if (isRateLimitedRoute) {
        const identifier = getRequestIdentifier(request);
        const headers = getRateLimitHeaders(identifier, pathname);
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }

      return response;
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
