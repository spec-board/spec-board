/* Stage Transition API - No external stage-transition module needed */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAISettings } from '@/lib/ai/settings';
import {
  generateSpec,
  generateClarify,
  generatePlan,
  generateTasks,
} from '@/lib/ai';

function formatSpec(spec: any): string {
  const sections: string[] = [];
  if (spec.userStories?.length) {
    sections.push('## User Stories\n');
    for (const story of spec.userStories) {
      sections.push(`### ${story.id}: ${story.title}`);
      sections.push(story.description);
      if (story.acceptanceCriteria?.length) {
        sections.push('**Acceptance Criteria:**');
        sections.push(story.acceptanceCriteria.map((c: string) => `- ${c}`).join('\n'));
      }
      sections.push('');
    }
  }
  if (spec.functionalRequirements?.length) {
    sections.push('## Functional Requirements\n');
    sections.push(spec.functionalRequirements.map((r: string) => `- ${r}`).join('\n'));
    sections.push('');
  }
  if (spec.edgeCases?.length) {
    sections.push('## Edge Cases\n');
    sections.push(spec.edgeCases.map((e: string) => `- ${e}`).join('\n'));
    sections.push('');
  }
  if (spec.successCriteria?.length) {
    sections.push('## Success Criteria\n');
    sections.push(spec.successCriteria.map((s: string) => `- ${s}`).join('\n'));
    sections.push('');
  }
  return sections.join('\n');
}

function formatPlan(plan: any): string {
  const sections: string[] = [];
  if (plan.summary) {
    sections.push('## Summary\n');
    sections.push(plan.summary);
    sections.push('');
  }
  if (plan.technicalContext) {
    sections.push('## Technical Context\n');
    const ctx = plan.technicalContext;
    if (ctx.language) sections.push(`- **Language:** ${ctx.language}`);
    if (ctx.platform) sections.push(`- **Platform:** ${ctx.platform}`);
    if (ctx.storage) sections.push(`- **Storage:** ${ctx.storage}`);
    if (ctx.testing) sections.push(`- **Testing:** ${ctx.testing}`);
    if (ctx.dependencies?.length) {
      sections.push(`- **Dependencies:** ${ctx.dependencies.join(', ')}`);
    }
    sections.push('');
  }
  if (plan.projectStructure) {
    sections.push('## Project Structure\n');
    if (plan.projectStructure.decision) sections.push(plan.projectStructure.decision);
    if (plan.projectStructure.structure) sections.push(`\`\`\`\n${plan.projectStructure.structure}\n\`\`\``);
    sections.push('');
  }
  return sections.join('\n');
}

function formatTasks(tasks: any): string {
  const sections: string[] = [];
  if (tasks.phases?.length) {
    for (const phase of tasks.phases) {
      sections.push(`## ${phase.name}\n`);
      if (phase.purpose) sections.push(`_${phase.purpose}_\n`);
      if (phase.tasks?.length) {
        for (const task of phase.tasks) {
          sections.push(`- [${task.id}] ${task.description}${task.userStory ? ` (${task.userStory})` : ''}`);
        }
      }
      if (phase.checkpoint) sections.push(`\n**Checkpoint:** ${phase.checkpoint}`);
      sections.push('');
    }
  }
  return sections.join('\n');
}

function parseClarifications(content: string): { question: string; answer: string }[] {
  if (!content) return [];
  const lines = content.split('\n').filter(l => l.trim());
  const results: { question: string; answer: string }[] = [];
  for (const line of lines) {
    const match = line.match(/\*\*(.+?)\*\*/);
    if (match) {
      results.push({ question: match[1], answer: '' });
    }
  }
  return results;
}

