/**
 * API Token management endpoints
 * POST /api/tokens - Generate new API token
 * GET /api/tokens - List user's tokens
 * DELETE /api/tokens/[id] - Revoke a token
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

// Generate a secure random token
function generateToken(): string {
  return `sb_${randomBytes(32).toString('hex')}`;
}

// GET /api/tokens - List user's API tokens
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tokens = await prisma.apiToken.findMany({
      where: {
        userId: user.id,
        revokedAt: null,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        expiresAt: true,
        lastUsedAt: true,
        // Don't return the actual token value for security
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tokens);
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tokens' },
      { status: 500 }
    );
  }
}

// POST /api/tokens - Generate new API token
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, expiresInDays } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Token name is required' },
        { status: 400 }
      );
    }

    // Calculate expiration date if specified
    let expiresAt: Date | null = null;
    if (expiresInDays && typeof expiresInDays === 'number') {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // Generate token
    const token = generateToken();

    // Save to database
    const apiToken = await prisma.apiToken.create({
      data: {
        userId: user.id,
        name,
        token,
        expiresAt,
      },
    });

    // Return the token value only once (on creation)
    return NextResponse.json({
      id: apiToken.id,
      name: apiToken.name,
      token: apiToken.token, // Only returned on creation!
      expiresAt: apiToken.expiresAt,
      createdAt: apiToken.createdAt,
      message: 'Save this token securely. It will not be shown again.',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating token:', error);
    return NextResponse.json(
      { error: 'Failed to create token' },
      { status: 500 }
    );
  }
}
