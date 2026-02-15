import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { isPathSafe } from '@/lib/path-utils';
import { generateTasks, getProvider } from '@/lib/ai';

export const dynamic = 'force-dynamic';

// POST /api/spec-workflow/tasks - Generate task breakdown
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, name, specContent, planContent } = body;

    if (!specContent || !planContent) {
      return NextResponse.json({ error: 'Spec and plan content required' }, { status: 400 });
    }

    const provider = getProvider();
    const tasks = await generateTasks({ specContent, planContent });

    const tasksContent = generateTasksMarkdown(tasks);

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
      await fs.writeFile(path.join(featureDir, 'tasks.md'), tasksContent);
    }

    return NextResponse.json({
      step: 'tasks',
      tasks,
      content: tasksContent,
      featurePath: featureDir,
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
