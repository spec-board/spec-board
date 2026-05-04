import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  project: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  feature: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  task: {
    update: vi.fn(),
  },
  constitution: {
    findUnique: vi.fn(),
  },
}));

vi.mock('./prisma', () => ({ prisma: mockPrisma }));

import {
  listProjects,
  getProject,
  getFeature,
  getFeatureContent,
  getConstitution,
  searchFeatures,
  getFeaturesByStage,
  getFeatureContext,
  createFeature,
  updateFeatureContent,
  updateTaskStatus,
  advanceFeature,
  updateFeatureStage,
  proposeSpecChange,
  reportImplementation,
  STAGE_PIPELINE,
  CONTENT_FIELDS,
} from './core';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('listProjects', () => {
  it('returns mapped project list', async () => {
    mockPrisma.project.findMany.mockResolvedValue([{
      id: 'p1', name: 'demo', displayName: 'Demo', description: 'A demo',
      updatedAt: new Date('2026-01-01'),
      features: [{ id: 'f1', featureId: '001-auth', name: 'Auth', stage: 'backlog' }],
      _count: { features: 1 },
    }]);

    const result = await listProjects();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('demo');
    expect(result[0].featureCount).toBe(1);
    expect(result[0].updatedAt).toEqual(new Date('2026-01-01'));
    expect(result[0].features[0].featureId).toBe('001-auth');
  });

  it('returns empty array when no projects', async () => {
    mockPrisma.project.findMany.mockResolvedValue([]);
    const result = await listProjects();
    expect(result).toEqual([]);
  });
});

describe('getProject', () => {
  it('returns project with stageBreakdown', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 'p1', name: 'demo', displayName: 'Demo',
      features: [
        { stage: 'backlog' }, { stage: 'backlog' },
        { stage: 'specs' },
        { stage: 'tasks' },
      ],
      constitution: null,
    });

    const result = await getProject('demo');
    expect(result.stageBreakdown).toEqual({ backlog: 2, specs: 1, plan: 0, tasks: 1 });
  });

  it('throws for unknown project', async () => {
    mockPrisma.project.findUnique.mockResolvedValue(null);
    await expect(getProject('nope')).rejects.toThrow('Project "nope" not found');
  });
});

describe('getFeature', () => {
  const mockProject = { id: 'p1' };

  beforeEach(() => {
    mockPrisma.project.findUnique.mockResolvedValue(mockProject);
  });

  it('returns full feature with includeContent=true', async () => {
    const fullFeature = {
      id: 'f1', featureId: '001-auth', name: 'Auth', stage: 'specs',
      specContent: '# Spec', userStories: [], tasks: [],
    };
    mockPrisma.feature.findFirst.mockResolvedValue(fullFeature);

    const result = await getFeature('demo', '001-auth', true);
    expect(result).toEqual(fullFeature);
  });

  it('returns summary with includeContent=false', async () => {
    const summary = { id: 'f1', featureId: '001-auth', name: 'Auth', stage: 'specs', _count: { tasks: 3, userStories: 1 } };
    mockPrisma.feature.findFirst.mockResolvedValue(summary);

    const result = await getFeature('demo', '001-auth', false);
    expect(result).toEqual(summary);
  });

  it('throws for unknown feature', async () => {
    mockPrisma.feature.findFirst.mockResolvedValue(null);
    await expect(getFeature('demo', 'nope', true)).rejects.toThrow('Feature "nope" not found');
  });

  it('throws for unknown project', async () => {
    mockPrisma.project.findUnique.mockResolvedValue(null);
    await expect(getFeature('nope', 'f1', true)).rejects.toThrow('Project "nope" not found');
  });
});

describe('getFeatureContent', () => {
  beforeEach(() => {
    mockPrisma.project.findUnique.mockResolvedValue({ id: 'p1' });
  });

  it('returns content for valid type', async () => {
    mockPrisma.feature.findFirst.mockResolvedValue({ specContent: '# My Spec' });
    const result = await getFeatureContent('demo', 'f1', 'spec');
    expect(result).toBe('# My Spec');
  });

  it('throws when content is null', async () => {
    mockPrisma.feature.findFirst.mockResolvedValue({ specContent: null });
    await expect(getFeatureContent('demo', 'f1', 'spec')).rejects.toThrow('No spec content');
  });

  it('throws when feature not found', async () => {
    mockPrisma.feature.findFirst.mockResolvedValue(null);
    await expect(getFeatureContent('demo', 'nope', 'spec')).rejects.toThrow('Feature "nope" not found');
  });
});

