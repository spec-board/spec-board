import { generateSpec, generateClarify, generatePlan, generateTasks, generateChecklist, analyzeDocuments } from './index';
import { generateSpecMarkdown, generateClarificationsMarkdown, generatePlanMarkdown, generateTasksMarkdown, generateAnalysisMarkdown } from '../formatters';
import { prisma } from '../prisma';
import type { OrchestrationResult, StageResult, StructuredSpec } from './types';
import { validateSpecCompleteness } from './spec-template';

async function runStage(name: string, fn: () => Promise<string>): Promise<StageResult> {
  const start = Date.now();
  try {
    const content = await fn();
    return { stage: name, status: 'success', duration: Date.now() - start, content };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { stage: name, status: 'failed', duration: Date.now() - start, content: '', issues: [message] };
  }
}

export async function orchestratePipeline(options: {
  projectId: string;
  featureId: string;
  featureName: string;
  description: string;
  constitution?: string;
}): Promise<OrchestrationResult> {
  const { projectId, featureId, featureName, description, constitution } = options;
  const stages: StageResult[] = [];
  const totalStart = Date.now();

  // Phase 1 (parallel): Spec + Clarify
  const [specResult, clarifyResult] = await Promise.all([
    runStage('spec', async () => {
      const spec = await generateSpec({ featureName, description, projectContext: '' });
      const md = generateSpecMarkdown(spec as unknown as import('./types').GeneratedSpec, featureName);
      await prisma.feature.update({ where: { id: featureId }, data: { specContent: md, stage: 'specs' } });

      if (spec.userStories?.length) {
        await prisma.userStory.createMany({
          data: spec.userStories.map((s: any, i: number) => ({
            featureId, storyId: s.id || `US${i + 1}`, title: s.title,
            description: s.description || null, status: 'pending', order: i,
          })),
        });
      }

      const completeness = validateSpecCompleteness(spec as unknown as StructuredSpec);
      return `${md}\n\n---\nCompleteness: ${completeness.score}%${completeness.missing.length ? ` (missing: ${completeness.missing.join(', ')})` : ''}`;
    }),
    runStage('clarify', async () => {
      const questions = await generateClarify({ specContent: `Feature: ${featureName}\n\n${description}` });
      const md = generateClarificationsMarkdown(questions);
      await prisma.feature.update({ where: { id: featureId }, data: { clarificationsContent: md } });
      return md;
    }),
  ]);
  stages.push(specResult, clarifyResult);

  if (specResult.status === 'failed') {
    return { stages, summary: `Pipeline stopped: spec generation failed — ${specResult.issues?.[0]}`, totalDuration: Date.now() - totalStart };
  }

  const specContent = (await prisma.feature.findUnique({ where: { id: featureId }, select: { specContent: true } }))!.specContent!;

  // Phase 2: Plan (needs spec + clarifications)
  const planResult = await runStage('plan', async () => {
    const plan = await generatePlan({ specContent, constitution });
    const md = generatePlanMarkdown(plan, featureName);
    await prisma.feature.update({ where: { id: featureId }, data: { planContent: md, stage: 'plan' } });
    return md;
  });
  stages.push(planResult);

  if (planResult.status === 'failed') {
    return { stages, summary: `Pipeline stopped: plan generation failed — ${planResult.issues?.[0]}`, totalDuration: Date.now() - totalStart };
  }

  const planContent = (await prisma.feature.findUnique({ where: { id: featureId }, select: { planContent: true } }))!.planContent!;

  // Phase 3 (parallel): Tasks + Checklist
  const [tasksResult, checklistResult] = await Promise.all([
    runStage('tasks', async () => {
      const tasks = await generateTasks({ specContent, planContent });
      const md = generateTasksMarkdown(tasks, featureName);
      await prisma.feature.update({ where: { id: featureId }, data: { tasksContent: md, stage: 'tasks' } });
      return md;
    }),
    runStage('checklist', async () => {
      const checklist = await generateChecklist({ specContent, planContent });
      const items = checklist.items || [];
      const json = JSON.stringify(items);
      await prisma.feature.update({ where: { id: featureId }, data: { checklistsContent: json } });
      return `${items.length} checklist items generated`;
    }),
  ]);
  stages.push(tasksResult, checklistResult);

  if (tasksResult.status === 'failed') {
    return { stages, summary: `Pipeline stopped: tasks generation failed — ${tasksResult.issues?.[0]}`, totalDuration: Date.now() - totalStart };
  }

  const tasksContent = (await prisma.feature.findUnique({ where: { id: featureId }, select: { tasksContent: true } }))!.tasksContent!;

  // Phase 4: Analyze (needs all three)
  const analyzeResult = await runStage('analyze', async () => {
    const analysis = await analyzeDocuments({ specContent, planContent, tasksContent, constitution });
    const md = generateAnalysisMarkdown(analysis);
    await prisma.feature.update({ where: { id: featureId }, data: { analysisContent: md } });
    return `${analysis.isValid ? 'Valid' : 'Issues found'} — spec-plan: ${analysis.specPlanConsistency.score}%, plan-tasks: ${analysis.planTasksConsistency.score}%`;
  });
  stages.push(analyzeResult);

  const succeeded = stages.filter(s => s.status === 'success').length;
  const failed = stages.filter(s => s.status === 'failed').length;
  const totalDuration = Date.now() - totalStart;

  return {
    stages,
    summary: `Orchestration complete: ${succeeded} succeeded, ${failed} failed (${Math.round(totalDuration / 1000)}s total)`,
    totalDuration,
  };
}
