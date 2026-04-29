import { describe, it, expect } from 'vitest';
import { calculateImpact } from './impact';
import type { Feature, Constitution } from '@/types';

function makeFeature(overrides: Partial<Feature> = {}): Feature {
  return {
    id: 'feat-1',
    featureId: '001-test',
    name: 'Test Feature',
    path: '',
    stage: 'backlog',
    hasSpec: false,
    hasClarifications: false,
    hasPlan: false,
    hasTasks: false,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    checklistProgress: null,
    phases: [],
    tasks: [],
    userStories: [],
    clarificationSessions: [],
    totalClarifications: 0,
    technicalContext: null,
    taskGroups: null,
    constitutionVersion: null,
    branch: null,
    specContent: null,
    planContent: null,
    tasksContent: null,
    clarificationsContent: null,
    researchContent: null,
    dataModelContent: null,
    quickstartContent: null,
    contractsContent: null,
    checklistsContent: null,
    analysisContent: null,
    additionalFiles: [],
    ...overrides,
  };
}

function makeConstitution(version = '1.0'): Constitution {
  return {
    rawContent: '# Constitution\nBe good.',
    title: 'Project Constitution',
    version,
    principles: [],
    sections: [],
  };
}

describe('calculateImpact', () => {
  describe('pipeline completeness', () => {
    it('returns critical when spec is missing', () => {
      const result = calculateImpact(makeFeature(), null);
      const noSpec = result.items.find(i => i.id === 'no-spec');
      expect(noSpec).toBeDefined();
      expect(noSpec!.severity).toBe('critical');
      expect(result.pipelineStatus.spec).toBe('critical');
    });

    it('returns warning when spec exists but plan missing', () => {
      const result = calculateImpact(makeFeature({ specContent: '# Spec' }), null);
      const noPlan = result.items.find(i => i.id === 'no-plan');
      expect(noPlan).toBeDefined();
      expect(noPlan!.severity).toBe('warning');
      expect(result.pipelineStatus.plan).toBe('warning');
    });

    it('returns warning when plan exists but tasks missing', () => {
      const result = calculateImpact(makeFeature({ specContent: '# Spec', planContent: '# Plan' }), null);
      const noTasks = result.items.find(i => i.id === 'no-tasks');
      expect(noTasks).toBeDefined();
      expect(noTasks!.severity).toBe('warning');
    });

    it('returns info when tasks exist but analysis missing', () => {
      const result = calculateImpact(makeFeature({ specContent: '# Spec', planContent: '# Plan', tasksContent: '# Tasks' }), null);
      const noAnalysis = result.items.find(i => i.id === 'no-analysis');
      expect(noAnalysis).toBeDefined();
      expect(noAnalysis!.severity).toBe('info');
    });

    it('returns ok items when pipeline is complete', () => {
      const feature = makeFeature({
        specContent: '# Spec',
        planContent: '# Plan',
        tasksContent: '# Tasks',
        analysisContent: '# Analysis',
      });
      const result = calculateImpact(feature, null);
      expect(result.items.find(i => i.id === 'spec-plan')?.severity).toBe('ok');
      expect(result.items.find(i => i.id === 'plan-tasks')?.severity).toBe('ok');
      expect(result.items.find(i => i.id === 'tasks-analysis')?.severity).toBe('ok');
    });
  });

  describe('pipelineStatus', () => {
    it('all critical/info when empty feature', () => {
      const result = calculateImpact(makeFeature(), null);
      expect(result.pipelineStatus.spec).toBe('critical');
      expect(result.pipelineStatus.plan).toBe('info');
      expect(result.pipelineStatus.tasks).toBe('info');
      expect(result.pipelineStatus.analysis).toBe('info');
    });

    it('all ok when fully populated', () => {
      const feature = makeFeature({
        specContent: 'x', planContent: 'x', tasksContent: 'x', analysisContent: 'x',
      });
      const result = calculateImpact(feature, null);
      expect(result.pipelineStatus.spec).toBe('ok');
      expect(result.pipelineStatus.plan).toBe('ok');
      expect(result.pipelineStatus.tasks).toBe('ok');
      expect(result.pipelineStatus.analysis).toBe('ok');
    });

    it('treats empty string content as missing', () => {
      const feature = makeFeature({ specContent: '' });
      const result = calculateImpact(feature, null);
      expect(result.pipelineStatus.spec).toBe('critical');
    });

    it('plan is warning when spec missing but plan exists', () => {
      const result = calculateImpact(makeFeature({ planContent: 'x' }), null);
      expect(result.pipelineStatus.plan).toBe('warning');
    });
  });

  describe('constitution drift', () => {
    it('detects drift when versions differ', () => {
      const feature = makeFeature({
        constitutionVersion: { id: 'v1', version: '1.0', content: '', principles: [] },
      });
      const constitution = makeConstitution('2.0');
      const result = calculateImpact(feature, constitution);
      expect(result.constitutionDrift).toBe(true);
      const item = result.items.find(i => i.id === 'constitution-drift');
      expect(item).toBeDefined();
      expect(item!.severity).toBe('warning');
    });

    it('returns ok when versions match', () => {
      const feature = makeFeature({
        constitutionVersion: { id: 'v1', version: '1.0', content: '', principles: [] },
      });
      const constitution = makeConstitution('1.0');
      const result = calculateImpact(feature, constitution);
      expect(result.constitutionDrift).toBe(false);
      expect(result.items.find(i => i.id === 'constitution-ok')).toBeDefined();
    });

    it('detects missing constitution reference on feature', () => {
      const feature = makeFeature();
      const constitution = makeConstitution('1.0');
      const result = calculateImpact(feature, constitution);
      expect(result.constitutionDrift).toBe(true);
      expect(result.items.find(i => i.id === 'constitution-missing')?.severity).toBe('info');
    });

    it('no constitution items when constitution is null', () => {
      const result = calculateImpact(makeFeature(), null);
      expect(result.items.filter(i => i.id.startsWith('constitution'))).toHaveLength(0);
      expect(result.constitutionDrift).toBe(false);
    });
  });

  describe('user story coverage', () => {
    it('warns about uncovered stories', () => {
      const feature = makeFeature({
        userStories: [
          { id: 'us1', title: 'Story 1', status: 'pending' },
          { id: 'us2', title: 'Story 2', status: 'pending' },
        ],
        tasks: [
          { id: 't1', description: 'Task 1', completed: false, parallel: false, userStory: 'us1', filePath: null },
        ],
      });
      const result = calculateImpact(feature, null);
      const item = result.items.find(i => i.id === 'uncovered-stories');
      expect(item).toBeDefined();
      expect(item!.severity).toBe('warning');
      expect(item!.message).toContain('1 user story without tasks');
    });

    it('uses plural when multiple stories uncovered', () => {
      const feature = makeFeature({
        userStories: [
          { id: 'us1', title: 'Story 1', status: 'pending' },
          { id: 'us2', title: 'Story 2', status: 'pending' },
          { id: 'us3', title: 'Story 3', status: 'pending' },
        ],
        tasks: [
          { id: 't1', description: 'Unrelated task', completed: false, parallel: false, userStory: null, filePath: null },
        ],
      });
      const result = calculateImpact(feature, null);
      const item = result.items.find(i => i.id === 'uncovered-stories');
      expect(item?.message).toContain('3 user stories without tasks');
    });

    it('no warning when all stories have tasks', () => {
      const feature = makeFeature({
        userStories: [{ id: 'us1', title: 'Story 1', status: 'pending' }],
        tasks: [{ id: 't1', description: 'Task 1', completed: false, parallel: false, userStory: 'us1', filePath: null }],
      });
      const result = calculateImpact(feature, null);
      expect(result.items.find(i => i.id === 'uncovered-stories')).toBeUndefined();
    });

    it('no warning when no user stories', () => {
      const result = calculateImpact(makeFeature({ tasks: [{ id: 't1', description: 'x', completed: false, parallel: false, userStory: null, filePath: null }] }), null);
      expect(result.items.find(i => i.id === 'uncovered-stories')).toBeUndefined();
    });
  });
});