async function handleStageTransition(input: {
  featureId: string;
  fromStage: string;
  toStage: string;
  featureName: string;
  description: string;
  specContent: string;
  clarificationsContent: string;
  planContent: string;
}): Promise<{ content: string; clarifications?: string }> {
  const { toStage, featureName, description, specContent, clarificationsContent, planContent } = input;

  switch (toStage) {
    case 'specs': {
      const spec = await generateSpec({ featureName, description });
      const specMarkdown = formatSpec(spec);
      const clarifications = await generateClarify({ specContent: specMarkdown });
      const clarificationsMarkdown = clarifications
        .map((c: any, i: number) => `${i + 1}. **${c.question}**\n   _${c.context || ''}_`)
        .join('\n\n');
      return { content: specMarkdown, clarifications: clarificationsMarkdown };
    }
    case 'plan': {
      const plan = await generatePlan({
        specContent,
        clarifications: parseClarifications(clarificationsContent),
      });
      return { content: formatPlan(plan) };
    }
    case 'tasks': {
      const tasks = await generateTasks({ specContent, planContent });
      return { content: formatTasks(tasks) };
    }
    default:
      throw new Error(`Unsupported stage transition to: ${toStage}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { featureId, fromStage, toStage } = body;

    if (!featureId) {
      return NextResponse.json({ error: 'Feature ID is required' }, { status: 400 });
    }

    const aiSettings = await getAISettings();
    if (!aiSettings.apiKey) {
      return NextResponse.json(
        { error: 'AI provider is not configured. Please add an API key in Settings before generating specs.' },
        { status: 400 }
      );
    }

    const feature = await prisma.feature.findUnique({
      where: { id: featureId },
    });

    if (!feature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
    }

    const validTransitions: Record<string, string> = {
      'backlog': 'specs',
      'specs': 'plan',
      'plan': 'tasks',
    };

    const expectedNextStage = validTransitions[fromStage];
    if (toStage !== expectedNextStage) {
      return NextResponse.json(
        { error: `Invalid transition. Expected ${expectedNextStage}` },
        { status: 400 }
      );
    }

    await prisma.feature.update({
      where: { id: featureId },
      data: {
        jobStatus: 'processing',
        jobProgress: 0,
        jobMessage: 'Processing...',
      },
    });

    try {
      const result = await handleStageTransition({
        featureId: feature.id,
        fromStage,
        toStage,
        featureName: feature.name,
        description: feature.description || '',
        specContent: feature.specContent || '',
        clarificationsContent: feature.clarificationsContent || '',
        planContent: feature.planContent || '',
      });

      const updateData: Record<string, any> = {
        stage: toStage,
        jobStatus: 'completed',
        jobProgress: 100,
        jobMessage: `Successfully transitioned to ${toStage}`,
        jobCompletedAt: new Date(),
      };

      if (toStage === 'specs') {
        updateData.specContent = result.content;
        updateData.clarificationsContent = result.clarifications;
      } else if (toStage === 'plan') {
        updateData.planContent = result.content;
      } else if (toStage === 'tasks') {
        updateData.tasksContent = result.content;
      }

      const updatedFeature = await prisma.feature.update({
        where: { id: featureId },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        featureId,
        stage: updatedFeature.stage,
        message: `Successfully transitioned to ${toStage}`,
      });
    } catch (error) {
      await prisma.feature.update({
        where: { id: featureId },
        data: {
          jobStatus: 'failed',
          jobMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    }
  } catch (error) {
    console.error('Error triggering stage transition:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to trigger stage transition' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featureId = searchParams.get('featureId');

    if (!featureId) {
      return NextResponse.json({ error: 'Feature ID is required' }, { status: 400 });
    }

    const feature = await prisma.feature.findUnique({
      where: { id: featureId },
      select: {
        id: true,
        stage: true,
        jobStatus: true,
        jobProgress: true,
        jobMessage: true,
        jobStartedAt: true,
        jobCompletedAt: true,
      },
    });

    if (!feature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
    }

    return NextResponse.json({
      featureId: feature.id,
      stage: feature.stage,
      jobStatus: feature.jobStatus,
      jobProgress: feature.jobProgress,
      jobMessage: feature.jobMessage,
      jobStartedAt: feature.jobStartedAt,
      jobCompletedAt: feature.jobCompletedAt,
    });
  } catch (error) {
    console.error('Error getting job status:', error);
    return NextResponse.json(
      { error: 'Failed to get job status' },
      { status: 500 }
    );
  }
}
