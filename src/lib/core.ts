import { prisma } from './prisma';
import DiffMatchPatch from 'diff-match-patch';
import type { FeatureStage } from '@/types';

const dmp = new DiffMatchPatch();

export const STAGE_PIPELINE: FeatureStage[] = ['backlog', 'specs', 'plan', 'tasks'];

const STAGE_CONTEXT_MAP: Record<FeatureStage, string[]> = {
  backlog: ['description', 'constitution'],
  specs: ['specContent', 'clarificationsContent', 'constitution'],
  plan: ['specContent', 'planContent', 'checklistsContent', 'constitution'],
  tasks: ['planContent', 'tasksContent', 'analysisContent'],
};

export const CONTENT_FIELDS = {
  spec: 'specContent',
  plan: 'planContent',
  tasks: 'tasksContent',
  clarifications: 'clarificationsContent',
  analysis: 'analysisContent',
  research: 'researchContent',
  'data-model': 'dataModelContent',
  quickstart: 'quickstartContent',
  contracts: 'contractsContent',
  checklists: 'checklistsContent',
} as const;

export type ContentType = keyof typeof CONTENT_FIELDS;

const FEATURE_SUMMARY_SELECT = {
  id: true, featureId: true, name: true, description: true, stage: true,
  createdAt: true, updatedAt: true,
  _count: { select: { tasks: true, userStories: true } },
} as const;

