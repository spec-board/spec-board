import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { isPathSafe } from '@/lib/path-utils';
import { generateSpec, getProvider } from '@/lib/ai';

export const dynamic = 'force-dynamic';

// POST /api/spec-workflow/specify - Generate spec from description
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, name, description } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Feature name is required' }, { status: 400 });
    }

    const provider = getProvider();
    const spec = await generateSpec({
      featureName: name,
      description: description || name,
      projectContext: ''
    });

    const specContent = generateSpecMarkdown(spec, name);

    let featureDir: string | null = null;
    if (projectId) {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (project?.filePath) {
        const { safe, resolvedPath } = isPathSafe(project.filePath);
        if (safe) {
          const specsDir = path.join(resolvedPath, 'specs');
          const exists = await fs.access(specsDir).then(() => true).catch(() => false);
          if (exists) {
            featureDir = path.join(specsDir, `001-${name.toLowerCase().replace(/\s+/g, '-')}`);
          }
        }
      }
    }

    if (featureDir) {
      await fs.mkdir(featureDir, { recursive: true });
      await fs.writeFile(path.join(featureDir, 'spec.md'), specContent);
    }

    return NextResponse.json({
      step: 'specify',
      spec,
      content: specContent,
      featurePath: featureDir,
      provider
    });
  } catch (error) {
    console.error('Error in specify:', error);
    return NextResponse.json({ error: 'Failed to generate spec' }, { status: 500 });
  }
}

function generateSpecMarkdown(spec: any, featureName: string): string {
  const date = new Date().toISOString().split('T')[0];
  let content = `# ${featureName}\n\n`;
  content += `> **Input**: User description\n`;
  content += `> **Date**: ${date}\n`;
  content += `> **Status**: Specify\n\n`;

  content += `## User Stories\n\n`;
  for (const story of spec.userStories || []) {
    content += `### ${story.id}: ${story.title} (Priority: ${story.priority})\n\n`;
    content += `${story.description}\n\n`;
    if (story.acceptanceCriteria?.length) {
      content += `#### Acceptance Criteria\n\n`;
      for (const criteria of story.acceptanceCriteria) {
        content += `- [ ] ${criteria}\n`;
      }
      content += `\n`;
    }
  }

  if (spec.edgeCases?.length) {
    content += `## Edge Cases\n\n`;
    for (const edge of spec.edgeCases) content += `- ${edge}\n`;
    content += `\n`;
  }

  if (spec.functionalRequirements?.length) {
    content += `## Requirements\n\n`;
    for (const req of spec.functionalRequirements) content += `${req}\n`;
    content += `\n`;
  }

  if (spec.successCriteria?.length) {
    content += `## Success Criteria\n\n`;
    for (const sc of spec.successCriteria) content += `- ${sc}\n`;
    content += `\n`;
  }

  return content;
}
