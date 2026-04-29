import { prisma } from './prisma';

async function resolveProjectId(slug: string): Promise<string> {
  const project = await prisma.project.findUnique({ where: { name: slug }, select: { id: true } });
  if (!project) throw new Error(`Project "${slug}" not found`);
  return project.id;
}

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
  return project;
}

export async function getFeature(projectSlug: string, featureIdentifier: string) {
  const projectId = await resolveProjectId(projectSlug);

  const feature = await prisma.feature.findFirst({
    where: {
      projectId,
      OR: [{ id: featureIdentifier }, { featureId: featureIdentifier }],
    },
    include: {
      userStories: { orderBy: { order: 'asc' } },
      tasks: { orderBy: { order: 'asc' } },
    },
  });

  if (!feature) throw new Error(`Feature "${featureIdentifier}" not found in project "${projectSlug}"`);
  return feature;
}

const CONTENT_FIELDS = {
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

export async function getFeatureContent(projectSlug: string, featureIdentifier: string, type: ContentType) {
  const projectId = await resolveProjectId(projectSlug);

  const field = CONTENT_FIELDS[type];
  const feature = await prisma.feature.findFirst({
    where: {
      projectId,
      OR: [{ id: featureIdentifier }, { featureId: featureIdentifier }],
    },
    select: { [field]: true },
  });

  if (!feature) throw new Error(`Feature "${featureIdentifier}" not found in project "${projectSlug}"`);
  const content = (feature as Record<string, unknown>)[field] as string | null;
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

export async function updateFeatureContent(featureId: string, type: ContentType, content: string) {
  const field = CONTENT_FIELDS[type];
  return prisma.feature.update({
    where: { id: featureId },
    data: { [field]: content },
  });
}

export async function updateTaskStatus(taskId: string, completed: boolean) {
  return prisma.task.update({
    where: { id: taskId },
    data: { status: completed ? 'completed' : 'pending' },
  });
}

export async function getFeatureContext(projectSlug: string, featureIdentifier: string) {
  const [feature, constitution] = await Promise.all([
    getFeature(projectSlug, featureIdentifier),
    getConstitution(projectSlug).catch(() => null),
  ]);

  const sections: string[] = [];
  sections.push(`# Feature: ${feature.name}`);
  sections.push(`Stage: ${feature.stage} | ID: ${feature.featureId}`);
  if (feature.description) sections.push(`\n## Description\n${feature.description}`);
  if (constitution) sections.push(`\n## Constitution\n${constitution.content}`);
  if (feature.specContent) sections.push(`\n## Spec\n${feature.specContent}`);
  if (feature.clarificationsContent) sections.push(`\n## Clarifications\n${feature.clarificationsContent}`);
  if (feature.planContent) sections.push(`\n## Plan\n${feature.planContent}`);
  if (feature.tasksContent) sections.push(`\n## Tasks\n${feature.tasksContent}`);
  if (feature.analysisContent) sections.push(`\n## Analysis\n${feature.analysisContent}`);

  return sections.join('\n');
}
