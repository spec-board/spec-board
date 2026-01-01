/**
 * AST-based data-model.md parser
 */

import {
  extractSections,
  findSection,
  getSubsections,
  extractCodeBlocks,
  extractSimpleList,
  extractTables,
  extractText,
  extractFullText,
  extractMetadataValue,
  type Section,
} from './ast-utils'

import type {
  ParsedDataModel,
  DataEntity,
  DataEnum,
  ValidationRule,
  StateTransitionsData,
  StateTransitionSubsection,
  StateTransition,
  StorageSchemaData,
  StorageSchemaSubsection,
  StorageSchemaKey,
  DataIntegrityRule,
  DataModelSection,
} from '@/types'

// ============================================
// Main Parser
// ============================================

/**
 * Parse data-model.md content using AST-based approach
 */
export function parseDataModelAST(content: string): ParsedDataModel {
  const sections = extractSections(content)

  return {
    rawContent: content,
    feature: extractMetadataValue(content, 'Feature'),
    date: extractMetadataValue(content, 'Date'),
    entities: parseEntities(sections),
    enums: parseEnums(sections),
    validationRules: parseValidationRules(sections),
    stateTransitions: parseStateTransitions(sections),
    storageSchema: parseStorageSchema(sections),
    sortingBehavior: parseSortingBehavior(sections),
    filteringBehavior: parseFilteringBehavior(sections),
    searchBehavior: parseSearchBehavior(sections),
    dataIntegrity: parseDataIntegrity(sections),
    otherSections: parseOtherSections(sections),
  }
}

// ============================================
// Section Parsers
// ============================================

function parseEntities(sections: Section[]): DataEntity[] {
  const section = findSection(sections, 'Entities')
  if (!section) return []

  const subsections = getSubsections(section, sections)
  const entities: DataEntity[] = []

  for (const sub of subsections) {
    const codeBlocks = extractCodeBlocks(sub.children)
    const codeBlock = codeBlocks.length > 0 ? codeBlocks[0].code : undefined
    const text = extractText(sub.children)

    // Extract description (text before code block)
    const description = text.split('```')[0].trim() || undefined

    entities.push({
      name: sub.title,
      description,
      properties: [], // Properties are typically in the code block
      codeBlock,
    })
  }

  return entities
}

function parseEnums(sections: Section[]): DataEnum[] {
  const section = findSection(sections, 'Enums')
  if (!section) return []

  const subsections = getSubsections(section, sections)
  const enums: DataEnum[] = []

  for (const sub of subsections) {
    const codeBlocks = extractCodeBlocks(sub.children)
    const codeBlock = codeBlocks.length > 0 ? codeBlocks[0].code : undefined

    enums.push({
      name: sub.title,
      values: [], // Values are typically in the code block
      codeBlock,
    })
  }

  return enums
}

function parseValidationRules(sections: Section[]): ValidationRule[] {
  const section = findSection(sections, 'Validation Rules')
  if (!section) return []

  const subsections = getSubsections(section, sections)
  const rules: ValidationRule[] = []

  for (const sub of subsections) {
    const items = extractSimpleList(sub.children)
    if (items.length > 0) {
      rules.push({
        field: sub.title,
        rules: items,
      })
    }
  }

  return rules
}

function parseStateTransitions(sections: Section[]): StateTransitionsData {
  const section = findSection(sections, 'State Transitions')
  if (!section) return { subsections: [] }

  const subsections = getSubsections(section, sections)
  const result: StateTransitionSubsection[] = []

  for (const sub of subsections) {
    const codeBlocks = extractCodeBlocks(sub.children)
    const codeBlock = codeBlocks.length > 0 ? codeBlocks[0].code : undefined

    const tables = extractTables(sub.children)
    let transitions: StateTransition[] | undefined

    if (tables.length > 0) {
      const table = tables[0]
      transitions = table.rows.map(row => ({
        state: row[0] || '',
        condition: row[1] || '',
        transitionsTo: (row[2] || '').split(',').map(t => t.trim()),
      }))
    }

    // Get description (text that's not in code block or table)
    const text = extractText(sub.children)
    const description = text.trim() || undefined

    result.push({
      title: sub.title,
      codeBlock,
      description,
      transitions: transitions && transitions.length > 0 ? transitions : undefined,
    })
  }

  return { subsections: result }
}

