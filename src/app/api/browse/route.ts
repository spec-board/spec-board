import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/browse
 *
 * Database-first: Returns list of all projects from database.
 * Replaces filesystem-based directory browsing.
 */
export async function GET(request: NextRequest) {
  try {
    // Get all projects from database
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        displayName: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            features: true,
          },
        },
      },
    });

    // Transform to response format
    const entries = projects.map((project) => ({
      name: project.displayName || project.name,
      path: '', // No filesystem path in database-first
      isDirectory: true,
      isSpecKitProject: true, // All DB projects are spec-kit projects
      projectId: project.id,
      featureCount: project._count.features,
      lastUpdated: project.updatedAt,
    }));

    return NextResponse.json({
      currentPath: '/',
      parentPath: null,
      entries,
      isSpecKitProject: false,
      source: 'database', // Indicate this is database-first
    });
  } catch (error) {
    console.error('Error browsing projects:', error);
    return NextResponse.json(
      { error: 'Failed to browse projects' },
      { status: 500 }
    );
  }
}
