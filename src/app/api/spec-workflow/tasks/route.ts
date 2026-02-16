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

    const tasksContent = generateTasksMarkdown(tasks, name || 'Feature');

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

    // Update feature stage and save tasksContent to database
    await prisma.feature.update({
      where: { id: featureId },
      data: {
        stage: 'in_progress',
        tasksContent
      }
    });

    return NextResponse.json({
      step: 'in_progress',
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

function generateTasksMarkdown(tasks: any, featureName: string): string {
  const date = new Date().toISOString().split('T')[0];
  let content = `# Tasks: ${featureName}\n\n`;
  content += `**Input**: Design documents from spec and plan\n`;
  content += `**Prerequisites**: plan.md (required), spec.md (required for user stories)\n\n`;

  content += `## Format: \`[ID] [P?] [Story] Description\`\n\n`;
  content += `- **[P]**: Can run in parallel (different files, no dependencies)\n`;
  content += `- **[Story]**: Which user story this task belongs to (e.g., US1, US2)\n`;
  content += `- Include exact file paths in descriptions\n\n`;

  // Group phases into: Setup, Foundational, User Stories, Polish
  const phases = tasks.phases || [];

  for (const phase of phases) {
    content += `---\n\n`;
    content += `## ${phase.name}\n\n`;

    if (phase.purpose) {
      content += `**Purpose**: ${phase.purpose}\n\n`;
    }

    // Add goal if present (for user story phases)
    if (phase.goal) {
      content += `**Goal**: ${phase.goal}\n\n`;
    }

    // Add independent test if present
    if (phase.independentTest) {
      content += `**Independent Test**: ${phase.independentTest}\n\n`;
    }

    // Add checkpoint if present
    if (phase.checkpoint) {
      content += `> **Checkpoint**: ${phase.checkpoint}\n\n`;
    }

    // Add tasks
    for (const task of phase.tasks || []) {
      const usRef = task.userStory ? ` [${task.userStory}]` : '';
      const parallel = task.parallel ? ' [P]' : '';
      content += `- [ ] ${task.id}${parallel}${usRef} ${task.description}\n`;
    }
    content += `\n`;
  }

  // Add Dependencies & Execution Order section
  content += `---\n\n`;
  content += `## Dependencies & Execution Order\n\n`;
  content += `### Phase Dependencies\n\n`;

  // Infer from phases
  content += `- **Setup**: No dependencies - can start immediately\n`;
  content += `- **Foundational**: Depends on Setup - BLOCKS all user stories\n`;
  content += `- **User Stories**: All depend on Foundational\n`;
  content += `- **Polish**: Depends on all user stories\n\n`;

  // Add Notes section
  content += `## Notes\n\n`;
  content += `- [P] tasks = different files, no dependencies\n`;
  content += `- [Story] label maps task to specific user story\n`;
  content += `- Each user story should be independently testable\n`;
  content += `- Verify tests fail before implementing\n`;
  content += `- Commit after each task or logical group\n\n`;

  return content;
}
