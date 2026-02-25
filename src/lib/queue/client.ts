import { Queue, Worker, Job } from 'bullmq';
import { getRedisClient } from './redis';
import { prisma } from '@/lib/prisma';
import { generateSpec, generateClarify, generatePlan, generateChecklist, generateTasks, analyzeDocuments, getProvider } from '@/lib/ai';

// Job status types
export type JobStatus = 'idle' | 'queued' | 'running' | 'completed' | 'failed';

// Stage transition types
export type StageTransition = 'backlog_to_specs' | 'specs_to_plan' | 'plan_to_tasks';

// Event payload for stage transition
export interface StageTransitionData {
  featureId: string;
  projectId: string;
  fromStage: string;
  toStage: string;
  featureName: string;
  description?: string;
  specContent?: string;
  clarificationsContent?: string;
  planContent?: string;
  constitutionVersionId?: string | null;
}

// Queue names
export const QUEUE_NAMES = {
  STAGE_TRANSITION: 'stage-transition',
} as const;

// Create stage transition queue
export const createStageTransitionQueue = () => {
  const connection = getRedisClient();
  return new Queue<StageTransitionData>(QUEUE_NAMES.STAGE_TRANSITION, { connection });
};

// Add job to queue
export const addStageTransitionJob = async (data: StageTransitionData) => {
  const queue = createStageTransitionQueue();
  const job = await queue.add('transition', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  });
  return job;
};

// Process stage transition jobs
export const processStageTransitionJob = async (job: Job<StageTransitionData>) => {
  const { featureId, fromStage, toStage, featureName, description, specContent, clarificationsContent, planContent, constitutionVersionId } = job.data;

  // Route to appropriate handler based on transition
  if (fromStage === 'backlog' && toStage === 'specs') {
    return handleBacklogToSpecs(job, { featureId, featureName, description, constitutionVersionId });
  } else if (fromStage === 'specs' && toStage === 'plan') {
    return handleSpecsToPlan(job, { featureId, specContent, clarificationsContent, constitutionVersionId });
  } else if (fromStage === 'plan' && toStage === 'tasks') {
    return handlePlanToTasks(job, { featureId, specContent, planContent });
  }

  return { skipped: true, reason: 'Unknown transition' };
};

// Handler: backlog → specs
async function handleBacklogToSpecs(
  job: Job<StageTransitionData>,
  data: { featureId: string; featureName: string; description?: string; constitutionVersionId?: string | null }
) {
  const { featureId, featureName, description } = data;

  // Update status to running
  await prisma.feature.update({
    where: { id: featureId },
    data: {
      jobStatus: 'running',
      jobProgress: 10,
      jobMessage: 'Starting spec generation...',
      jobStartedAt: new Date(),
    },
  });

  // Step 1: Generate spec
  await prisma.feature.update({
    where: { id: featureId },
    data: { jobProgress: 20, jobMessage: 'Generating specification...' },
  });

  const spec = await generateSpec({
    featureName,
    description: description || featureName,
    projectContext: '',
  });

  const specContent = generateSpecMarkdown(spec, featureName);

  const feature = await prisma.feature.update({
    where: { id: featureId },
    data: { specContent },
  });

  // Create user stories
  if (spec.userStories?.length) {
    await prisma.userStory.deleteMany({ where: { featureId } });
    await prisma.userStory.createMany({
      data: spec.userStories.map((story: any, index: number) => ({
        featureId,
        storyId: story.id || `US${index + 1}`,
        title: story.title,
        description: story.description || null,
        status: 'pending',
        order: index,
      })),
    });
  }

  // Step 2: Generate clarifications
  await prisma.feature.update({
    where: { id: featureId },
    data: { jobProgress: 60, jobMessage: 'Generating clarifications...' },
  });

  const clarifications = await generateClarify({ specContent });
  const clarificationsContent = generateClarificationsMarkdown(clarifications);

  await prisma.feature.update({
    where: { id: featureId },
    data: { clarificationsContent },
  });

  // Step 3: Complete transition
  await prisma.feature.update({
    where: { id: featureId },
    data: {
      stage: 'specs',
      status: 'planning',
      jobStatus: 'completed',
      jobProgress: 100,
      jobMessage: 'Spec and clarifications generated',
      jobCompletedAt: new Date(),
    },
  });

  return { success: true, featureId, toStage: 'specs', spec, clarifications };
}

