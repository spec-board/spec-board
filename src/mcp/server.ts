#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import type { FeatureStage } from '@/types';
import {
  listProjects,
  getProject,
  getFeature,
  getFeatureContent,
  getConstitution,
  createFeature,
  updateFeatureContent,
  updateTaskStatus,
  getFeatureContext,
  searchFeatures,
  getFeaturesByStage,
  advanceFeature,
  updateFeatureStage,
  proposeSpecChange,
  reportImplementation,
  resolveFeature,
  STAGE_PIPELINE,
  CONTENT_FIELDS,
  type ContentType,
} from '../lib/core';
import { prisma } from '../lib/prisma';
import { generateSpec, generatePlan, generateTasks, analyzeDocuments } from '../lib/ai';
import {
  generateSpecMarkdown,
  generatePlanMarkdown,
  generateTasksMarkdown,
  generateAnalysisMarkdown,
} from '../lib/formatters';

const CONTENT_TYPES = Object.keys(CONTENT_FIELDS) as [ContentType, ...ContentType[]];
const STAGES = [...STAGE_PIPELINE] as [FeatureStage, ...FeatureStage[]];

const server = new McpServer({
  name: 'specboard',
  version: '0.0.310',
});

// ---------------------------------------------------------------------------
// Read tools
// ---------------------------------------------------------------------------

server.tool('list_projects', 'List all projects with feature counts and last updated date', {}, async () => {
  const projects = await listProjects();
  return { content: [{ type: 'text', text: JSON.stringify(projects, null, 2) }] };
});

server.tool('get_project', 'Get project overview with features and stage breakdown', {
  slug: z.string().describe('Project slug'),
}, async ({ slug }) => {
  const project = await getProject(slug);
  return { content: [{ type: 'text', text: JSON.stringify(project, null, 2) }] };
});

