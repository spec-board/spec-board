import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/export/markdown
 * Export a project from database to markdown files
 *
 * Request body:
 * {
 *   projectId: string,
 *   outputPath: string  // Directory to export to
 * }
 *
 * Response:
 * {
 *   success: true,
 *   outputPath: string,
 *   featuresExported: number,
 *   filesCreated: string[]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, outputPath } = body;

    if (!projectId || !outputPath) {
      return NextResponse.json(
        { error: 'projectId and outputPath are required' },
        { status: 400 }
      );
    }

    // Get project with all features, tasks, and user stories
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        features: {
          orderBy: { order: 'asc' },
          include: {
            userStories: {
              orderBy: { order: 'asc' },
            },
            tasks: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const filesCreated: string[] = [];
    let featuresExported = 0;

    // Create output directory structure
    const specsDir = path.join(outputPath, 'specs');
    await fs.mkdir(specsDir, { recursive: true });

    // Export each feature
    for (const feature of project.features) {
      const featureDir = path.join(specsDir, feature.featureId);
      await fs.mkdir(featureDir, { recursive: true });

      featuresExported++;

      // Export spec.md (basic info)
      const specContent = generateSpecMd(feature);
      await fs.writeFile(path.join(featureDir, 'spec.md'), specContent, 'utf-8');
      filesCreated.push(path.join(featureDir, 'spec.md'));

      // Export plan.md (basic info)
      const planContent = generatePlanMd(feature);
      await fs.writeFile(path.join(featureDir, 'plan.md'), planContent, 'utf-8');
      filesCreated.push(path.join(featureDir, 'plan.md'));

      // Export tasks.md
      const tasksContent = generateTasksMd(feature);
      await fs.writeFile(path.join(featureDir, 'tasks.md'), tasksContent, 'utf-8');
      filesCreated.push(path.join(featureDir, 'tasks.md'));
    }

    return NextResponse.json({
      success: true,
      outputPath,
      featuresExported,
      filesCreated,
    });
  } catch (error) {
    console.error('Error exporting project:', error);
    return NextResponse.json(
      { error: 'Failed to export project' },
      { status: 500 }
    );
  }
}

function generateSpecMd(feature: any): string {
  let content = `# ${feature.name}\n\n`;

  if (feature.description) {
    content += `${feature.description}\n\n`;
  }

  content += `## User Stories\n\n`;
  for (const story of feature.userStories || []) {
    const statusIcon = story.status === 'completed' ? '[x]' : '[ ]';
    content += `- ${statusIcon} **${story.storyId}**: ${story.title}\n`;
    if (story.description) {
      content += `  - ${story.description}\n`;
    }
  }

  content += `\n## Status\n- **Stage**: ${feature.stage}\n`;

  return content;
}

function generatePlanMd(feature: any): string {
  let content = `# ${feature.name} - Plan\n\n`;

  content += `## Overview\n`;
  content += `${feature.description || 'No description available.'}\n\n`;

  content += `## Technical Context\n`;
  content += `_Technical details to be added_\n\n`;

  content += `## Implementation Notes\n`;
  content += `_Implementation notes to be added_\n`;

  return content;
}

function generateTasksMd(feature: any): string {
  let content = `# ${feature.name} - Tasks\n\n`;

  // Group tasks by user story
  const tasksByStory = new Map<string, any[]>();
  const orphanTasks: any[] = [];

  for (const task of feature.tasks || []) {
    if (task.userStoryId) {
      const story = feature.userStories?.find(
        (s: any) => s.id === task.userStoryId
      );
      if (story) {
        const storyId = story.storyId;
        if (!tasksByStory.has(storyId)) {
          tasksByStory.set(storyId, []);
        }
        tasksByStory.get(storyId)!.push(task);
      } else {
        orphanTasks.push(task);
      }
    } else {
      orphanTasks.push(task);
    }
  }

  // Export tasks grouped by user story
  for (const [storyId, tasks] of tasksByStory) {
    const story = feature.userStories?.find((s: any) => s.storyId === storyId);
    content += `## Phase: ${storyId} - ${story?.title || 'Unknown'}\n\n`;

    for (const task of tasks) {
      const statusIcon = task.status === 'completed' ? '[x]' : '[ ]';
      const priority = task.priority === 'P' ? '[P]' : '';
      content += `- ${statusIcon} ${task.taskId} ${priority} ${task.title}\n`;
    }
    content += '\n';
  }

  // Orphan tasks (not linked to any user story)
  if (orphanTasks.length > 0) {
    content += `## Phase: General\n\n`;
    for (const task of orphanTasks) {
      const statusIcon = task.status === 'completed' ? '[x]' : '[ ]';
      const priority = task.priority === 'P' ? '[P]' : '';
      content += `- ${statusIcon} ${task.taskId} ${priority} ${task.title}\n`;
    }
    content += '\n';
  }

  // Summary
  const totalTasks = feature.tasks?.length || 0;
  const completedTasks = feature.tasks?.filter((t: any) => t.status === 'completed').length || 0;
  content += `## Summary\n`;
  content += `- **Total**: ${totalTasks} tasks\n`;
  content += `- **Completed**: ${completedTasks} tasks\n`;
  content += `- **Progress**: ${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%\n`;

  return content;
}