// Handler: specs → plan
async function handleSpecsToPlan(
  job: Job<StageTransitionData>,
  data: { featureId: string; specContent?: string; clarificationsContent?: string; constitutionVersionId?: string | null }
) {
  const { featureId, specContent, clarificationsContent } = data;

  // Update status to running
  await prisma.feature.update({
    where: { id: featureId },
    data: {
      jobStatus: 'running',
      jobProgress: 10,
      jobMessage: 'Starting plan generation...',
      jobStartedAt: new Date(),
    },
  });

  // Step 1: Generate plan
  await prisma.feature.update({
    where: { id: featureId },
    data: { jobProgress: 30, jobMessage: 'Generating implementation plan...' },
  });

  let clarifications: { question: string; answer: string }[] = [];
  if (clarificationsContent) {
    clarifications = parseClarifications(clarificationsContent);
  }

  const plan = await generatePlan({
    specContent: specContent || '',
    clarifications,
    constitution: '',
  });

  const planContent = generatePlanMarkdown(plan);

  await prisma.feature.update({
    where: { id: featureId },
    data: { planContent },
  });

  // Step 2: Generate checklist
  await prisma.feature.update({
    where: { id: featureId },
    data: { jobProgress: 70, jobMessage: 'Generating checklist...' },
  });

  const feature = await prisma.feature.findUnique({ where: { id: featureId } });

  const checklist = await generateChecklist({
    specContent: feature?.specContent || '',
    planContent,
  });

  const checklistsContent = generateChecklistMarkdown(checklist);

  await prisma.feature.update({
    where: { id: featureId },
    data: { checklistsContent },
  });

  // Step 3: Complete transition
  await prisma.feature.update({
    where: { id: featureId },
    data: {
      stage: 'plan',
      jobStatus: 'completed',
      jobProgress: 100,
      jobMessage: 'Plan and checklist generated',
      jobCompletedAt: new Date(),
    },
  });

  return { success: true, featureId, toStage: 'plan', plan, checklist };
}

// Handler: plan → tasks
async function handlePlanToTasks(
  job: Job<StageTransitionData>,
  data: { featureId: string; specContent?: string; planContent?: string }
) {
  const { featureId, specContent, planContent } = data;

  // Update status to running
  await prisma.feature.update({
    where: { id: featureId },
    data: {
      jobStatus: 'running',
      jobProgress: 10,
      jobMessage: 'Starting task generation...',
      jobStartedAt: new Date(),
    },
  });

  // Step 1: Generate tasks
  await prisma.feature.update({
    where: { id: featureId },
    data: { jobProgress: 40, jobMessage: 'Generating task breakdown...' },
  });

  const tasks = await generateTasks({
    specContent: specContent || '',
    planContent: planContent || '',
  });

  const tasksContent = generateTasksMarkdown(tasks);

  const feature = await prisma.feature.findUnique({
    where: { id: featureId },
    include: { userStories: true },
  });

  // Delete existing tasks
  await prisma.task.deleteMany({ where: { featureId } });

  // Create new tasks
  if (tasks.phases?.length) {
    for (const phase of tasks.phases) {
      for (const task of phase.tasks || []) {
        const userStory = feature?.userStories.find(us => us.title === task.userStory);
        await prisma.task.create({
          data: {
            featureId,
            taskId: task.id,
            title: task.description || task.id,
            description: null,
            status: 'pending',
            priority: (task.priority as 'P' | 'M' | 'L') || 'M',
            userStoryId: userStory?.id || null,
          },
        });
      }
    }
  }

  await prisma.feature.update({
    where: { id: featureId },
    data: { tasksContent },
  });

  // Step 2: Generate analysis
  await prisma.feature.update({
    where: { id: featureId },
    data: { jobProgress: 80, jobMessage: 'Analyzing consistency...' },
  });

  const analysis = await analyzeDocuments({
    specContent: specContent || '',
    planContent: planContent || '',
    tasksContent,
    constitution: '',
  });

  const analysisContent = generateAnalysisMarkdown(analysis);

  await prisma.feature.update({
    where: { id: featureId },
    data: { analysisContent },
  });

  // Step 3: Complete transition
  await prisma.feature.update({
    where: { id: featureId },
    data: {
      stage: 'tasks',
      status: 'in_progress',
      jobStatus: 'completed',
      jobProgress: 100,
      jobMessage: 'Tasks and analysis generated',
      jobCompletedAt: new Date(),
    },
  });

  return { success: true, featureId, toStage: 'tasks', tasks, analysis };
}

// Create worker for stage transition queue
export const createStageTransitionWorker = () => {
  const connection = getRedisClient();
  return new Worker<StageTransitionData>(
    QUEUE_NAMES.STAGE_TRANSITION,
    async (job) => processStageTransitionJob(job),
    {
      connection,
      concurrency: 5,
    }
  );
};

