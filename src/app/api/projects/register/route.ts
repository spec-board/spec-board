import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import prisma from '@/lib/prisma';
import { isValidDirectoryPath, isSpecKitProject } from '@/lib/path-utils';

// Disable Next.js route caching
export const dynamic = 'force-dynamic';

/**
 * Generate a URL-safe slug from a path
 * e.g., "/Users/paul/Projects/my-todolist" -> "my-todolist"
 */
function generateSlugFromPath(filePath: string): string {
  const baseName = path.basename(filePath);
  // Convert to lowercase, replace spaces and underscores with hyphens
  // Remove any characters that aren't alphanumeric or hyphens
  return baseName
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
  // First try the base slug
  const existing = await prisma.project.findUnique({
    where: { name: baseSlug },
  });

  if (!existing) {
    return baseSlug;
  }

  // Try with incrementing numbers
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

  // Fallback: use timestamp
  return `${baseSlug}-${Date.now()}`;
}

/**
 * POST /api/projects/register
 * Auto-register a project from a filesystem path
 * Returns existing project if path already registered, or creates new one
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filePath } = body;

    if (!filePath) {
      return NextResponse.json(
        { error: 'Missing required field: filePath' },
        { status: 400 }
      );
    }

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
      // Return existing project
      return NextResponse.json(existingProject);
    }

    // Generate slug from path
    const baseSlug = generateSlugFromPath(filePath);
    const slug = await findUniqueSlug(baseSlug || 'project');

    // Generate display name from folder name
    const displayName = path.basename(filePath)
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    // Create new project
    const project = await prisma.project.create({
      data: {
        name: slug,
        displayName,
        filePath,
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
