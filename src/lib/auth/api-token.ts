/**
 * API Token validation for MCP server authentication
 */

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export interface TokenValidationResult {
  valid: boolean;
  userId?: string;
  error?: string;
}

export async function validateApiToken(request: NextRequest): Promise<TokenValidationResult> {
  // Extract token from Authorization header
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return { valid: false, error: 'Missing Authorization header' };
  }

  if (!authHeader.startsWith('Bearer ')) {
    return { valid: false, error: 'Invalid Authorization format. Use: Bearer <token>' };
  }

  const token = authHeader.slice(7); // Remove 'Bearer ' prefix

  if (!token) {
    return { valid: false, error: 'Empty token' };
  }

  try {
    // Look up token in database
    const apiToken = await prisma.apiToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!apiToken) {
      return { valid: false, error: 'Invalid token' };
    }

    // Check if token is expired
    if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
      return { valid: false, error: 'Token expired' };
    }

    // Check if token is revoked
    if (apiToken.revokedAt) {
      return { valid: false, error: 'Token revoked' };
    }

    // Update last used timestamp
    await prisma.apiToken.update({
      where: { id: apiToken.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      valid: true,
      userId: apiToken.userId,
    };
  } catch (error) {
    console.error('Token validation error:', error);
    return { valid: false, error: 'Token validation failed' };
  }
}