// Helper functions (moved from inngest/functions.ts)
function generateSpecMarkdown(spec: any, featureName: string): string {
  const date = new Date().toISOString().split('T')[0];
  let content = `# ${featureName}\n\n`;
  content += `> **Input**: User description\n`;
  content += `> **Date**: ${date}\n`;
  content += `> **Status**: Spec\n\n`;
  content += `## User Stories\n\n`;
  for (const story of spec.userStories || []) {
    content += `### ${story.id}: ${story.title} (Priority: ${story.priority})\n\n`;
    content += `${story.description}\n\n`;
    if (story.acceptanceCriteria?.length) {
      content += `#### Acceptance Criteria\n\n`;
      for (const criteria of story.acceptanceCriteria) {
        content += `- [ ] ${criteria}\n`;
      }
      content += `\n`;
    }
  }
  if (spec.edgeCases?.length) {
    content += `## Edge Cases\n\n`;
    for (const edge of spec.edgeCases) content += `- ${edge}\n`;
    content += `\n`;
  }
  if (spec.functionalRequirements?.length) {
    content += `## Requirements\n\n`;
    for (const req of spec.functionalRequirements) content += `${req}\n`;
    content += `\n`;
  }
  return content;
}

function generateClarificationsMarkdown(clarifications: any): string {
  let content = `# Clarifications\n\n`;
  content += `> Generated: ${new Date().toISOString().split('T')[0]}\n\n`;
  for (const q of clarifications.questions || []) {
    content += `## ${q.question}\n\n`;
    content += `${q.answer || '_Awaiting answer_'}\n\n`;
  }
  return content;
}

function generatePlanMarkdown(plan: any): string {
  let content = `# Implementation Plan\n\n`;
  content += `> Generated: ${new Date().toISOString().split('T')[0]}\n\n`;
  if (plan.summary) {
    content += `## Summary\n\n${plan.summary}\n\n`;
  }
  if (plan.technicalContext) {
    content += `## Technical Context\n\n`;
    content += `- **Language**: ${plan.technicalContext.language}\n`;
    content += `- **Dependencies**: ${plan.technicalContext.dependencies.join(', ')}\n`;
    content += `- **Storage**: ${plan.technicalContext.storage}\n`;
    content += `- **Testing**: ${plan.technicalContext.testing}\n`;
    content += `- **Platform**: ${plan.technicalContext.platform}\n\n`;
  }
  return content;
}

function generateChecklistMarkdown(checklist: any): string {
  let content = `# Quality Checklist\n\n`;
  content += `> Generated: ${new Date().toISOString().split('T')[0]}\n\n`;
  for (const item of checklist.checklist || []) {
    content += `- [ ] ${item}\n`;
  }
  return content;
}

function generateTasksMarkdown(tasks: any): string {
  let content = `# Tasks\n\n`;
  content += `> Generated: ${new Date().toISOString().split('T')[0]}\n\n`;
  for (const phase of tasks.phases || []) {
    content += `## ${phase.name}\n\n`;
    for (const task of phase.tasks || []) {
      content += `### ${task.id}: ${task.title}\n\n`;
      content += `${task.description || ''}\n\n`;
      if (task.userStory) {
        content += `**User Story**: ${task.userStory}\n\n`;
      }
      if (task.dependencies?.length) {
        content += `**Dependencies**: ${task.dependencies.join(', ')}\n\n`;
      }
    }
  }
  return content;
}

function generateAnalysisMarkdown(analysis: any): string {
  let content = `# Analysis Report\n\n`;
  content += `> Generated: ${new Date().toISOString().split('T')[0]}\n\n`;
  content += `## Summary\n\n`;
  content += `- **Valid**: ${analysis.isValid ? 'Yes' : 'No'}\n\n`;
  content += `## Spec-Plan Consistency\n\n`;
  content += `- **Score**: ${analysis.specPlanConsistency?.score || 'N/A'}\n`;
  content += `- **Consistent**: ${analysis.specPlanConsistency?.isConsistent ? 'Yes' : 'No'}\n\n`;
  content += `## Plan-Tasks Consistency\n\n`;
  content += `- **Score**: ${analysis.planTasksConsistency?.score || 'N/A'}\n`;
  content += `- **Consistent**: ${analysis.planTasksConsistency?.isConsistent ? 'Yes' : 'No'}\n\n`;
  if (analysis.issues?.length) {
    content += `## Issues\n\n`;
    for (const issue of analysis.issues) {
      content += `- **[${issue.severity}]** ${issue.description}\n`;
    }
  }
  return content;
}

function parseClarifications(content: string): { question: string; answer: string }[] {
  const result: { question: string; answer: string }[] = [];
  const lines = content.split('\n');
  let currentQuestion = '';
  let currentAnswer = '';

  for (const line of lines) {
    const match = line.match(/^##\s+(.+)$/);
    if (match) {
      if (currentQuestion) {
        result.push({ question: currentQuestion, answer: currentAnswer.trim() });
      }
      currentQuestion = match[1];
      currentAnswer = '';
    } else if (currentQuestion && line.trim()) {
      currentAnswer += line.trim() + '\n';
    }
  }

  if (currentQuestion) {
    result.push({ question: currentQuestion, answer: currentAnswer.trim() });
  }

  return result;
}
