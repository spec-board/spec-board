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
  STAGE_PIPELINE,
  CONTENT_FIELDS,
  type ContentType,
} from '../lib/core';

const CONTENT_TYPES = Object.keys(CONTENT_FIELDS) as [ContentType, ...ContentType[]];
const STAGES = [...STAGE_PIPELINE] as [FeatureStage, ...FeatureStage[]];

const server = new McpServer({
  name: 'specboard',
  version: '3.1.0',
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
