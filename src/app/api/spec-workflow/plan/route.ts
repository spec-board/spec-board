import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePlan, getProvider } from '@/lib/ai';

export const dynamic = 'force-dynamic';

// POST /api/spec-workflow/plan - Generate technical plan and save to database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, featureId, name, specContent, clarifications, constitution } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    if (!featureId) {
      return NextResponse.json({ error: 'Feature ID is required' }, { status: 400 });
    }

    // Verify project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const provider = getProvider();
    const plan = await generatePlan({
      specContent,
      clarifications,
      constitution,
      projectContext: ''
    });

    const planContent = generatePlanMarkdown(plan, name || 'Feature');

    // Update feature in database - save plan content and update stage
    const feature = await prisma.feature.update({
      where: { id: featureId },
      data: {
        planContent: planContent,
        stage: 'plan',
      }
    });

    return NextResponse.json({
      step: 'plan',
      plan,
      content: planContent,
      featureId: feature.id,
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
