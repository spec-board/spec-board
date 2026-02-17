import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { isPathSafe } from '@/lib/path-utils';
import { generateSpecKit, generateUserStories, getProvider } from '@/lib/ai';

// Disable Next.js route caching - always process fresh data
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prdContent, projectPath } = body;

    if (!prdContent) {
      return NextResponse.json(
        { error: 'PRD content is required' },
        { status: 400 }
      );
    }

    if (!projectPath) {
      return NextResponse.json(
        { error: 'Project path is required' },
        { status: 400 }
      );
    }

    // Validate project path is safe to access
    const { safe, resolvedPath } = isPathSafe(projectPath);
    if (!safe) {
      return NextResponse.json(
        { error: 'Access denied: Project path is outside allowed directories' },
        { status: 403 }
      );
    }

    // Validate that it's a valid spec-kit project
    const specsDir = path.join(resolvedPath, 'specs');
    const altSpecsDir = path.join(resolvedPath, '.specify', 'specs');

    const specsExist = await fs.access(specsDir).then(() => true).catch(() => false);
    const altSpecsDirExist = await fs.access(altSpecsDir).then(() => true).catch(() => false);
    const baseSpecsDir = specsExist ? specsDir : altSpecsDirExist ? altSpecsDir : null;

    if (!baseSpecsDir) {
      return NextResponse.json(
        { error: 'Invalid spec-kit project: specs/ or .specify/specs directory not found' },
        { status: 400 }
      );
    }

    // Check if user wants full spec-kit generation or just user stories
    const generateFullSpecKit = body.generateFullSpecKit === true;
    const featureName = body.featureName || 'new-feature';

    let result;

    if (generateFullSpecKit) {
      // Generate full spec-kit (spec.md, plan.md, tasks.md)
      const specKit = await generateSpecKit({
        prdContent,
        featureName,
        projectContext: resolvedPath
      });

      // Get next feature number
      const featureNumber = await getNextFeatureNumber(baseSpecsDir);
      const featureId = `${String(featureNumber).padStart(3, '0')}-${featureName.toLowerCase().replace(/\s+/g, '-')}`;
      const featureDir = path.join(baseSpecsDir, featureId);

      // Create feature directory
      await fs.mkdir(featureDir, { recursive: true });

      // Write spec.md
      const specContent = generateSpecMarkdown(specKit.spec, featureName);
      await fs.writeFile(path.join(featureDir, 'spec.md'), specContent);

      // Write plan.md
      const planContent = generatePlanMarkdown(specKit.plan, featureName);
      await fs.writeFile(path.join(featureDir, 'plan.md'), planContent);

      // Write tasks.md
      const tasksContent = generateTasksMarkdown(specKit.tasks);
      await fs.writeFile(path.join(featureDir, 'tasks.md'), tasksContent);

      result = {
        featureId,
        featurePath: featureDir,
        files: {
          spec: specContent,
          plan: planContent,
          tasks: tasksContent
        }
      };
    } else {
      // Generate only user stories
      const userStories = await generateUserStories({
        prdContent,
        projectContext: resolvedPath
      });

      result = { userStories };
    }

    // Return the generated content
    const message = generateFullSpecKit
      ? `Generated full spec-kit for ${featureName}`
      : `Generated ${result.userStories?.length || 0} user stories from PRD`;

    const provider = await getProvider();
    return NextResponse.json({
      success: true,
      provider,
      ...result,
      message
    });

  } catch (error) {
    console.error('Error processing PRD:', error);
    return NextResponse.json(
      { error: 'Failed to process PRD' },
      { status: 500 }
    );
  }
}

// Helper: Get next feature number
async function getNextFeatureNumber(specsDir: string): Promise<number> {
  try {
    const entries = await fs.readdir(specsDir, { withFileTypes: true });
    const featureDirs = entries.filter(e => e.isDirectory());

    let maxNum = 0;
    for (const dir of featureDirs) {
      const match = dir.name.match(/^(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }

    return maxNum + 1;
  } catch {
    return 1;
  }
}

// Generate spec.md content
function generateSpecMarkdown(spec: { userStories: any[]; clarifications: any[] }, featureName: string): string {
  const date = new Date().toISOString().split('T')[0];

  let content = `# ${featureName}\n\n`;
  content += `> **Input**: PRD\n`;
  content += `> **Date**: ${date}\n`;
  content += `> **Status**: Specify\n\n`;

  content += `## Overview\n\n`;
  content += `Feature specification for ${featureName}.\n\n`;

  content += `## User Stories\n\n`;
  for (const story of spec.userStories) {
    content += `### ${story.id}: ${story.title}\n\n`;
    content += `**Priority**: ${story.priority}\n\n`;
    content += `${story.description}\n\n`;
    content += `#### Acceptance Criteria\n\n`;
    for (const criterion of story.acceptanceCriteria) {
      content += `- [ ] ${criterion}\n`;
    }
    content += `\n`;
  }

  content += `## Clarifications\n\n`;
  for (const clar of spec.clarifications) {
    content += `### Q: ${clar.question}\n\n`;
    content += `**A**: ${clar.answer}\n\n`;
  }

  return content;
}

// Generate plan.md content
function generatePlanMarkdown(plan: { summary: string; technicalContext: any }, featureName: string): string {
  const date = new Date().toISOString().split('T')[0];

  let content = `# ${featureName} - Plan\n\n`;
  content += `> **Input**: spec.md\n`;
  content += `> **Date**: ${date}\n`;
  content += `> **Status**: Plan\n\n`;

  content += `## Summary\n\n${plan.summary}\n\n`;

  content += `## Technical Context\n\n`;
  content += `| Aspect | Value |\n`;
  content += `|--------|-------|\n`;
  content += `| Language | ${plan.technicalContext.language} |\n`;
  content += `| Platform | ${plan.technicalContext.platform} |\n`;
  content += `| Storage | ${plan.technicalContext.storage} |\n`;
  content += `| Testing | ${plan.technicalContext.testing} |\n`;
  content += `| Dependencies | ${plan.technicalContext.dependencies.join(', ') || 'None'} |\n\n`;

  content += `## Approach\n\n`;
  content += `TBD - Add implementation approach details.\n\n`;

  return content;
}

// Generate tasks.md content
function generateTasksMarkdown(tasks: { phases: any[] }): string {
  let content = `# Tasks\n\n`;
  content += `> **Input**: plan.md\n`;
  content += `> **Status**: Tasks\n\n`;

  for (const phase of tasks.phases) {
    content += `## ${phase.name}\n\n`;
    for (const task of phase.tasks) {
      const usRef = task.userStory ? ` [${task.userStory}]` : '';
      content += `- [ ] ${task.id}${usRef} ${task.description}\n`;
    }
    content += `\n`;
  }

  return content;
}