describe('getConstitution', () => {
  beforeEach(() => {
    mockPrisma.project.findUnique.mockResolvedValue({ id: 'p1' });
  });

  it('returns constitution with versions', async () => {
    const constitution = { id: 'c1', content: '# Rules', versions: [] };
    mockPrisma.constitution.findUnique.mockResolvedValue(constitution);
    const result = await getConstitution('demo');
    expect(result.content).toBe('# Rules');
  });

  it('throws when no constitution', async () => {
    mockPrisma.constitution.findUnique.mockResolvedValue(null);
    await expect(getConstitution('demo')).rejects.toThrow('No constitution');
  });
});

describe('searchFeatures', () => {
  beforeEach(() => {
    mockPrisma.project.findUnique.mockResolvedValue({ id: 'p1' });
  });

  it('returns matching features', async () => {
    const features = [{ id: 'f1', featureId: '001-auth', name: 'Auth', description: null, stage: 'specs' }];
    mockPrisma.feature.findMany.mockResolvedValue(features);
    const result = await searchFeatures('demo', 'auth');
    expect(result).toEqual(features);
  });

  it('passes stage filter when provided', async () => {
    mockPrisma.feature.findMany.mockResolvedValue([]);
    await searchFeatures('demo', 'auth', 'backlog');
    const call = mockPrisma.feature.findMany.mock.calls[0][0];
    expect(call.where.stage).toBe('backlog');
  });

  it('omits stage filter when not provided', async () => {
    mockPrisma.feature.findMany.mockResolvedValue([]);
    await searchFeatures('demo', 'auth');
    const call = mockPrisma.feature.findMany.mock.calls[0][0];
    expect(call.where.stage).toBeUndefined();
  });

  it('limits results to 50', async () => {
    mockPrisma.feature.findMany.mockResolvedValue([]);
    await searchFeatures('demo', 'test');
    const call = mockPrisma.feature.findMany.mock.calls[0][0];
    expect(call.take).toBe(50);
  });
});

describe('getFeaturesByStage', () => {
  it('returns features filtered by stage', async () => {
    mockPrisma.project.findUnique.mockResolvedValue({ id: 'p1' });
    const features = [{ id: 'f1', featureId: '001-auth', name: 'Auth', description: null, stage: 'backlog' }];
    mockPrisma.feature.findMany.mockResolvedValue(features);

    const result = await getFeaturesByStage('demo', 'backlog');
    expect(result).toEqual(features);
    expect(mockPrisma.feature.findMany.mock.calls[0][0].where.stage).toBe('backlog');
  });
});

describe('getFeatureContext', () => {
  beforeEach(() => {
    mockPrisma.project.findUnique.mockResolvedValue({ id: 'p1' });
    mockPrisma.constitution.findUnique.mockResolvedValue(null);
  });

  it('returns stage-filtered context for backlog', async () => {
    mockPrisma.feature.findFirst.mockResolvedValue({
      id: 'f1', featureId: '001-auth', name: 'Auth', stage: 'backlog',
      description: 'Login feature', specContent: '# Spec', planContent: '# Plan',
      userStories: [], tasks: [],
    });

    const result = await getFeatureContext('demo', 'f1', 'backlog');
    expect(result).toContain('# Feature: Auth');
    expect(result).toContain('## Description');
    expect(result).not.toContain('## Spec');
    expect(result).not.toContain('## Plan');
  });

  it('returns spec content for specs stage', async () => {
    mockPrisma.feature.findFirst.mockResolvedValue({
      id: 'f1', featureId: '001-auth', name: 'Auth', stage: 'specs',
      specContent: '# Spec content', clarificationsContent: '# Q&A',
      planContent: '# Plan', userStories: [], tasks: [],
    });

    const result = await getFeatureContext('demo', 'f1', 'specs');
    expect(result).toContain('## Spec');
    expect(result).toContain('## Clarifications');
    expect(result).not.toContain('## Plan');
  });

  it('uses feature current stage when no override', async () => {
    mockPrisma.feature.findFirst.mockResolvedValue({
      id: 'f1', featureId: '001-auth', name: 'Auth', stage: 'tasks',
      tasksContent: '# Tasks', analysisContent: '# Analysis', planContent: '# Plan',
      userStories: [], tasks: [],
    });

    const result = await getFeatureContext('demo', 'f1');
    expect(result).toContain('## Tasks');
    expect(result).toContain('## Plan');
    expect(result).toContain('## Analysis');
  });

  it('includes constitution when available', async () => {
    mockPrisma.feature.findFirst.mockResolvedValue({
      id: 'f1', featureId: '001-auth', name: 'Auth', stage: 'backlog',
      description: 'Test', userStories: [], tasks: [],
    });
    mockPrisma.constitution.findUnique.mockResolvedValue({ content: '# Be good' });

    const result = await getFeatureContext('demo', 'f1', 'backlog');
    expect(result).toContain('## Constitution');
    expect(result).toContain('# Be good');
  });

  it('returns plan stage content including checklist', async () => {
    mockPrisma.feature.findFirst.mockResolvedValue({
      id: 'f1', featureId: '001-auth', name: 'Auth', stage: 'plan',
      specContent: '# Spec', planContent: '# Plan', checklistsContent: '# Checklist',
      userStories: [], tasks: [],
    });

    const result = await getFeatureContext('demo', 'f1', 'plan');
    expect(result).toContain('## Spec');
    expect(result).toContain('## Plan');
    expect(result).toContain('## Checklist');
    expect(result).not.toContain('## Tasks');
  });
});