function parseStorageSchema(sections: Section[]): StorageSchemaData {
  const section = findSection(sections, 'localStorage Schema') ||
                  findSection(sections, 'Storage Schema')
  if (!section) return { subsections: [] }

  const subsections = getSubsections(section, sections)
  const result: StorageSchemaSubsection[] = []
  let note: string | undefined

  for (const sub of subsections) {
    const codeBlocks = extractCodeBlocks(sub.children)
    const codeBlock = codeBlocks.length > 0 ? codeBlocks[0].code : undefined

    const tables = extractTables(sub.children)
    let keys: StorageSchemaKey[] | undefined

    if (tables.length > 0) {
      const table = tables[0]
      keys = table.rows.map(row => ({
        key: (row[0] || '').replace(/`/g, ''),
        type: (row[1] || '').replace(/`/g, ''),
        description: row[2] || '',
      }))
    }

    // Check for note in this subsection's text
    const text = extractText(sub.children)
    const noteMatch = text.match(/Note:\s*([^\n]+)/i)
    if (noteMatch) {
      note = noteMatch[1].trim()
    }

    result.push({
      title: sub.title,
      keys: keys && keys.length > 0 ? keys : undefined,
      codeBlock,
    })
  }

  // Also check section-level text for note
  if (!note) {
    const text = extractText(section.children)
    const noteMatch = text.match(/Note:\s*([^\n]+)/i)
    if (noteMatch) {
      note = noteMatch[1].trim()
    }
  }

  return { subsections: result, note }
}

function parseSortingBehavior(sections: Section[]): { option: string; description: string }[] {
  const section = findSection(sections, 'Sorting Behavior')
  if (!section) return []

  const subsections = getSubsections(section, sections)
  return subsections.map(sub => {
    // Title format: "By Date" -> option: "Date"
    const option = sub.title.replace(/^By\s+/i, '')
    const description = extractText(sub.children)

    return { option, description }
  })
}

function parseFilteringBehavior(sections: Section[]): { filter: string; condition: string }[] {
  const section = findSection(sections, 'Filtering Behavior')
  if (!section) return []

  const tables = extractTables(section.children)
  if (tables.length === 0) return []

  const table = tables[0]
  return table.rows.map(row => ({
    filter: row[0] || '',
    condition: row[1] || '',
  }))
}

function parseSearchBehavior(sections: Section[]): string[] {
  const section = findSection(sections, 'Search Behavior')
  if (!section) return []
  return extractSimpleList(section.children)
}

function parseDataIntegrity(sections: Section[]): DataIntegrityRule[] {
  const section = findSection(sections, 'Data Integrity')
  if (!section) return []

  const subsections = getSubsections(section, sections)
  return subsections.map(sub => ({
    title: sub.title,
    items: extractSimpleList(sub.children),
  }))
}

// Known sections that have dedicated parsers
const KNOWN_SECTIONS = [
  'entities',
  'enums',
  'validation rules',
  'state transitions',
  'localstorage schema',
  'storage schema',
  'sorting behavior',
  'filtering behavior',
  'search behavior',
  'data integrity',
]

function parseOtherSections(sections: Section[]): DataModelSection[] {
  return sections
    .filter(s => s.depth === 2)
    .filter(s => !KNOWN_SECTIONS.some(known =>
      s.title.toLowerCase().includes(known)
    ))
    .map(s => ({
      title: s.title,
      content: extractFullText(s.children),
    }))
}
