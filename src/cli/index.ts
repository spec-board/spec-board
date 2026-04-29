#!/usr/bin/env node
import { Command } from 'commander';
import {
  listProjects,
  getProject,
  getFeature,
  getFeatureContent,
  getConstitution,
  createFeature,
  getFeatureContext,
  searchFeatures,
  getFeaturesByStage,
  advanceFeature,
  type ContentType,
} from '../lib/core';
import type { FeatureStage } from '@/types';

const program = new Command();

program
  .name('specboard')
  .description('SpecBoard CLI — manage specs from the terminal')
  .version('3.1.0');

program
  .command('list')
  .description('List all projects')
  .action(async () => {
    const projects = await listProjects();
    if (projects.length === 0) {
      console.log('No projects found.');
      return;
    }
    for (const p of projects) {
      const ago = formatRelative(p.updatedAt);
      console.log(`${p.name} — ${p.displayName} (${p.featureCount} features) [${ago}]`);
    }
  });

program
  .command('get <project> [feature] [type]')
  .description('Get project, feature, or content. Types: spec, plan, tasks, clarifications, analysis')
  .action(async (projectSlug: string, featureId?: string, type?: string) => {
    if (!featureId) {
      const project = await getProject(projectSlug);
      console.log(`# ${project.displayName}`);
      if (project.description) console.log(project.description);
      console.log(`\nStages: backlog=${project.stageBreakdown.backlog} specs=${project.stageBreakdown.specs} plan=${project.stageBreakdown.plan} tasks=${project.stageBreakdown.tasks}`);
      console.log(`\nFeatures (${project.features.length}):`);
      for (const f of project.features) {
        console.log(`  [${f.stage}] ${f.featureId} — ${f.name}`);
      }
      return;
    }

    if (type) {
      const content = await getFeatureContent(projectSlug, featureId, type as ContentType);
      console.log(content);
      return;
    }

    const feature = await getFeature(projectSlug, featureId, true);
    console.log(`# ${feature.name}`);
    console.log(`Stage: ${feature.stage} | ID: ${feature.featureId}`);
    if (feature.description) console.log(`\n${feature.description}`);
    console.log(`\nUser Stories: ${feature.userStories.length} | Tasks: ${feature.tasks.length}`);
    const fields = ['specContent', 'planContent', 'tasksContent', 'clarificationsContent', 'analysisContent'] as const;
    const available = fields.filter((f) => feature[f]).map((f) => f.replace('Content', ''));
    if (available.length) console.log(`Available: ${available.join(', ')}`);
  });

program
  .command('context <project> <feature>')
  .description('Output stage-aware context for AI agent consumption')
  .option('-s, --stage <stage>', 'Override stage (backlog, specs, plan, tasks)')
  .action(async (projectSlug: string, featureId: string, opts: { stage?: string }) => {
    const context = await getFeatureContext(projectSlug, featureId, opts.stage as FeatureStage | undefined);
    console.log(context);
  });

program
  .command('create <project> <name> <description>')
  .description('Create a new feature in backlog')
  .action(async (projectSlug: string, name: string, description: string) => {
    const feature = await createFeature(projectSlug, name, description);
    console.log(`Created: ${feature.featureId} — ${feature.name}`);
  });

program
  .command('constitution <project>')
  .description('Get project constitution')
  .action(async (projectSlug: string) => {
    const constitution = await getConstitution(projectSlug);
    console.log(constitution.content);
  });

program
  .command('search <project> <query>')
  .description('Search features by text across names, descriptions, and content')
  .option('-s, --stage <stage>', 'Filter by stage (backlog, specs, plan, tasks)')
  .action(async (projectSlug: string, query: string, opts: { stage?: string }) => {
    const results = await searchFeatures(projectSlug, query, opts.stage as FeatureStage | undefined);
    if (results.length === 0) {
      console.log('No features found.');
      return;
    }
    for (const f of results) {
      console.log(`  [${f.stage}] ${f.featureId} — ${f.name}`);
    }
  });

program
  .command('stage <project> [stage]')
  .description('Show stage breakdown, or list features in a specific stage')
  .action(async (projectSlug: string, stage?: string) => {
    if (!stage) {
      const project = await getProject(projectSlug);
      const b = project.stageBreakdown;
      console.log(`backlog: ${b.backlog}  specs: ${b.specs}  plan: ${b.plan}  tasks: ${b.tasks}`);
      return;
    }
    const features = await getFeaturesByStage(projectSlug, stage as FeatureStage);
    if (features.length === 0) {
      console.log(`No features in "${stage}" stage.`);
      return;
    }
    for (const f of features) {
      console.log(`  ${f.featureId} — ${f.name}`);
    }
  });

program
  .command('advance <project> <feature>')
  .description('Move feature to next pipeline stage')
  .action(async (projectSlug: string, featureId: string) => {
    const result = await advanceFeature(projectSlug, featureId);
    console.log(`${result.name}: ${result.previousStage} → ${result.newStage}`);
  });

program.parseAsync().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

function formatRelative(date: Date): string {
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
