/**
 * Client-side parsers for structured markdown content
 * These parsers extract structured data from plan.md, research.md, quickstart.md, and data-model.md
 */

import type {
  ParsedPlan,
  PlanMetadata,
  ConstitutionCheckItem,
  ConstitutionCheckData,
  ComplexityItem,
  ComplexityTrackingData,
  ProjectStructureItem,
  ParsedResearch,
  TechnologyDecision,
  ResearchSection,
  ParsedQuickstart,
  SetupStep,
  VerificationItem,
  QuickstartSection,
  ParsedDataModel,
  DataEntity,
  DataEnum,
  ValidationRule,
  StateTransition,
  StorageSchema,
} from '@/types';

// ============================================
// Plan.md Parser
// ============================================

/**
 * Parse plan.md metadata from header
 */
function parsePlanMetadata(content: string): PlanMetadata {
  const metadata: PlanMetadata = {};

  const branchMatch = content.match(/\*\*Branch\*\*:\s*`([^`]+)`/i);
  if (branchMatch) metadata.branch = branchMatch[1].trim();

  const dateMatch = content.match(/\*\*Date\*\*:\s*(\d{4}-\d{2}-\d{2})/i);
  if (dateMatch) metadata.date = dateMatch[1].trim();

  const specMatch = content.match(/\*\*Spec\*\*:\s*\[([^\]]+)\]\(([^)]+)\)/i);
  if (specMatch) metadata.specLink = specMatch[2].trim();

  const inputMatch = content.match(/\*\*Input\*\*:\s*([^\n]+)/i);
  if (inputMatch) metadata.input = inputMatch[1].trim();

  return metadata;
}

/**
 * Parse Constitution Check table from plan.md
 */
function parseConstitutionCheck(content: string): ConstitutionCheckData {
  const items: ConstitutionCheckItem[] = [];
  let note: string | undefined;

  const sectionMatch = content.match(/## Constitution Check\s*\n([\s\S]*?)(?=\n## |$)/i);
  if (!sectionMatch) return { items, note };

  const sectionContent = sectionMatch[1];

  // Parse table
  const tableMatch = sectionContent.match(/\|[^|]+\|[^|]+\|[^|]+\|\s*\n\|[-:| ]+\|\s*\n([\s\S]*?)(?=\n\n|\n>|\n\*\*|$)/);
  if (tableMatch) {
    const rows = tableMatch[1].trim().split('\n');
    for (const row of rows) {
      const cells = row.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length >= 3) {
        items.push({
          principle: cells[0],
          requirement: cells[1],
          status: cells[2],
        });
      }
    }
  }

  // Parse note (blockquote or text after table)
  const noteMatch = sectionContent.match(/>\s*(.+)/);
  if (noteMatch) {
    note = noteMatch[1].trim();
  }

  return { items, note };
}

/**
 * Parse Quality Gates from plan.md
 */
function parseQualityGates(content: string): string[] {
  const gates: string[] = [];

  const gatesMatch = content.match(/\*\*Quality Gates\*\*:\s*\n([\s\S]*?)(?=\n## |$)/i);
  if (!gatesMatch) return gates;

  const lines = gatesMatch[1].split('\n');
  for (const line of lines) {
    const itemMatch = line.match(/^-\s*(.+)/);
    if (itemMatch) {
      gates.push(itemMatch[1].trim());
    }
  }

  return gates;
}

/**
 * Parse Technical Context key-value pairs from plan.md
 */
function parseTechContext(content: string): Record<string, string> {
  const context: Record<string, string> = {};

  const sectionMatch = content.match(/## Technical Context\s*\n([\s\S]*?)(?=\n## |$)/i);
  if (!sectionMatch) return context;

  const kvRegex = /\*\*([^*]+)\*\*:\s*([^\n]+)/g;
  let match;
  while ((match = kvRegex.exec(sectionMatch[1])) !== null) {
    context[match[1].trim()] = match[2].trim();
  }

  return context;
}

/**
 * Parse Project Structure code blocks from plan.md
 */
function parseProjectStructure(content: string): ProjectStructureItem[] {
  const structures: ProjectStructureItem[] = [];

  const sectionMatch = content.match(/## Project Structure\s*\n([\s\S]*?)(?=\n## |$)/i);
  if (!sectionMatch) return structures;

  // Match subsections with code blocks and optional description after
  const subsectionRegex = /### ([^\n]+)\s*\n([\s\S]*?)(?=\n### |$)/g;
  let match;
  while ((match = subsectionRegex.exec(sectionMatch[1])) !== null) {
    const title = match[1].trim();
    const subsectionContent = match[2];

    // Extract code block
    const codeMatch = subsectionContent.match(/```(?:text)?\s*\n([\s\S]*?)```/);
    const codeBlock = codeMatch ? codeMatch[1].trim() : '';

    // Extract description after code block (text starting with ** or regular text)
    let description: string | undefined;
    if (codeMatch) {
      const afterCodeBlock = subsectionContent.slice(subsectionContent.indexOf('```', codeMatch.index! + 3) + 3).trim();
      if (afterCodeBlock) {
        description = afterCodeBlock;
      }
    }

    structures.push({
      title,
      codeBlock,
      description,
    });
  }

  return structures;
}

