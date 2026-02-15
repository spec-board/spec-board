import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { isPathSafe } from '@/lib/path-utils';
import { generatePlan, getProvider } from '@/lib/ai';

export const dynamic = 'force-dynamic';

// POST /api/spec-workflow/plan - Generate technical plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, name, specContent, clarifications, constitution } = body;

    const provider = getProvider();
    const plan = await generatePlan({
      specContent,
      clarifications,
      constitution,
      projectContext: ''
    });

    const planContent = generatePlanMarkdown(plan, name);

    let featureDir: string | null = null;
    if (projectId && name) {
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
      await fs.writeFile(path.join(featureDir, 'plan.md'), planContent);
    }

    return NextResponse.json({
      step: 'plan',
      plan,
      content: planContent,
      featurePath: featureDir,
      provider
    });
  } catch (error) {
    console.error('Error in plan:', error);
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 });
  }
}

function generatePlanMarkdown(plan: any, featureName: string): string {
  const date = new Date().toISOString().split('T')[0];
  let content = `# ${featureName} - Plan\n\n`;
  content += `> **Input**: spec.md\n`;
  content += `> **Date**: ${date}\n`;
  content += `> **Status**: Plan\n\n`;

  content += `## Summary\n\n${plan.summary}\n\n`;
  content += `## Technical Context\n\n`;
  content += `| Aspect | Value |\n|--------|-------|\n`;
  content += `| Language | ${plan.technicalContext?.language || 'TBD'} |\n`;
  content += `| Version | ${plan.technicalContext?.version || 'N/A'} |\n`;
  content += `| Dependencies | ${plan.technicalContext?.dependencies?.join(', ') || 'None'} |\n`;
  content += `| Storage | ${plan.technicalContext?.storage || 'TBD'} |\n`;
  content += `| Testing | ${plan.technicalContext?.testing || 'TBD'} |\n`;
  content += `| Platform | ${plan.technicalContext?.platform || 'TBD'} |\n`;

  if (plan.technicalContext?.performanceGoals) {
    content += `| Performance | ${plan.technicalContext.performanceGoals} |\n`;
  }
  if (plan.technicalContext?.constraints) {
    content += `| Constraints | ${plan.technicalContext.constraints} |\n`;
  }
  content += `\n`;

  content += `## Project Structure\n\n`;
  content += `**Decision**: ${plan.projectStructure?.decision || 'TBD'}\n\n`;
  content += '```\n' + (plan.projectStructure?.structure || 'src/\ntests/') + '\n```\n\n';

  return content;
}
