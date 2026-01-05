import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Disable caching for health checks
export const dynamic = 'force-dynamic';

// GET /api/health - Health check endpoint for Docker/load balancers
export async function GET() {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Database connection failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
