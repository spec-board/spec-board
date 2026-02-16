import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateTasks, getProvider } from '@/lib/ai';

export const dynamic = 'force-dynamic';

// POST /api/spec-workflow/tasks - Generate task breakdown and save to database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, featureId, name, specContent, planContent } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    if (!featureId) {
      return NextResponse.json({ error: 'Feature ID is required' }, { status: 400 });
    }

    if (!specContent || !planContent) {
      return NextResponse.json({ error: 'Spec and plan content required' }, { status: 400 });
    }

    // Verify project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const provider = getProvider();
    const tasks = await generateTasks({ specContent, planContent });

    const tasksContent = generateTasksMarkdown(tasks);

    // Get feature to find existing user stories for mapping
    const feature = await prisma.feature.findUnique({
      where: { id: featureId },
      include: { userStories: true }
    });

    // Delete existing tasks and create new ones
    await prisma.task.deleteMany({ where: { featureId } });

    // Create tasks in database
    let taskCount = 0;
    for (const phase of tasks.phases || []) {
      for (const task of phase.tasks || []) {
        // Find matching user story by ID
        const matchingStory = feature?.userStories.find(
          us => us.storyId === task.userStory || us.storyId.replace('US', '') === task.userStory?.replace('US', '')
        );

        await prisma.task.create({
          data: {
            featureId,
            userStoryId: matchingStory?.id || null,
            taskId: task.id,
            title: task.description,
            description: null,
            status: 'pending',
            priority: task.priority || 'M',
            order: taskCount,
          }
        });
        taskCount++;
      }
    }

    // Update feature stage to tasks
    await prisma.feature.update({
      where: { id: featureId },
      data: { stage: 'tasks' }
    });

    return NextResponse.json({
      step: 'tasks',
      tasks,
      content: tasksContent,
      featureId,
      taskCount,
      provider
    });
  } catch (error) {
    console.error('Error in tasks:', error);
    return NextResponse.json({ error: 'Failed to generate tasks' }, { status: 500 });
  }
}

function generateTasksMarkdown(tasks: any): string {
  let content = `# Tasks\n\n`;
  content += `> **Input**: plan.md, spec.md\n`;
  content += `> **Status**: Tasks\n\n`;

  for (const phase of tasks.phases || []) {
    content += `## ${phase.name}\n\n`;
    if (phase.purpose) content += `**Purpose**: ${phase.purpose}\n\n`;
    if (phase.checkpoint) content += `> **Checkpoint**: ${phase.checkpoint}\n\n`;
    for (const task of phase.tasks || []) {
      const usRef = task.userStory ? ` [${task.userStory}]` : '';
      const parallel = task.parallel ? ' [P]' : '';
      content += `- [ ] ${task.id}${parallel}${usRef} ${task.description}\n`;
    }
    content += `\n`;
  }

  return content;
}
