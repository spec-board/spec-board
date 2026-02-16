import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import prisma from '@/lib/prisma';
import { isValidDirectoryPath, isSpecKitProject } from '@/lib/path-utils';

// Disable Next.js route caching
export const dynamic = 'force-dynamic';

/**
 * Generate a URL-safe slug from a name
 */
function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Find a unique slug by appending a number if needed
 */
async function findUniqueSlug(baseSlug: string): Promise<string> {
  const existing = await prisma.project.findUnique({
    where: { name: baseSlug },
  });

  if (!existing) {
    return baseSlug;
  }

  let counter = 2;
  while (counter < 100) {
    const candidateSlug = `${baseSlug}-${counter}`;
    const exists = await prisma.project.findUnique({
      where: { name: candidateSlug },
    });
    if (!exists) {
      return candidateSlug;
    }
    counter++;
  }

  return `${baseSlug}-${Date.now()}`;
}

/**
 * POST /api/projects/register
 *
 * Register a project. Supports two modes:
 * 1. Database-first (default): Only name/displayName required, no filesystem needed
 * 2. Legacy: filePath for migration from filesystem
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, displayName, description, filePath } = body;

    // Database-first mode: require at least name
    if (!name && !displayName && !filePath) {
      return NextResponse.json(
        { error: 'Either name/displayName (database-first) or filePath (legacy) is required' },
        { status: 400 }
      );
    }

    // If filePath is provided (legacy mode), validate it
    let isLegacyMode = false;
    if (filePath) {
      isLegacyMode = true;

      // Validate the path exists and is a directory
      if (!isValidDirectoryPath(filePath)) {
        return NextResponse.json(
          { error: 'Invalid file path: directory does not exist' },
          { status: 400 }
        );
      }

      // Check if it's a spec-kit project
      if (!isSpecKitProject(filePath)) {
        return NextResponse.json(
          { error: 'Not a spec-kit project: missing specs/ or .specify/ directory' },
          { status: 400 }
        );
      }

      // Check if project with this path already exists
      const existingProject = await prisma.project.findFirst({
        where: { filePath },
      });

      if (existingProject) {
        return NextResponse.json(existingProject);
      }
    }

    // Generate slug and display name
    const baseName = name || displayName || (filePath ? path.basename(filePath) : 'project');
    const baseSlug = generateSlugFromName(baseName);
    const slug = await findUniqueSlug(baseSlug);

    // Generate display name
    const finalDisplayName = displayName || (filePath
      ? path.basename(filePath).replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : baseName.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    );

    // Create new project (filePath is optional - null for database-first)
    const project = await prisma.project.create({
      data: {
        name: slug,
        displayName: finalDisplayName,
        description: description || null,
        filePath: isLegacyMode ? filePath : null, // Only set for legacy migration
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error registering project:', error);
    return NextResponse.json(
      { error: 'Failed to register project' },
      { status: 500 }
    );
  }
}
