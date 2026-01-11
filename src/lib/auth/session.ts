/**
 * Session management utilities
 * Placeholder for Better Auth integration
 */

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
}

/**
 * Get the current session user from request
 * This is a placeholder that should be replaced with Better Auth integration
 */
export async function getSessionUser(request: NextRequest): Promise<SessionUser | null> {
  // TODO: Integrate with Better Auth
  // For now, check for a session cookie or header

  const sessionToken = request.cookies.get('session')?.value
    || request.headers.get('X-Session-Token');

  if (!sessionToken) {
    return null;
  }

  try {
    // Placeholder: In production, validate session with Better Auth
    // For development, we'll look up user by session token
    const user = await prisma.user.findFirst({
      where: {
        // This is a simplified lookup - Better Auth will handle this properly
        id: sessionToken,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<SessionUser> {
  const user = await getSessionUser(request);
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}
