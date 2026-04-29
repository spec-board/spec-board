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
  type ContentType,
} from '../lib/core';

const program = new Command();

program
  .name('specboard')
  .description('SpecBoard CLI — manage specs from the terminal')
  .version('1.0.0');

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
      console.log(`${p.name} — ${p.displayName} (${p.featureCount} features)`);
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

    const feature = await getFeature(projectSlug, featureId);
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
  .description('Output structured context for AI agent consumption')
  .action(async (projectSlug: string, featureId: string) => {
    const context = await getFeatureContext(projectSlug, featureId);
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

program.parseAsync().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