/**
 * Parse Complexity Tracking table from plan.md
 */
function parseComplexityTracking(content: string): ComplexityTrackingData {
  const items: ComplexityItem[] = [];
  let note: string | undefined;

  const sectionMatch = content.match(/## Complexity Tracking\s*\n([\s\S]*?)(?=\n## |$)/i);
  if (!sectionMatch) return { items, note };

  const sectionContent = sectionMatch[1];

  // Parse note (blockquote before table)
  const noteMatch = sectionContent.match(/>\s*(.+)/);
  if (noteMatch) {
    note = noteMatch[1].trim();
  }

  // Parse table
  const tableMatch = sectionContent.match(/\|[^|]+\|[^|]+\|[^|]+\|\s*\n\|[-:| ]+\|\s*\n([\s\S]*?)(?=\n\n|$)/);
  if (tableMatch) {
    const rows = tableMatch[1].trim().split('\n');
    for (const row of rows) {
      const cells = row.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length >= 3) {
        items.push({
          aspect: cells[0],
          decision: cells[1],
          rationale: cells[2],
        });
      }
    }
  }

  return { items, note };
}

/**
 * Parse Summary section from plan.md
 */
function parseSummary(content: string): string | undefined {
  const sectionMatch = content.match(/## Summary\s*\n([\s\S]*?)(?=\n## |$)/i);
  if (!sectionMatch) return undefined;
  return sectionMatch[1].trim();
}

/**
 * Parse other sections from plan.md that aren't specifically handled
 */
function parseOtherPlanSections(content: string): { title: string; content: string }[] {
  const sections: { title: string; content: string }[] = [];
  const knownSections = [
    'summary',
    'technical context',
    'constitution check',
    'quality gates',
    'project structure',
    'complexity tracking'
  ];

  const sectionRegex = /## ([^\n]+)\s*\n([\s\S]*?)(?=\n## |$)/g;
  let match;

  while ((match = sectionRegex.exec(content)) !== null) {
    const title = match[1].trim();
    const titleLower = title.toLowerCase();

    // Skip known sections that are already parsed
    if (!knownSections.some(known => titleLower.includes(known))) {
      sections.push({
        title,
        content: match[2].trim(),
      });
    }
  }

  return sections;
}

/**
 * Main parser for plan.md
 */
export function parsePlanContent(content: string): ParsedPlan {
  return {
    rawContent: content,
    metadata: parsePlanMetadata(content),
    summary: parseSummary(content),
    technicalContext: parseTechContext(content),
    constitutionCheck: parseConstitutionCheck(content),
    qualityGates: parseQualityGates(content),
    projectStructure: parseProjectStructure(content),
    complexityTracking: parseComplexityTracking(content),
    otherSections: parseOtherPlanSections(content),
  };
}

// ============================================
// Research.md Parser
// ============================================

/**
 * Parse Technology Decisions from research.md
 */
function parseTechnologyDecisions(content: string): TechnologyDecision[] {
  const decisions: TechnologyDecision[] = [];

  const sectionMatch = content.match(/## Technology Decisions\s*\n([\s\S]*?)(?=\n## [^#]|$)/i);
  if (!sectionMatch) return decisions;

  const decisionRegex = /### (\d+)\.\s*([^\n]+)\s*\n([\s\S]*?)(?=\n### \d+\.|$)/g;
  let match;

  while ((match = decisionRegex.exec(sectionMatch[1])) !== null) {
    const id = parseInt(match[1], 10);
    const title = match[2].trim();
    const decisionContent = match[3];

    const decisionMatch = decisionContent.match(/\*\*Decision\*\*:\s*([^\n]+)/i);
    const decision = decisionMatch ? decisionMatch[1].trim() : '';

    const rationale: string[] = [];
    const rationaleMatch = decisionContent.match(/\*\*Rationale\*\*:\s*\n([\s\S]*?)(?=\n\*\*Alternatives|$)/i);
    if (rationaleMatch) {
      const lines = rationaleMatch[1].split('\n');
      for (const line of lines) {
        const itemMatch = line.match(/^-\s*(.+)/);
        if (itemMatch) rationale.push(itemMatch[1].trim());
      }
    }

    const alternatives: { name: string; reason: string }[] = [];
    const altMatch = decisionContent.match(/\*\*Alternatives Considered\*\*:\s*\n([\s\S]*?)(?=\n### |$)/i);
    if (altMatch) {
      const lines = altMatch[1].split('\n');
      for (const line of lines) {
        const itemMatch = line.match(/^-\s*([^:]+):\s*(.+)/);
        if (itemMatch) {
          alternatives.push({
            name: itemMatch[1].trim(),
            reason: itemMatch[2].trim(),
          });
        }
      }
    }

    decisions.push({ id, title, decision, rationale, alternatives });
  }

  return decisions;
}

/**
 * Parse other sections from research.md
 */
function parseOtherResearchSections(content: string): ResearchSection[] {
  const sections: ResearchSection[] = [];

  const sectionRegex = /## ([^\n]+)\s*\n([\s\S]*?)(?=\n## |$)/g;
  let match;

  while ((match = sectionRegex.exec(content)) !== null) {
    const title = match[1].trim();
    if (title.toLowerCase() !== 'technology decisions') {
      sections.push({
        title,
        content: match[2].trim(),
      });
    }
  }

  return sections;
}

/**
 * Main parser for research.md
 */
export function parseResearchContent(content: string): ParsedResearch {
  const featureMatch = content.match(/\*\*Feature\*\*:\s*([^\n]+)/i);
  const dateMatch = content.match(/\*\*Date\*\*:\s*(\d{4}-\d{2}-\d{2})/i);

  return {
    rawContent: content,
    feature: featureMatch ? featureMatch[1].trim() : undefined,
    date: dateMatch ? dateMatch[1].trim() : undefined,
    technologyDecisions: parseTechnologyDecisions(content),
    otherSections: parseOtherResearchSections(content),
  };
}

// ============================================
// Quickstart.md Parser
// ============================================

/**
 * Parse Prerequisites from quickstart.md
 */
function parsePrerequisites(content: string): string[] {
  const prereqs: string[] = [];

  const sectionMatch = content.match(/## Prerequisites\s*\n([\s\S]*?)(?=\n## |$)/i);
  if (!sectionMatch) return prereqs;

  const lines = sectionMatch[1].split('\n');
  for (const line of lines) {
    const itemMatch = line.match(/^-\s*(.+)/);
    if (itemMatch) prereqs.push(itemMatch[1].trim());
  }

  return prereqs;
}

/**
 * Parse Setup Steps from quickstart.md
 */
function parseSetupSteps(content: string): SetupStep[] {
  const steps: SetupStep[] = [];

  const sectionMatch = content.match(/## Setup\s*\n([\s\S]*?)(?=\n## [^#]|$)/i);
  if (!sectionMatch) return steps;

  const stepRegex = /### (\d+)\.\s*([^\n]+)\s*\n([\s\S]*?)(?=\n### \d+\.|$)/g;
  let match;

  while ((match = stepRegex.exec(sectionMatch[1])) !== null) {
    const id = parseInt(match[1], 10);
    const title = match[2].trim();
    const stepContent = match[3];

    const commands: { description?: string; code: string; language?: string }[] = [];
    const codeBlockRegex = /(?:([^\n`]+)\n)?```(\w*)\n([\s\S]*?)```/g;
    let codeMatch;

    while ((codeMatch = codeBlockRegex.exec(stepContent)) !== null) {
      commands.push({
        description: codeMatch[1]?.trim() || undefined,
        language: codeMatch[2] || undefined,
        code: codeMatch[3].trim(),
      });
    }

    steps.push({ id, title, commands });
  }

  return steps;
}

/**
 * Parse Verification Checklist from quickstart.md
 */
function parseVerificationChecklist(content: string): VerificationItem[] {
  const items: VerificationItem[] = [];

  const sectionMatch = content.match(/## Verification Checklist\s*\n([\s\S]*?)(?=\n## |$)/i);
  if (!sectionMatch) return items;

  const lines = sectionMatch[1].split('\n');
  for (const line of lines) {
    const checkedMatch = line.match(/^-\s*\[([xX])\]\s*(.+)/);
    const uncheckedMatch = line.match(/^-\s*\[\s*\]\s*(.+)/);

    if (checkedMatch) {
      items.push({ text: checkedMatch[2].trim(), checked: true });
    } else if (uncheckedMatch) {
      items.push({ text: uncheckedMatch[1].trim(), checked: false });
    }
  }

  return items;
}

/**
 * Parse Key Files to Create from quickstart.md
 */
function parseKeyFilesToCreate(content: string): string[] {
  const files: string[] = [];

  const sectionMatch = content.match(/## Key Files to Create\s*\n([\s\S]*?)(?=\n## |$)/i);
  if (!sectionMatch) return files;

  const lines = sectionMatch[1].split('\n');
  for (const line of lines) {
    const itemMatch = line.match(/^\d+\.\s*`([^`]+)`/);
    if (itemMatch) files.push(itemMatch[1].trim());
  }

  return files;
}

/**
 * Parse Browser Support from quickstart.md
 */
function parseBrowserSupport(content: string): string[] {
  const browsers: string[] = [];

  const sectionMatch = content.match(/## Browser Support\s*\n([\s\S]*?)(?=\n## |$)/i);
  if (!sectionMatch) return browsers;

  const lines = sectionMatch[1].split('\n');
  for (const line of lines) {
    const itemMatch = line.match(/^-\s*(.+)/);
    if (itemMatch) browsers.push(itemMatch[1].trim());
  }

  return browsers;
}

/**
 * Parse Development Commands from quickstart.md
 */
function parseDevelopmentCommands(content: string): { title: string; command: string; description?: string }[] {
  const commands: { title: string; command: string; description?: string }[] = [];

  const sectionMatch = content.match(/## Development Commands\s*\n([\s\S]*?)(?=\n## |$)/i);
  if (!sectionMatch) return commands;

  // Parse code blocks with optional descriptions
  const cmdRegex = /(?:([^\n`]+)\n)?```(?:\w*)\n([^\n]+)\n```/g;
  let match;

  while ((match = cmdRegex.exec(sectionMatch[1])) !== null) {
    const description = match[1]?.trim();
    const command = match[2].trim();
    // Extract title from description or command
    const title = description || command.split(' ')[0];
    commands.push({ title, command, description });
  }

  return commands;
}

/**
 * Parse Project Scripts from quickstart.md
 */
function parseProjectScripts(content: string): string | undefined {
  const sectionMatch = content.match(/## Project Scripts\s*\n([\s\S]*?)(?=\n## |$)/i);
  if (!sectionMatch) return undefined;

  // Extract code block content
  const codeMatch = sectionMatch[1].match(/```(?:\w*)\n([\s\S]*?)```/);
  if (codeMatch) return codeMatch[1].trim();

  return sectionMatch[1].trim();
}

/**
 * Parse other sections from quickstart.md that aren't specifically handled
 */
function parseOtherQuickstartSections(content: string): QuickstartSection[] {
  const sections: QuickstartSection[] = [];
  const knownSections = [
    'prerequisites',
    'setup',
    'verification checklist',
    'key files to create',
    'browser support',
    'development commands',
    'project scripts'
  ];

  const sectionRegex = /## ([^\n]+)\s*\n([\s\S]*?)(?=\n## |$)/g;
  let match;

  while ((match = sectionRegex.exec(content)) !== null) {
    const title = match[1].trim();
    const titleLower = title.toLowerCase();

    // Skip known sections that are already parsed
    if (!knownSections.some(known => titleLower.includes(known))) {
      sections.push({
        title,
        content: match[2].trim(),
      });
    }
  }

  return sections;
}

/**
 * Main parser for quickstart.md
 */
export function parseQuickstartContent(content: string): ParsedQuickstart {
  const featureMatch = content.match(/\*\*Feature\*\*:\s*([^\n]+)/i);
  const dateMatch = content.match(/\*\*Date\*\*:\s*(\d{4}-\d{2}-\d{2})/i);

  return {
    rawContent: content,
    feature: featureMatch ? featureMatch[1].trim() : undefined,
    date: dateMatch ? dateMatch[1].trim() : undefined,
    prerequisites: parsePrerequisites(content),
    setupSteps: parseSetupSteps(content),
    developmentCommands: parseDevelopmentCommands(content),
    projectScripts: parseProjectScripts(content),
    verificationChecklist: parseVerificationChecklist(content),
    keyFilesToCreate: parseKeyFilesToCreate(content),
    browserSupport: parseBrowserSupport(content),
    otherSections: parseOtherQuickstartSections(content),
  };
}

// ============================================
// Data-model.md Parser
// ============================================

/**
 * Parse Entities from data-model.md
 */
function parseEntities(content: string): DataEntity[] {
  const entities: DataEntity[] = [];

  const sectionMatch = content.match(/## Entities\s*\n([\s\S]*?)(?=\n## [^#]|$)/i);
  if (!sectionMatch) return entities;

  const entityRegex = /### ([^\n]+)\s*\n([\s\S]*?)(?=\n### |$)/g;
  let match;

  while ((match = entityRegex.exec(sectionMatch[1])) !== null) {
    const name = match[1].trim();
    const entityContent = match[2];

    // Skip enum sections
    if (name.toLowerCase().includes('enum')) continue;

    // Extract description (first paragraph before code block)
    const descMatch = entityContent.match(/^([^\n`]+)/);
    const description = descMatch ? descMatch[1].trim() : undefined;

    // Extract code block
    const codeMatch = entityContent.match(/```typescript\s*\n([\s\S]*?)```/);
    const codeBlock = codeMatch ? codeMatch[1].trim() : undefined;

    entities.push({
      name,
      description,
      properties: [],
      codeBlock,
    });
  }

  return entities;
}

/**
 * Parse Enums from data-model.md
 */
function parseEnums(content: string): DataEnum[] {
  const enums: DataEnum[] = [];

  // Match ### sections that contain "Enum" in the title
  const enumRegex = /### ([^\n]*(?:Enum)[^\n]*)\s*\n([\s\S]*?)(?=\n### |$)/gi;
  let match;

  while ((match = enumRegex.exec(content)) !== null) {
    const name = match[1].trim().replace(/\s*\(Enum\)/i, '');
    const enumContent = match[2];

    // Extract code block
    const codeMatch = enumContent.match(/```typescript\s*\n([\s\S]*?)```/);
    const codeBlock = codeMatch ? codeMatch[1].trim() : undefined;

    enums.push({
      name,
      values: [],
      codeBlock,
    });
  }

  return enums;
}

/**
 * Parse Validation Rules from data-model.md
 */
function parseValidationRules(content: string): ValidationRule[] {
  const rules: ValidationRule[] = [];

  const sectionMatch = content.match(/## Validation Rules\s*\n([\s\S]*?)(?=\n## |$)/i);
  if (!sectionMatch) return rules;

  const fieldRegex = /### ([^\n]+)\s*\n([\s\S]*?)(?=\n### |$)/g;
  let match;

  while ((match = fieldRegex.exec(sectionMatch[1])) !== null) {
    const field = match[1].trim();
    const fieldContent = match[2];
    const fieldRules: string[] = [];

    const lines = fieldContent.split('\n');
    for (const line of lines) {
      const itemMatch = line.match(/^-\s*(.+)/);
      if (itemMatch) fieldRules.push(itemMatch[1].trim());
    }

    if (fieldRules.length > 0) {
      rules.push({ field, rules: fieldRules });
    }
  }

  return rules;
}

/**
 * Parse State Transitions from data-model.md
 */
function parseStateTransitions(content: string): StateTransition[] {
  const transitions: StateTransition[] = [];

  const sectionMatch = content.match(/## State Transitions\s*\n([\s\S]*?)(?=\n## |$)/i);
  if (!sectionMatch) return transitions;

  // Parse table
  const tableMatch = sectionMatch[1].match(/\|[^|]+\|[^|]+\|[^|]+\|\s*\n\|[-:| ]+\|\s*\n([\s\S]*?)(?=\n\n|$)/);
  if (!tableMatch) return transitions;

  const rows = tableMatch[1].trim().split('\n');
  for (const row of rows) {
    const cells = row.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length >= 3) {
      transitions.push({
        state: cells[0],
        condition: cells[1],
        transitionsTo: cells[2].split(',').map(t => t.trim()),
      });
    }
  }

  return transitions;
}

/**
 * Parse localStorage Schema from data-model.md
 */
function parseStorageSchema(content: string): StorageSchema[] {
  const schema: StorageSchema[] = [];

  const sectionMatch = content.match(/## localStorage Schema\s*\n([\s\S]*?)(?=\n## |$)/i);
  if (!sectionMatch) return schema;

  // Parse table
  const tableMatch = sectionMatch[1].match(/\|[^|]+\|[^|]+\|[^|]+\|\s*\n\|[-:| ]+\|\s*\n([\s\S]*?)(?=\n\n|\n###|$)/);
  if (!tableMatch) return schema;

  const rows = tableMatch[1].trim().split('\n');
  for (const row of rows) {
    const cells = row.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length >= 3) {
      schema.push({
        key: cells[0].replace(/`/g, ''),
        type: cells[1].replace(/`/g, ''),
        description: cells[2],
      });
    }
  }

  return schema;
}

/**
 * Parse Sorting Behavior from data-model.md
 */
function parseSortingBehavior(content: string): { option: string; description: string }[] {
  const behaviors: { option: string; description: string }[] = [];

  const sectionMatch = content.match(/## Sorting Behavior\s*\n([\s\S]*?)(?=\n## |$)/i);
  if (!sectionMatch) return behaviors;

  const optionRegex = /### By ([^\n]+)\s*\n([\s\S]*?)(?=\n### |$)/g;
  let match;

  while ((match = optionRegex.exec(sectionMatch[1])) !== null) {
    behaviors.push({
      option: match[1].trim(),
      description: match[2].trim(),
    });
  }

  return behaviors;
}

/**
 * Parse Filtering Behavior from data-model.md
 */
function parseFilteringBehavior(content: string): { filter: string; condition: string }[] {
  const filters: { filter: string; condition: string }[] = [];

  const sectionMatch = content.match(/## Filtering Behavior\s*\n([\s\S]*?)(?=\n## |$)/i);
  if (!sectionMatch) return filters;

  // Parse table
  const tableMatch = sectionMatch[1].match(/\|[^|]+\|[^|]+\|\s*\n\|[-:| ]+\|\s*\n([\s\S]*?)(?=\n\n|$)/);
  if (!tableMatch) return filters;

  const rows = tableMatch[1].trim().split('\n');
  for (const row of rows) {
    const cells = row.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length >= 2) {
      filters.push({
        filter: cells[0],
        condition: cells[1],
      });
    }
  }

  return filters;
}

/**
 * Parse Search Behavior from data-model.md
 */
function parseSearchBehavior(content: string): string[] {
  const behaviors: string[] = [];

  const sectionMatch = content.match(/## Search Behavior\s*\n([\s\S]*?)(?=\n## |$)/i);
  if (!sectionMatch) return behaviors;

  const lines = sectionMatch[1].split('\n');
  for (const line of lines) {
    const itemMatch = line.match(/^-\s*(.+)/);
    if (itemMatch) behaviors.push(itemMatch[1].trim());
  }

  return behaviors;
}

/**
 * Parse Data Integrity from data-model.md
 */
function parseDataIntegrity(content: string): { title: string; items: string[] }[] {
  const rules: { title: string; items: string[] }[] = [];

  const sectionMatch = content.match(/## Data Integrity\s*\n([\s\S]*?)(?=\n## |$)/i);
  if (!sectionMatch) return rules;

  const subsectionRegex = /### ([^\n]+)\s*\n([\s\S]*?)(?=\n### |$)/g;
  let match;

  while ((match = subsectionRegex.exec(sectionMatch[1])) !== null) {
    const title = match[1].trim();
    const subsectionContent = match[2];
    const items: string[] = [];

    const lines = subsectionContent.split('\n');
    for (const line of lines) {
      const itemMatch = line.match(/^-\s*(.+)/);
      if (itemMatch) items.push(itemMatch[1].trim());
    }

    if (items.length > 0) {
      rules.push({ title, items });
    }
  }

  return rules;
}

/**
 * Main parser for data-model.md
 */
export function parseDataModelContent(content: string): ParsedDataModel {
  const featureMatch = content.match(/\*\*Feature\*\*:\s*([^\n]+)/i);
  const dateMatch = content.match(/\*\*Date\*\*:\s*(\d{4}-\d{2}-\d{2})/i);

  return {
    rawContent: content,
    feature: featureMatch ? featureMatch[1].trim() : undefined,
    date: dateMatch ? dateMatch[1].trim() : undefined,
    entities: parseEntities(content),
    enums: parseEnums(content),
    validationRules: parseValidationRules(content),
    stateTransitions: parseStateTransitions(content),
    storageSchema: parseStorageSchema(content),
    sortingBehavior: parseSortingBehavior(content),
    filteringBehavior: parseFilteringBehavior(content),
    searchBehavior: parseSearchBehavior(content),
    dataIntegrity: parseDataIntegrity(content),
  };
}