function getFieldValue(record: Record<string, unknown>, field: string): string | null {
  return (record[field] as string | null) ?? null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function resolveProjectId(slug: string): Promise<string> {
  const project = await prisma.project.findUnique({ where: { name: slug }, select: { id: true } });
  if (!project) throw new Error(`Project "${slug}" not found`);
  return project.id;
}

async function resolveFeature(projectSlug: string, featureIdentifier: string) {
  const projectId = await resolveProjectId(projectSlug);
  const feature = await prisma.feature.findFirst({
    where: { projectId, OR: [{ id: featureIdentifier }, { featureId: featureIdentifier }] },
    select: { id: true, featureId: true, name: true, stage: true },
  });
  if (!feature) throw new Error(`Feature "${featureIdentifier}" not found in project "${projectSlug}"`);
  return feature;
}

// ---------------------------------------------------------------------------
// Read operations
// ---------------------------------------------------------------------------

export async function listProjects() {
  const projects = await prisma.project.findMany({
    include: {
      features: {
        select: { id: true, name: true, stage: true, featureId: true },
        orderBy: { order: 'asc' },
      },
      _count: { select: { features: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return projects.map((p) => ({
    id: p.id,
    name: p.name,
    displayName: p.displayName,
    description: p.description,
    updatedAt: p.updatedAt,
    featureCount: p._count.features,
    features: p.features.map((f) => ({
      id: f.id,
      featureId: f.featureId,
      name: f.name,
      stage: f.stage,
    })),
  }));
}

export async function getProject(slug: string) {
  const project = await prisma.project.findUnique({
    where: { name: slug },
    include: {
      features: {
        orderBy: { order: 'asc' },
        select: {
          id: true, featureId: true, name: true, description: true, stage: true,
          specContent: true, planContent: true, tasksContent: true,
          clarificationsContent: true, analysisContent: true,
          _count: { select: { tasks: true, userStories: true } },
        },
      },
      constitution: true,
    },
  });

  if (!project) throw new Error(`Project "${slug}" not found`);

  const stageBreakdown = {
    backlog: project.features.filter(f => f.stage === 'backlog').length,
    specs: project.features.filter(f => f.stage === 'specs').length,
    plan: project.features.filter(f => f.stage === 'plan').length,
    tasks: project.features.filter(f => f.stage === 'tasks').length,
  };

  return { ...project, stageBreakdown };
}

type FeatureSummary = {
  id: string; featureId: string; name: string; description: string | null; stage: string;
  createdAt: Date; updatedAt: Date; _count: { tasks: number; userStories: number };
};

export async function getFeature(projectSlug: string, featureIdentifier: string, includeContent?: false): Promise<FeatureSummary>;
export async function getFeature(projectSlug: string, featureIdentifier: string, includeContent: true): Promise<Awaited<ReturnType<typeof getFullFeature>>>;
export async function getFeature(projectSlug: string, featureIdentifier: string, includeContent = true) {
  const projectId = await resolveProjectId(projectSlug);
  const where = { projectId, OR: [{ id: featureIdentifier }, { featureId: featureIdentifier }] };

  if (!includeContent) {
    const feature = await prisma.feature.findFirst({ where, select: FEATURE_SUMMARY_SELECT });
    if (!feature) throw new Error(`Feature "${featureIdentifier}" not found in project "${projectSlug}"`);
    return feature;
  }

  return getFullFeature(projectSlug, featureIdentifier, projectId);
}

async function getFullFeature(projectSlug: string, featureIdentifier: string, projectId: string) {
  const feature = await prisma.feature.findFirst({
    where: { projectId, OR: [{ id: featureIdentifier }, { featureId: featureIdentifier }] },
    include: {
      userStories: { orderBy: { order: 'asc' } },
      tasks: { orderBy: { order: 'asc' } },
    },
  });

  if (!feature) throw new Error(`Feature "${featureIdentifier}" not found in project "${projectSlug}"`);
  return feature;
}

export async function getFeatureContent(projectSlug: string, featureIdentifier: string, type: ContentType) {
  const projectId = await resolveProjectId(projectSlug);

  const field = CONTENT_FIELDS[type];
  const feature = await prisma.feature.findFirst({
    where: { projectId, OR: [{ id: featureIdentifier }, { featureId: featureIdentifier }] },
    select: { [field]: true },
  });

  if (!feature) throw new Error(`Feature "${featureIdentifier}" not found in project "${projectSlug}"`);
  const content = getFieldValue(feature as Record<string, unknown>, field);
  if (!content) throw new Error(`No ${type} content for feature "${featureIdentifier}"`);
  return content;
}

export async function getConstitution(projectSlug: string) {
  const projectId = await resolveProjectId(projectSlug);
  const constitution = await prisma.constitution.findUnique({
    where: { projectId },
    include: { versions: { orderBy: { createdAt: 'desc' }, take: 5 } },
  });
  if (!constitution) throw new Error(`No constitution for project "${projectSlug}"`);
  return constitution;
}

export async function searchFeatures(projectSlug: string, query: string, stage?: FeatureStage) {
  const projectId = await resolveProjectId(projectSlug);

  const features = await prisma.feature.findMany({
    where: {
      projectId,
      ...(stage ? { stage } : {}),
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { specContent: { contains: query, mode: 'insensitive' } },
        { planContent: { contains: query, mode: 'insensitive' } },
        { tasksContent: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: { id: true, featureId: true, name: true, description: true, stage: true },
    orderBy: { order: 'asc' },
    take: 50,
  });

  return features;
}

export async function getFeaturesByStage(projectSlug: string, stage: FeatureStage) {
  const projectId = await resolveProjectId(projectSlug);

  return prisma.feature.findMany({
    where: { projectId, stage },
    select: { id: true, featureId: true, name: true, description: true, stage: true },
    orderBy: { order: 'asc' },
  });
}

export async function getFeatureContext(projectSlug: string, featureIdentifier: string, stageOverride?: FeatureStage) {
  const [feature, constitution] = await Promise.all([
    getFeature(projectSlug, featureIdentifier, true),
    getConstitution(projectSlug).catch(() => null),
  ]);

  const effectiveStage = (stageOverride ?? feature.stage) as FeatureStage;
  const fields = STAGE_CONTEXT_MAP[effectiveStage] || STAGE_CONTEXT_MAP.tasks;

  const sections: string[] = [];
  sections.push(`# Feature: ${feature.name}`);
  sections.push(`Stage: ${feature.stage} | ID: ${feature.featureId}`);

  if (fields.includes('description') && feature.description) {
    sections.push(`\n## Description\n${feature.description}`);
  }
  if (fields.includes('constitution') && constitution) {
    sections.push(`\n## Constitution\n${constitution.content}`);
  }
  if (fields.includes('specContent') && feature.specContent) {
    sections.push(`\n## Spec\n${feature.specContent}`);
  }
  if (fields.includes('clarificationsContent') && feature.clarificationsContent) {
    sections.push(`\n## Clarifications\n${feature.clarificationsContent}`);
  }
  if (fields.includes('planContent') && feature.planContent) {
    sections.push(`\n## Plan\n${feature.planContent}`);
  }
  if (fields.includes('checklistsContent') && feature.checklistsContent) {
    sections.push(`\n## Checklist\n${feature.checklistsContent}`);
  }
  if (fields.includes('tasksContent') && feature.tasksContent) {
    sections.push(`\n## Tasks\n${feature.tasksContent}`);
  }
  if (fields.includes('analysisContent') && feature.analysisContent) {
    sections.push(`\n## Analysis\n${feature.analysisContent}`);
  }

  return sections.join('\n');
}

// ---------------------------------------------------------------------------
// Write operations
// ---------------------------------------------------------------------------

export async function createFeature(projectSlug: string, name: string, description: string) {
  const projectId = await resolveProjectId(projectSlug);

  const count = await prisma.feature.count({ where: { projectId } });
  const featureId = `${String(count + 1).padStart(3, '0')}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

  return prisma.feature.create({
    data: {
      projectId,
      featureId,
      name,
      description,
      stage: 'backlog',
      order: count,
    },
  });
}

export async function updateFeatureContent(featureId: string, type: ContentType, content: string, patch?: boolean) {
  const field = CONTENT_FIELDS[type];

  if (patch) {
    const current = await prisma.feature.findUnique({ where: { id: featureId }, select: { [field]: true } });
    if (!current) throw new Error(`Feature "${featureId}" not found`);
    const original = getFieldValue(current as Record<string, unknown>, field) || '';
    const patches = dmp.patch_fromText(content);
    const [patched] = dmp.patch_apply(patches, original);
    return prisma.feature.update({ where: { id: featureId }, data: { [field]: patched } });
  }

  return prisma.feature.update({ where: { id: featureId }, data: { [field]: content } });
}

export async function updateTaskStatus(taskId: string, completed: boolean) {
  return prisma.task.update({
    where: { id: taskId },
    data: { status: completed ? 'completed' : 'pending' },
  });
}

export async function advanceFeature(projectSlug: string, featureIdentifier: string) {
  const feature = await resolveFeature(projectSlug, featureIdentifier);
  const idx = STAGE_PIPELINE.indexOf(feature.stage as FeatureStage);
  if (idx === -1 || idx >= STAGE_PIPELINE.length - 1) {
    throw new Error(`Feature "${feature.name}" is at "${feature.stage}" and cannot be advanced further`);
  }
  const newStage = STAGE_PIPELINE[idx + 1];
  await prisma.feature.update({ where: { id: feature.id }, data: { stage: newStage } });
  return { id: feature.id, featureId: feature.featureId, name: feature.name, previousStage: feature.stage, newStage };
}

export async function updateFeatureStage(projectSlug: string, featureIdentifier: string, stage: FeatureStage) {
  if (!STAGE_PIPELINE.includes(stage)) {
    throw new Error(`Invalid stage "${stage}". Must be one of: ${STAGE_PIPELINE.join(', ')}`);
  }
  const feature = await resolveFeature(projectSlug, featureIdentifier);
  await prisma.feature.update({ where: { id: feature.id }, data: { stage } });
  return { id: feature.id, featureId: feature.featureId, name: feature.name, stage };
}

export async function proposeSpecChange(featureId: string, type: ContentType, patch: string) {
  const field = CONTENT_FIELDS[type];
  const feature = await prisma.feature.findUnique({ where: { id: featureId }, select: { [field]: true } });
  if (!feature) throw new Error(`Feature "${featureId}" not found`);

  const original = ((feature as Record<string, unknown>)[field] as string) || '';
  const patches = dmp.patch_fromText(patch);
  const [patched, results] = dmp.patch_apply(patches, original);
  const success = results.every(Boolean);

  return { original, patched, success };
}

export async function reportImplementation(featureId: string, notes: string) {
  const feature = await prisma.feature.findUnique({ where: { id: featureId }, select: { id: true, name: true, analysisContent: true } });
  if (!feature) throw new Error(`Feature "${featureId}" not found`);

  const report = `\n\n---\n## Implementation Report (${new Date().toISOString()})\n${notes}`;
  const updated = (feature.analysisContent || '') + report;

  await prisma.feature.update({ where: { id: featureId }, data: { analysisContent: updated } });
  return { id: feature.id, name: feature.name };
}