server.tool('get_feature', 'Get feature details (summary by default, full content optional)', {
  project: z.string().describe('Project slug'),
  feature: z.string().describe('Feature ID or featureId'),
  includeContent: z.boolean().optional().describe('Include full content fields (default: false)'),
}, async ({ project, feature, includeContent }) => {
  const result = includeContent
    ? await getFeature(project, feature, true)
    : await getFeature(project, feature, false);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

server.tool('get_spec', 'Get spec content for a feature', {
  project: z.string().describe('Project slug'),
  feature: z.string().describe('Feature ID or featureId'),
}, async ({ project, feature }) => {
  const content = await getFeatureContent(project, feature, 'spec');
  return { content: [{ type: 'text', text: content }] };
});

server.tool('get_plan', 'Get plan content for a feature', {
  project: z.string().describe('Project slug'),
  feature: z.string().describe('Feature ID or featureId'),
}, async ({ project, feature }) => {
  const content = await getFeatureContent(project, feature, 'plan');
  return { content: [{ type: 'text', text: content }] };
});

server.tool('get_tasks', 'Get tasks content for a feature', {
  project: z.string().describe('Project slug'),
  feature: z.string().describe('Feature ID or featureId'),
}, async ({ project, feature }) => {
  const content = await getFeatureContent(project, feature, 'tasks');
  return { content: [{ type: 'text', text: content }] };
});

server.tool('get_constitution', 'Get project constitution with recent versions', {
  slug: z.string().describe('Project slug'),
}, async ({ slug }) => {
  const constitution = await getConstitution(slug);
  return { content: [{ type: 'text', text: JSON.stringify(constitution, null, 2) }] };
});

server.tool('get_context', 'Get stage-aware context for AI agent consumption (returns only content relevant to current stage)', {
  project: z.string().describe('Project slug'),
  feature: z.string().describe('Feature ID or featureId'),
  stage: z.enum(STAGES).optional().describe('Override stage for context selection (default: feature current stage)'),
}, async ({ project, feature, stage }) => {
  const context = await getFeatureContext(project, feature, stage);
  return { content: [{ type: 'text', text: context }] };
});

server.tool('search_features', 'Search features by text across names, descriptions, and content', {
  project: z.string().describe('Project slug'),
  query: z.string().describe('Search text (case-insensitive)'),
  stage: z.enum(STAGES).optional().describe('Filter by pipeline stage'),
}, async ({ project, query, stage }) => {
  const results = await searchFeatures(project, query, stage);
  return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
});

server.tool('get_features_by_stage', 'List features in a specific pipeline stage (summary only, no content)', {
  project: z.string().describe('Project slug'),
  stage: z.enum(STAGES).describe('Pipeline stage'),
}, async ({ project, stage }) => {
  const results = await getFeaturesByStage(project, stage);
  return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
});

// ---------------------------------------------------------------------------
// Write tools
// ---------------------------------------------------------------------------

server.tool('create_feature', 'Create a new feature in backlog', {
  project: z.string().describe('Project slug'),
  name: z.string().describe('Feature name'),
  description: z.string().describe('Feature description'),
}, async ({ project, name, description }) => {
  const feature = await createFeature(project, name, description);
  return { content: [{ type: 'text', text: JSON.stringify(feature, null, 2) }] };
});

server.tool('update_feature_content', 'Update spec/plan/tasks content (full replace or diff patch)', {
  featureId: z.string().describe('Feature database ID'),
  type: z.enum(CONTENT_TYPES).describe('Content type'),
  content: z.string().describe('New content (markdown) or diff patch string if patch=true'),
  patch: z.boolean().optional().describe('If true, treat content as a diff-match-patch format patch to apply'),
}, async ({ featureId, type, content, patch }) => {
  const feature = await updateFeatureContent(featureId, type as ContentType, content, patch ?? undefined);
  const mode = patch ? 'Patched' : 'Updated';
  return { content: [{ type: 'text', text: `${mode} ${type} for feature ${feature.name}` }] };
});

server.tool('update_task_status', 'Mark a task complete or incomplete', {
  taskId: z.string().describe('Task database ID'),
  completed: z.boolean().describe('Whether the task is completed'),
}, async ({ taskId, completed }) => {
  const task = await updateTaskStatus(taskId, completed);
  return { content: [{ type: 'text', text: `Task ${task.taskId} marked as ${completed ? 'completed' : 'pending'}` }] };
});

server.tool('advance_feature', 'Move feature to next pipeline stage (backlog→specs→plan→tasks)', {
  project: z.string().describe('Project slug'),
  feature: z.string().describe('Feature ID or featureId'),
}, async ({ project, feature }) => {
  const result = await advanceFeature(project, feature);
  return { content: [{ type: 'text', text: `Advanced "${result.name}" from ${result.previousStage} to ${result.newStage}` }] };
});

server.tool('update_feature_stage', 'Set feature to a specific pipeline stage (including backwards)', {
  project: z.string().describe('Project slug'),
  feature: z.string().describe('Feature ID or featureId'),
  stage: z.enum(STAGES).describe('Target stage'),
}, async ({ project, feature, stage }) => {
  const result = await updateFeatureStage(project, feature, stage);
  return { content: [{ type: 'text', text: `Set "${result.name}" to stage: ${result.stage}` }] };
});

server.tool('propose_spec_change', 'Preview a diff-based change to feature content without saving (read-only)', {
  featureId: z.string().describe('Feature database ID'),
  type: z.enum(CONTENT_TYPES).describe('Content type to patch'),
  patch: z.string().describe('Diff patch string (diff-match-patch patch_toText format)'),
}, async ({ featureId, type, patch }) => {
  const result = await proposeSpecChange(featureId, type as ContentType, patch);
  const text = result.success
    ? `Patch applied successfully.\n\n## Result\n${result.patched}`
    : `Patch failed to apply cleanly.\n\n## Original\n${result.original}`;
  return { content: [{ type: 'text', text }] };
});

server.tool('report_implementation', 'Record what was actually built for a feature (appends to analysis content)', {
  featureId: z.string().describe('Feature database ID'),
  notes: z.string().describe('Implementation notes (markdown) — what was built, deviations from spec'),
}, async ({ featureId, notes }) => {
  const result = await reportImplementation(featureId, notes);
  return { content: [{ type: 'text', text: `Implementation report saved for "${result.name}"` }] };
});

// ---------------------------------------------------------------------------
// Pipeline tools — AI-powered spec generation
// ---------------------------------------------------------------------------

server.tool('generate_spec', 'Generate a specification from feature description using AI. Advances feature to specs stage.', {
  project: z.string().describe('Project slug'),
  feature: z.string().describe('Feature ID or featureId'),
}, async ({ project, feature: featureIdentifier }) => {
  const feat = await resolveFeature(project, featureIdentifier);
  const full = await prisma.feature.findUniqueOrThrow({
    where: { id: feat.id },
    select: { id: true, name: true, description: true, projectId: true },
  });

  const spec = await generateSpec({
    featureName: full.name,
    description: full.description || full.name,
    projectContext: '',
  });

  const specContent = generateSpecMarkdown(spec, full.name);

  await prisma.feature.update({
    where: { id: full.id },
    data: { specContent, stage: 'specs' },
  });

  if (spec.userStories?.length) {
    await prisma.userStory.createMany({
      data: spec.userStories.map((story: any, index: number) => ({
        featureId: full.id,
        storyId: story.id || `US${index + 1}`,
        title: story.title,
        description: story.description || null,
        status: 'pending',
        order: index,
      })),
    });
  }

  return { content: [{ type: 'text' as const, text: `Generated spec for "${full.name}" (stage → specs)\n\n${specContent}` }] };
});

server.tool('generate_plan', 'Generate an implementation plan from spec using AI. Advances feature to plan stage.', {
  project: z.string().describe('Project slug'),
  feature: z.string().describe('Feature ID or featureId'),
}, async ({ project, feature: featureIdentifier }) => {
  const feat = await resolveFeature(project, featureIdentifier);
  const full = await prisma.feature.findUniqueOrThrow({
    where: { id: feat.id },
    select: { id: true, name: true, featureId: true, specContent: true, clarificationsContent: true, projectId: true },
  });

  if (!full.specContent) throw new Error(`Feature "${full.name}" has no spec content. Generate spec first.`);

  const constitution = await prisma.constitution.findUnique({
    where: { projectId: full.projectId },
    select: { content: true },
  });

  const plan = await generatePlan({
    specContent: full.specContent,
    clarifications: undefined,
    constitution: constitution?.content || undefined,
  });

  const planContent = generatePlanMarkdown(plan, full.name, full.featureId);

  await prisma.feature.update({
    where: { id: full.id },
    data: { planContent, stage: 'plan' },
  });

  return { content: [{ type: 'text' as const, text: `Generated plan for "${full.name}" (stage → plan)\n\n${planContent}` }] };
});

server.tool('generate_tasks', 'Generate task breakdown from spec and plan using AI. Advances feature to tasks stage.', {
  project: z.string().describe('Project slug'),
  feature: z.string().describe('Feature ID or featureId'),
}, async ({ project, feature: featureIdentifier }) => {
  const feat = await resolveFeature(project, featureIdentifier);
  const full = await prisma.feature.findUniqueOrThrow({
    where: { id: feat.id },
    select: { id: true, name: true, specContent: true, planContent: true },
  });

  if (!full.specContent || !full.planContent) {
    throw new Error(`Feature "${full.name}" needs both spec and plan content. Generate them first.`);
  }

  const tasks = await generateTasks({
    specContent: full.specContent,
    planContent: full.planContent,
  });

  const tasksContent = generateTasksMarkdown(tasks, full.name);

  await prisma.feature.update({
    where: { id: full.id },
    data: { tasksContent, stage: 'tasks' },
  });

  return { content: [{ type: 'text' as const, text: `Generated ${tasks.phases.reduce((n, p) => n + p.tasks.length, 0)} tasks for "${full.name}" (stage → tasks)\n\n${tasksContent}` }] };
});

server.tool('analyze', 'Analyze consistency across spec, plan, and tasks using AI.', {
  project: z.string().describe('Project slug'),
  feature: z.string().describe('Feature ID or featureId'),
}, async ({ project, feature: featureIdentifier }) => {
  const feat = await resolveFeature(project, featureIdentifier);
  const full = await prisma.feature.findUniqueOrThrow({
    where: { id: feat.id },
    select: { id: true, name: true, specContent: true, planContent: true, tasksContent: true, projectId: true },
  });

  if (!full.specContent || !full.planContent || !full.tasksContent) {
    throw new Error(`Feature "${full.name}" needs spec, plan, and tasks content for analysis.`);
  }

  const constitution = await prisma.constitution.findUnique({
    where: { projectId: full.projectId },
    select: { content: true },
  });

  const analysis = await analyzeDocuments({
    specContent: full.specContent,
    planContent: full.planContent,
    tasksContent: full.tasksContent,
    constitution: constitution?.content || undefined,
  });

  const analysisContent = generateAnalysisMarkdown(analysis);

  await prisma.feature.update({
    where: { id: full.id },
    data: { analysisContent },
  });

  return { content: [{ type: 'text' as const, text: `Analysis for "${full.name}": ${analysis.isValid ? 'Valid' : 'Issues found'}\n\n${analysisContent}` }] };
});

server.tool('run_pipeline', 'Run full AI pipeline: generate spec → plan → tasks → analyze. Takes a backlog feature through all stages.', {
  project: z.string().describe('Project slug'),
  feature: z.string().describe('Feature ID or featureId'),
}, async ({ project, feature: featureIdentifier }) => {
  const feat = await resolveFeature(project, featureIdentifier);
  const full = await prisma.feature.findUniqueOrThrow({
    where: { id: feat.id },
    select: { id: true, name: true, featureId: true, description: true, projectId: true },
  });

  const results: string[] = [];

  const spec = await generateSpec({
    featureName: full.name,
    description: full.description || full.name,
    projectContext: '',
  });
  const specContent = generateSpecMarkdown(spec, full.name);
  await prisma.feature.update({ where: { id: full.id }, data: { specContent, stage: 'specs' } });
  results.push(`✅ Spec: ${spec.userStories?.length || 0} user stories, ${spec.edgeCases?.length || 0} edge cases`);

  if (spec.userStories?.length) {
    await prisma.userStory.createMany({
      data: spec.userStories.map((story: any, index: number) => ({
        featureId: full.id,
        storyId: story.id || `US${index + 1}`,
        title: story.title,
        description: story.description || null,
        status: 'pending',
        order: index,
      })),
    });
  }

  const constitution = await prisma.constitution.findUnique({
    where: { projectId: full.projectId },
    select: { content: true },
  });

  const plan = await generatePlan({
    specContent,
    constitution: constitution?.content || undefined,
  });
  const planContent = generatePlanMarkdown(plan, full.name, full.featureId);
  await prisma.feature.update({ where: { id: full.id }, data: { planContent, stage: 'plan' } });
  results.push(`✅ Plan: ${plan.summary?.substring(0, 100) || 'generated'}...`);

  const tasks = await generateTasks({ specContent, planContent });
  const tasksContent = generateTasksMarkdown(tasks, full.name);
  await prisma.feature.update({ where: { id: full.id }, data: { tasksContent, stage: 'tasks' } });
  const taskCount = tasks.phases.reduce((n, p) => n + p.tasks.length, 0);
  results.push(`✅ Tasks: ${taskCount} tasks in ${tasks.phases.length} phases`);

  const analysis = await analyzeDocuments({
    specContent,
    planContent,
    tasksContent,
    constitution: constitution?.content || undefined,
  });
  const analysisContent = generateAnalysisMarkdown(analysis);
  await prisma.feature.update({ where: { id: full.id }, data: { analysisContent } });
  results.push(`✅ Analysis: ${analysis.isValid ? 'Valid' : 'Issues found'}`);

  return { content: [{ type: 'text' as const, text: `Pipeline complete for "${full.name}":\n\n${results.join('\n')}` }] };
});

// ---------------------------------------------------------------------------
// Context tools
// ---------------------------------------------------------------------------

server.tool('get_project_context', 'Get complete project context in a single call — project info, constitution, all features with stages and content summaries', {
  slug: z.string().describe('Project slug'),
}, async ({ slug }) => {
  const [project, constitution] = await Promise.all([
    getProject(slug),
    getConstitution(slug).catch(() => null),
  ]);

  const context = {
    project: {
      name: project.name,
      displayName: project.displayName,
      description: project.description,
    },
    constitution: constitution ? {
      content: constitution.content,
      version: constitution.version,
    } : null,
    features: project.features.map((f: any) => ({
      id: f.id,
      featureId: f.featureId,
      name: f.name,
      stage: f.stage,
      hasSpec: !!f.specContent,
      hasPlan: !!f.planContent,
      hasTasks: !!f.tasksContent,
      hasAnalysis: !!f.analysisContent,
    })),
    stages: {
      backlog: project.features.filter((f: any) => f.stage === 'backlog').length,
      specs: project.features.filter((f: any) => f.stage === 'specs').length,
      plan: project.features.filter((f: any) => f.stage === 'plan').length,
      tasks: project.features.filter((f: any) => f.stage === 'tasks').length,
    },
    totalFeatures: project.features.length,
  };

  return { content: [{ type: 'text' as const, text: JSON.stringify(context, null, 2) }] };
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('MCP server error:', err);
  process.exit(1);
});
