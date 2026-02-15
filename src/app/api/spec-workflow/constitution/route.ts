import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { isPathSafe } from '@/lib/path-utils';

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

// POST /api/spec-workflow/constitution - Generate project constitution
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, name, principles, additionalSections } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    // Generate constitution markdown
    const constitution = generateConstitutionMarkdown(
      name,
      principles || getDefaultPrinciples(),
      additionalSections
    );

    // Determine constitution path
    let constitutionPath: string | null = null;
    if (projectId) {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (project?.filePath) {
        const { safe, resolvedPath } = isPathSafe(project.filePath);
        if (safe) {
          // Check for .specify or specs directory
          const specifyDir = path.join(resolvedPath, '.specify', 'memory');
          const specifyExists = await fs.access(specifyDir).then(() => true).catch(() => false);

          if (specifyExists) {
            constitutionPath = path.join(specifyDir, 'constitution.md');
          } else {
            // Fallback to specs directory
            const specsDir = path.join(resolvedPath, 'specs');
            const specsExists = await fs.access(specsDir).then(() => true).catch(() => false);
            if (specsExists) {
              constitutionPath = path.join(specsDir, 'constitution.md');
            }
          }
        }
      }
    }

    // Write constitution file if path found
    if (constitutionPath) {
      await fs.writeFile(constitutionPath, constitution, { flag: 'w' });
    }

    return NextResponse.json({
      success: true,
      constitution,
      path: constitutionPath,
      message: constitutionPath
        ? 'Constitution created successfully'
        : 'Could not determine project path'
    });
  } catch (error) {
    console.error('Error creating constitution:', error);
    return NextResponse.json({ error: 'Failed to create constitution' }, { status: 500 });
  }
}

// GET /api/spec-workflow/constitution - Get constitution for a project
// GET /api/spec-workflow/constitution - Get project constitution
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project?.filePath) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const { safe, resolvedPath } = isPathSafe(project.filePath);
    if (!safe) {
      return NextResponse.json({ error: 'Invalid project path' }, { status: 400 });
    }

    // Try different possible locations
    const possiblePaths = [
      path.join(resolvedPath, '.specify', 'memory', 'constitution.md'),
      path.join(resolvedPath, 'specs', 'constitution.md'),
      path.join(resolvedPath, 'constitution.md')
    ];

    for (const constitutionPath of possiblePaths) {
      try {
        const exists = await fs.access(constitutionPath).then(() => true).catch(() => false);
        if (exists) {
          const content = await fs.readFile(constitutionPath, 'utf-8');
          return NextResponse.json({
            content,
            path: constitutionPath
          });
        }
      } catch {
        continue;
      }
    }

    return NextResponse.json({
      content: null,
      message: 'No constitution found',
      availablePaths: possiblePaths
    });
  } catch (error) {
    console.error('Error getting constitution:', error);
    return NextResponse.json({ error: 'Failed to get constitution' }, { status: 500 });
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
