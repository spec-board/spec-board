import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateConstitution, getProvider } from '@/lib/ai';

// Constitution generation types
interface ConstitutionPrinciples {
  name: string;
  description: string;
}

interface ConstitutionSection {
  name: string;
  content: string;
}

export const dynamic = 'force-dynamic';

// POST /api/spec-workflow/constitution - Create, update, or generate constitution
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, name, principles, additionalSections, generateWithAI } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Verify project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Handle AI generation request
    if (generateWithAI) {
      try {
        const provider = getProvider();
        const result = await generateConstitution({
          projectName: project.displayName || name || 'Project',
          projectDescription: project.description || undefined,
        });

        // Generate markdown content with AI principles
        const content = generateConstitutionMarkdown(
          project.displayName || name || 'Project',
          result.principles,
          result.suggestedSections
        );

        // Upsert constitution in database
        const constitution = await prisma.constitution.upsert({
          where: { projectId },
          create: {
            projectId,
            title: `${project.displayName || name || 'Project'} Constitution`,
            content,
            principles: result.principles,
            version: '1.0.0',
            ratifiedDate: new Date(),
            lastAmendedDate: new Date(),
          },
          update: {
            content,
            principles: result.principles,
            lastAmendedDate: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          constitution: {
            id: constitution.id,
            title: constitution.title,
            content: constitution.content,
            principles: constitution.principles,
            version: constitution.version,
            ratifiedDate: constitution.ratifiedDate,
            lastAmendedDate: constitution.lastAmendedDate,
          },
          message: 'Constitution generated with AI',
          provider
        });
      } catch (aiError) {
        console.error('AI generation error:', aiError);
        return NextResponse.json({
          error: aiError instanceof Error ? aiError.message : 'Failed to generate with AI'
        }, { status: 500 });
      }
    }

    // Only create constitution if principles are explicitly provided or AI generation is requested
    // Don't use default principles - if no context, don't create constitution
    if (!principles && !generateWithAI) {
      return NextResponse.json({
        error: 'No principles provided and AI generation not requested',
        message: 'Provide principles or set generateWithAI: true'
      }, { status: 400 });
    }

    const principlesToUse = principles || [];

    // Generate markdown content
    const content = generateConstitutionMarkdown(
      project.displayName || name || 'Project',
      principlesToUse,
      additionalSections
    );

    // Upsert constitution in database
    const constitution = await prisma.constitution.upsert({
      where: { projectId },
      create: {
        projectId,
        title: `${project.displayName || name || 'Project'} Constitution`,
        content,
        principles: principlesToUse,
        version: '1.0.0',
        ratifiedDate: new Date(),
        lastAmendedDate: new Date(),
      },
      update: {
        content,
        principles: principlesToUse,
        lastAmendedDate: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      constitution: {
        id: constitution.id,
        title: constitution.title,
        content: constitution.content,
        principles: constitution.principles,
        version: constitution.version,
        ratifiedDate: constitution.ratifiedDate,
        lastAmendedDate: constitution.lastAmendedDate,
      },
      message: 'Constitution saved to database'
    });
  } catch (error) {
    console.error('Error creating constitution:', error);
    return NextResponse.json({ error: 'Failed to create constitution' }, { status: 500 });
  }
}

// GET /api/spec-workflow/constitution - Get constitution for a project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const constitution = await prisma.constitution.findUnique({
      where: { projectId }
    });

    if (!constitution) {
      return NextResponse.json({
        exists: false,
        message: 'No constitution found for this project'
      });
    }

    return NextResponse.json({
      exists: true,
      constitution: {
        id: constitution.id,
        title: constitution.title,
        content: constitution.content,
        principles: constitution.principles,
        version: constitution.version,
        ratifiedDate: constitution.ratifiedDate,
        lastAmendedDate: constitution.lastAmendedDate,
      }
    });
  } catch (error) {
    console.error('Error getting constitution:', error);
    return NextResponse.json({ error: 'Failed to get constitution' }, { status: 500 });
  }
}

// DELETE /api/spec-workflow/constitution - Delete constitution
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    await prisma.constitution.delete({
      where: { projectId }
    }).catch(() => {
      // Ignore if doesn't exist
    });

    return NextResponse.json({ success: true, message: 'Constitution deleted' });
  } catch (error) {
    console.error('Error deleting constitution:', error);
    return NextResponse.json({ error: 'Failed to delete constitution' }, { status: 500 });
  }
}

function getDefaultPrinciples(): ConstitutionPrinciples[] {
  return [
    {
      name: 'I. Test-First Development',
      description: 'All new features must have tests written before implementation. Use TDD for critical paths. Red-Green-Refactor cycle is mandatory.'
    },
    {
      name: 'II. Simplicity',
      description: 'Start with the simplest solution that works. Avoid premature optimization. YAGNI - You aren\'t gonna need it.'
    },
    {
      name: 'III. Accessibility',
      description: 'All UI components must meet WCAG 2.2 AA standards. Keyboard navigation is required for all interactive elements.'
    },
    {
      name: 'IV. Type Safety',
      description: 'Use TypeScript strict mode. No any types. All functions must have return types. Prefer interfaces over types.'
    },
    {
      name: 'V. Code Review',
      description: 'All changes require review before merge. Follow conventional commits. Keep PRs small and focused.'
    }
  ];
}

function generateConstitutionMarkdown(
  projectName: string,
  principles: ConstitutionPrinciples[],
  additionalSections?: ConstitutionSection[]
): string {
  const date = new Date().toISOString().split('T')[0];

  let content = `# ${projectName} Constitution\n\n`;
  content += `**Version**: 1.0.0 | **Ratified**: ${date} | **Last Amended**: ${date}\n\n`;

  content += `## Core Principles\n\n`;
  for (const principle of principles) {
    content += `### ${principle.name}\n\n`;
    content += `${principle.description}\n\n`;
  }

  if (additionalSections?.length) {
    for (const section of additionalSections) {
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
