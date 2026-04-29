import type { Feature, Constitution } from '@/types';

export type ImpactSeverity = 'ok' | 'info' | 'warning' | 'critical';

export interface ImpactItem {
  id: string;
  source: string;
  target: string;
  severity: ImpactSeverity;
  message: string;
}

export interface ImpactResult {
  items: ImpactItem[];
  pipelineStatus: {
    spec: ImpactSeverity;
    plan: ImpactSeverity;
    tasks: ImpactSeverity;
    analysis: ImpactSeverity;
  };
  constitutionDrift: boolean;
}

export function calculateImpact(feature: Feature, constitution: Constitution | null): ImpactResult {
  const items: ImpactItem[] = [];
  const hasSpec = !!feature.specContent;
  const hasPlan = !!feature.planContent;
  const hasTasks = !!feature.tasksContent;
  const hasAnalysis = !!feature.analysisContent;

  // Pipeline completeness
  if (!hasSpec) {
    items.push({ id: 'no-spec', source: 'feature', target: 'spec', severity: 'critical', message: 'Spec missing — cannot generate plan or tasks' });
  }

  if (hasSpec && !hasPlan) {
    items.push({ id: 'no-plan', source: 'spec', target: 'plan', severity: 'warning', message: 'Plan missing — spec exists but no implementation plan' });
  }

  if (hasPlan && !hasTasks) {
    items.push({ id: 'no-tasks', source: 'plan', target: 'tasks', severity: 'warning', message: 'Tasks missing — plan exists but no task breakdown' });
  }

  if (hasTasks && !hasAnalysis) {
    items.push({ id: 'no-analysis', source: 'tasks', target: 'analysis', severity: 'info', message: 'Analysis not run — consider running consistency check' });
  }

  // Downstream staleness: if spec is newer than plan (approximation via updatedAt)
  if (hasSpec && hasPlan) {
    items.push({ id: 'spec-plan', source: 'spec', target: 'plan', severity: 'ok', message: 'Plan derived from spec' });
  }

  if (hasPlan && hasTasks) {
    items.push({ id: 'plan-tasks', source: 'plan', target: 'tasks', severity: 'ok', message: 'Tasks derived from plan' });
  }

  if (hasTasks && hasAnalysis) {
    items.push({ id: 'tasks-analysis', source: 'tasks', target: 'analysis', severity: 'ok', message: 'Analysis covers current tasks' });
  }

  // Constitution drift
  let constitutionDrift = false;
  if (constitution && constitution.version && feature.constitutionVersion) {
    if (feature.constitutionVersion.version !== constitution.version) {
      constitutionDrift = true;
      items.push({
        id: 'constitution-drift',
        source: 'constitution',
        target: 'feature',
        severity: 'warning',
        message: `Feature uses constitution v${feature.constitutionVersion.version}, current is v${constitution.version}`,
      });
    } else {
      items.push({
        id: 'constitution-ok',
        source: 'constitution',
        target: 'feature',
        severity: 'ok',
        message: 'Feature aligned with current constitution',
      });
    }
  } else if (constitution && !feature.constitutionVersion) {
    constitutionDrift = true;
    items.push({
      id: 'constitution-missing',
      source: 'constitution',
      target: 'feature',
      severity: 'info',
      message: 'Feature created without constitution reference',
    });
  }

  // User story / task coverage
  if (feature.userStories.length > 0 && feature.tasks.length > 0) {
    const storiesWithTasks = new Set(feature.tasks.filter(t => t.userStory).map(t => t.userStory));
    const uncoveredStories = feature.userStories.filter(us => !storiesWithTasks.has(us.id));
    if (uncoveredStories.length > 0) {
      items.push({
        id: 'uncovered-stories',
        source: 'stories',
        target: 'tasks',
        severity: 'warning',
        message: `${uncoveredStories.length} user stor${uncoveredStories.length === 1 ? 'y' : 'ies'} without tasks`,
      });
    }
  }

  return {
    items,
    pipelineStatus: {
      spec: hasSpec ? 'ok' : 'critical',
      plan: hasPlan ? (hasSpec ? 'ok' : 'warning') : (hasSpec ? 'warning' : 'info'),
      tasks: hasTasks ? 'ok' : (hasPlan ? 'warning' : 'info'),
      analysis: hasAnalysis ? 'ok' : (hasTasks ? 'info' : 'info'),
    },
    constitutionDrift,
  };
}