describe('createFeature', () => {
  beforeEach(() => {
    mockPrisma.project.findUnique.mockResolvedValue({ id: 'p1' });
  });

  it('creates feature with correct featureId', async () => {
    mockPrisma.feature.count.mockResolvedValue(5);
    mockPrisma.feature.create.mockImplementation(({ data }) => Promise.resolve(data));

    const result = await createFeature('demo', 'User Auth', 'Login system');
    expect(result.featureId).toBe('006-user-auth');
    expect(result.stage).toBe('backlog');
    expect(result.order).toBe(5);
  });

  it('handles special characters in name', async () => {
    mockPrisma.feature.count.mockResolvedValue(0);
    mockPrisma.feature.create.mockImplementation(({ data }) => Promise.resolve(data));

    const result = await createFeature('demo', 'Hello World!!!', 'Test');
    expect(result.featureId).toBe('001-hello-world');
  });
});

describe('updateFeatureContent', () => {
  it('does full replace by default', async () => {
    mockPrisma.feature.update.mockResolvedValue({ name: 'Auth' });
    await updateFeatureContent('f1', 'spec', '# New Spec');
    expect(mockPrisma.feature.update).toHaveBeenCalledWith({
      where: { id: 'f1' },
      data: { specContent: '# New Spec' },
    });
  });

  it('applies diff patch when patch=true', async () => {
    mockPrisma.feature.findUnique.mockResolvedValue({ specContent: 'Hello World' });
    mockPrisma.feature.update.mockResolvedValue({ name: 'Auth' });

    const DiffMatchPatch = (await import('diff-match-patch')).default;
    const dmp = new DiffMatchPatch();
    const patches = dmp.patch_make('Hello World', 'Hello Universe');
    const patchText = dmp.patch_toText(patches);

    await updateFeatureContent('f1', 'spec', patchText, true);
    const updateCall = mockPrisma.feature.update.mock.calls[0][0];
    expect(updateCall.data.specContent).toBe('Hello Universe');
  });

  it('throws when feature not found in patch mode', async () => {
    mockPrisma.feature.findUnique.mockResolvedValue(null);
    await expect(updateFeatureContent('nope', 'spec', 'patch', true)).rejects.toThrow('Feature "nope" not found');
  });
});

describe('updateTaskStatus', () => {
  it('marks task completed', async () => {
    mockPrisma.task.update.mockResolvedValue({ taskId: 'T001', status: 'completed' });
    const result = await updateTaskStatus('t1', true);
    expect(mockPrisma.task.update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: { status: 'completed' },
    });
    expect(result.status).toBe('completed');
  });

  it('marks task pending', async () => {
    mockPrisma.task.update.mockResolvedValue({ taskId: 'T001', status: 'pending' });
    await updateTaskStatus('t1', false);
    expect(mockPrisma.task.update.mock.calls[0][0].data.status).toBe('pending');
  });
});

describe('advanceFeature', () => {
  beforeEach(() => {
    mockPrisma.project.findUnique.mockResolvedValue({ id: 'p1' });
    mockPrisma.feature.update.mockResolvedValue({});
  });

  it.each([
    ['backlog', 'specs'],
    ['specs', 'plan'],
    ['plan', 'tasks'],
  ])('advances %s to %s', async (from, to) => {
    mockPrisma.feature.findFirst.mockResolvedValue({ id: 'f1', featureId: '001-auth', name: 'Auth', stage: from });
    const result = await advanceFeature('demo', 'f1');
    expect(result.previousStage).toBe(from);
    expect(result.newStage).toBe(to);
  });

  it('throws when already at final stage', async () => {
    mockPrisma.feature.findFirst.mockResolvedValue({ id: 'f1', featureId: '001-auth', name: 'Auth', stage: 'tasks' });
    await expect(advanceFeature('demo', 'f1')).rejects.toThrow('cannot be advanced further');
  });

  it('throws for unknown stage value', async () => {
    mockPrisma.feature.findFirst.mockResolvedValue({ id: 'f1', featureId: '001-auth', name: 'Auth', stage: 'legacy-stage' });
    await expect(advanceFeature('demo', 'f1')).rejects.toThrow('cannot be advanced further');
  });
});

