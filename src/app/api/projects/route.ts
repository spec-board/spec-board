import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isPrismaError } from '@/lib/utils';
import { generateConstitution, getProvider, getAISettings } from '@/lib/ai';

// Disable Next.js route caching - always read fresh data from database
export const dynamic = 'force-dynamic';

// GET /api/projects - List all projects
export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { features: true },
        },
      },
    });

    // Transform to include feature count
    const transformed = projects.map(p => ({
      id: p.id,
      name: p.name,
      displayName: p.displayName,
      description: p.description,
      filePath: p.filePath,
      isCloud: p.isCloud,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      featureCount: p._count.features,
    }));

    return NextResponse.json(transformed);
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
    const { name, displayName, filePath, description, generateConstitution } = body;

    console.log('[API/Projects] POST received:', { name, displayName, hasDescription: !!description, generateConstitution });

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

    // Generate Constitution with AI if requested
    // Uses description as context - similar to speckit workflow
    // Skip if no API key configured - graceful fallback
    let constitutionSkipped = false;
    let constitutionError: string | null = null;
    if (generateConstitution && description) {
      // Check if AI API key is available before attempting generation
      let hasApiKey = false;
      try {
        const aiSettings = await getAISettings();
        hasApiKey = !!aiSettings.apiKey;
      } catch (settingsError) {
        // If we can't read settings, skip constitution generation
        console.log(`[Projects] Could not read AI settings - skipping constitution generation`);
        hasApiKey = false;
      }

      if (!hasApiKey) {
        // Skip constitution generation gracefully - user can add it later
        console.log(`[Projects] Skipping constitution generation - no API key configured for project ${project.name}`);
        constitutionSkipped = true;
      } else {
        try {
          const provider = await getProvider();
          // Insert user description into AI prompt as context
          const result = await generateConstitution({
            projectName: project.displayName || name,
            projectDescription: description, // User's description becomes AI context
          });

          // Generate markdown content
          const content = generateConstitutionMarkdown(
            project.displayName || name,
            result.principles,
            result.suggestedSections
          );

          // Save constitution to database
          await prisma.constitution.create({
            data: {
              projectId: project.id,
              title: `${project.displayName || name} Constitution`,
              content,
              principles: result.principles,
              version: '1.0.0',
              ratifiedDate: new Date(),
              lastAmendedDate: new Date(),
            },
          });

          console.log(`[Projects] Constitution generated for project ${project.name} using ${provider}`);
        } catch (aiError) {
          const message = aiError instanceof Error ? aiError.message : 'Unknown error';
          console.error('[Projects] Error generating constitution:', message);
          // Don't fail the whole project - just log the error and skip constitution
          constitutionError = message;
          constitutionSkipped = true;
        }
      }
    }

    // Return response - include warning if constitution was skipped
    const response: Record<string, unknown> = {
      ...project,
    };

    if (constitutionSkipped) {
      response.warning = constitutionError
        ? `Constitution generation failed: ${constitutionError}. You can generate it later from the project page.`
        : 'Constitution was skipped because no AI API key is configured. You can generate it later from the project page.';
    }

    return NextResponse.json(response, { status: 201 });
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

interface Principle {
  name: string;
  description: string;
}

interface Section {
  name: string;
  content: string;
}

function generateConstitutionMarkdown(
  projectName: string,
  principles: Principle[],
  suggestedSections: Section[]
): string {
  const date = new Date().toISOString().split('T')[0];

  let content = `# ${projectName} Constitution\n\n`;
  content += `**Version**: 1.0.0 | **Ratified**: ${date} | **Last Amended**: ${date}\n\n`;

  content += `## Core Principles\n\n`;
  for (const principle of principles) {
    content += `### ${principle.name}\n\n`;
    content += `${principle.description}\n\n`;
  }

  if (suggestedSections?.length) {
    for (const section of suggestedSections) {
      content += `## ${section.name}\n\n`;
      content += `${section.content}\n\n`;
    }
  }

  content += `## Governance\n\n`;
  content += `- This constitution supersedes all other practices\n`;
  content += `- Amendments require documentation and approval\n`;
  content += `- All PRs must verify compliance with principles\n`;
  content += `- Complexity must be justified\n\n`;

  content += `---\n\n`;
  content += `*This constitution was generated by SpecBoard*\n`;

  return content;
}
