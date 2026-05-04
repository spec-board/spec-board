import type { StructuredSpec } from './types';

export const SPEC_TEMPLATE_SECTIONS = [
  'problemStatement',
  'userStories',
  'functionalRequirements',
  'nonFunctionalRequirements',
  'edgeCases',
  'dataModel',
  'apiContracts',
  'successCriteria',
] as const;

export function validateSpecCompleteness(spec: StructuredSpec): {
  complete: boolean;
  missing: string[];
  score: number;
} {
  const checks: { section: string; filled: boolean }[] = [
    { section: 'problemStatement', filled: !!spec.problemStatement?.trim() },
    { section: 'userStories', filled: (spec.userStories?.length ?? 0) > 0 },
    { section: 'functionalRequirements', filled: (spec.functionalRequirements?.length ?? 0) > 0 },
    { section: 'nonFunctionalRequirements', filled: (spec.nonFunctionalRequirements?.length ?? 0) > 0 },
    { section: 'edgeCases', filled: (spec.edgeCases?.length ?? 0) > 0 },
    { section: 'dataModel', filled: !!spec.dataModel?.trim() },
    { section: 'apiContracts', filled: !!spec.apiContracts?.trim() },
    { section: 'successCriteria', filled: (spec.successCriteria?.length ?? 0) > 0 },
  ];

  const missing = checks.filter(c => !c.filled).map(c => c.section);
  const score = Math.round((checks.filter(c => c.filled).length / checks.length) * 100);

  return { complete: missing.length === 0, missing, score };
}
