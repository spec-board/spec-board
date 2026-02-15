import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isPrismaError } from '@/lib/utils';

// Disable Next.js route caching - always read fresh data from database
export const dynamic = 'force-dynamic';

// GET /api/projects - List all projects
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
// Supports both filesystem-based and database-first projects
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, displayName, filePath, description } = body;

    // name is always required
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    // Generate slug from name if displayName not provided
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    if (!slug) {
      return NextResponse.json(
        { error: 'Invalid name - must contain alphanumeric characters' },
        { status: 400 }
      );
    }

    // Check if project already exists
    const existing = await prisma.project.findUnique({
      where: { name: slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A project with this name already exists' },
        { status: 409 }
      );
    }

    // Create project - filePath is optional for database-first projects
    const project = await prisma.project.create({
      data: {
        name: slug,
        displayName: displayName || name,
        description: description || null,
        filePath: filePath || null, // null for database-first projects
        isCloud: false,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating project:', error);

    // Handle unique constraint violation
    if (isPrismaError(error, 'P2002')) {
      return NextResponse.json(
        { error: 'A project with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
