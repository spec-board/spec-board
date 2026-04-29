#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
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
  type ContentType,
} from '../lib/core';

const server = new McpServer({
  name: 'specboard',
  version: '1.0.0',
});

server.tool('list_projects', 'List all projects with feature counts', {}, async () => {
  const projects = await listProjects();
  return { content: [{ type: 'text', text: JSON.stringify(projects, null, 2) }] };
});

server.tool('get_project', 'Get project overview with features', { slug: z.string().describe('Project slug') }, async ({ slug }) => {
  const project = await getProject(slug);
  return { content: [{ type: 'text', text: JSON.stringify(project, null, 2) }] };
});

server.tool('get_feature', 'Get feature with all content fields', {
  project: z.string().describe('Project slug'),
  feature: z.string().describe('Feature ID or featureId'),
}, async ({ project, feature }) => {
  const result = await getFeature(project, feature);
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

server.tool('get_constitution', 'Get project constitution', { slug: z.string().describe('Project slug') }, async ({ slug }) => {
  const constitution = await getConstitution(slug);
  return { content: [{ type: 'text', text: JSON.stringify(constitution, null, 2) }] };
});

server.tool('create_feature', 'Create a new feature in backlog', {
  project: z.string().describe('Project slug'),
  name: z.string().describe('Feature name'),
  description: z.string().describe('Feature description'),
}, async ({ project, name, description }) => {
  const feature = await createFeature(project, name, description);
  return { content: [{ type: 'text', text: JSON.stringify(feature, null, 2) }] };
});

server.tool('update_feature_content', 'Update spec/plan/tasks content for a feature', {
  featureId: z.string().describe('Feature database ID'),
  type: z.enum(['spec', 'plan', 'tasks', 'clarifications', 'analysis', 'research', 'data-model', 'quickstart', 'contracts', 'checklists']).describe('Content type'),
  content: z.string().describe('New content (markdown)'),
}, async ({ featureId, type, content }) => {
  const feature = await updateFeatureContent(featureId, type as ContentType, content);
  return { content: [{ type: 'text', text: `Updated ${type} for feature ${feature.name}` }] };
});

server.tool('update_task_status', 'Mark a task complete or incomplete', {
  taskId: z.string().describe('Task database ID'),
  completed: z.boolean().describe('Whether the task is completed'),
}, async ({ taskId, completed }) => {
  const task = await updateTaskStatus(taskId, completed);
  return { content: [{ type: 'text', text: `Task ${task.taskId} marked as ${completed ? 'completed' : 'pending'}` }] };
});

server.tool('get_context', 'Get structured context for AI agent consumption (spec + plan + tasks + constitution)', {
  project: z.string().describe('Project slug'),
  feature: z.string().describe('Feature ID or featureId'),
}, async ({ project, feature }) => {
  const context = await getFeatureContext(project, feature);
  return { content: [{ type: 'text', text: context }] };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('MCP server error:', err);
  process.exit(1);
});