describe('updateFeatureStage', () => {
  beforeEach(() => {
    mockPrisma.project.findUnique.mockResolvedValue({ id: 'p1' });
    mockPrisma.feature.findFirst.mockResolvedValue({ id: 'f1', featureId: '001-auth', name: 'Auth', stage: 'backlog' });
    mockPrisma.feature.update.mockResolvedValue({});
  });

  it('sets valid stage', async () => {
    const result = await updateFeatureStage('demo', 'f1', 'plan');
    expect(result.stage).toBe('plan');
    expect(mockPrisma.feature.update.mock.calls[0][0].data.stage).toBe('plan');
  });

  it('throws for invalid stage', async () => {
    await expect(updateFeatureStage('demo', 'f1', 'invalid' as any)).rejects.toThrow('Invalid stage');
  });
});

describe('proposeSpecChange', () => {
  it('applies patch and returns result', async () => {
    mockPrisma.feature.findUnique.mockResolvedValue({ specContent: 'Hello World' });

    const DiffMatchPatch = (await import('diff-match-patch')).default;
    const dmp = new DiffMatchPatch();
    const patches = dmp.patch_make('Hello World', 'Hello Universe');
    const patchText = dmp.patch_toText(patches);

    const result = await proposeSpecChange('f1', 'spec', patchText);
    expect(result.success).toBe(true);
    expect(result.original).toBe('Hello World');
    expect(result.patched).toBe('Hello Universe');
  });

  it('handles mismatched content gracefully', async () => {
    mockPrisma.feature.findUnique.mockResolvedValue({ specContent: 'Completely different content' });

    const DiffMatchPatch = (await import('diff-match-patch')).default;
    const dmp = new DiffMatchPatch();
    const patches = dmp.patch_make('Original text that does not match', 'Modified text');
    const patchText = dmp.patch_toText(patches);

    const result = await proposeSpecChange('f1', 'spec', patchText);
    expect(result.original).toBe('Completely different content');
    expect(result.patched).not.toBe('Modified text');
  });

  it('throws when feature not found', async () => {
    mockPrisma.feature.findUnique.mockResolvedValue(null);
    await expect(proposeSpecChange('nope', 'spec', 'patch')).rejects.toThrow('Feature "nope" not found');
  });
});

describe('reportImplementation', () => {
  it('appends report to existing analysis', async () => {
    mockPrisma.feature.findUnique.mockResolvedValue({ id: 'f1', name: 'Auth', analysisContent: '# Existing' });
    mockPrisma.feature.update.mockResolvedValue({});

    const result = await reportImplementation('f1', 'Built the login page');
    expect(result.name).toBe('Auth');
    const updateData = mockPrisma.feature.update.mock.calls[0][0].data;
    expect(updateData.analysisContent).toContain('# Existing');
    expect(updateData.analysisContent).toContain('## Implementation Report');
    expect(updateData.analysisContent).toContain('Built the login page');
  });

  it('creates report when analysisContent is null', async () => {
    mockPrisma.feature.findUnique.mockResolvedValue({ id: 'f1', name: 'Auth', analysisContent: null });
    mockPrisma.feature.update.mockResolvedValue({});

    await reportImplementation('f1', 'First implementation');
    const updateData = mockPrisma.feature.update.mock.calls[0][0].data;
    expect(updateData.analysisContent).toContain('## Implementation Report');
    expect(updateData.analysisContent).toContain('First implementation');
  });

  it('throws when feature not found', async () => {
    mockPrisma.feature.findUnique.mockResolvedValue(null);
    await expect(reportImplementation('nope', 'notes')).rejects.toThrow('Feature "nope" not found');
  });
});

describe('exports', () => {
  it('STAGE_PIPELINE has correct stages', () => {
    expect(STAGE_PIPELINE).toEqual(['backlog', 'specs', 'plan', 'tasks']);
  });

  it('CONTENT_FIELDS maps all content types', () => {
    expect(Object.keys(CONTENT_FIELDS)).toHaveLength(10);
    expect(CONTENT_FIELDS.spec).toBe('specContent');
    expect(CONTENT_FIELDS.plan).toBe('planContent');
  });
});
