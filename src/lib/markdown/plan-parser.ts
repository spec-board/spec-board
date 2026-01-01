/**
 * AST-based plan.md parser
 */

import {
  extractSections,
  findSection,
  getSubsections,
  extractCodeBlocks,
  extractTables,
  extractText,
  extractFullText,
  extractBlockquote,
  extractMetadataValue,
  type Section,
} from './ast-utils'

import type {
  ParsedPlan,
  PlanMetadata,
  ConstitutionCheckItem,
  ConstitutionCheckData,
  ComplexityItem,
  ComplexityTrackingData,
  ProjectStructureItem,
  PlanSection,
} from '@/types'

// ============================================
// Main Parser
// ============================================

/**
 * Parse plan.md content using AST-based approach
 */
export function parsePlanAST(content: string): ParsedPlan {
  const sections = extractSections(content)

  return {
    rawContent: content,
    metadata: parseMetadata(content),
    summary: parseSummary(sections),
    technicalContext: parseTechnicalContext(sections),
    constitutionCheck: parseConstitutionCheck(sections),
    qualityGates: parseQualityGates(content),
    projectStructure: parseProjectStructure(sections),
    complexityTracking: parseComplexityTracking(sections),
    otherSections: parseOtherSections(sections),
  }
}

// ============================================
// Section Parsers
// ============================================

function parseMetadata(content: string): PlanMetadata {
  const metadata: PlanMetadata = {}

  // Branch is in backticks: **Branch**: `feature/xyz`
  const branchMatch = content.match(/\*\*Branch\*\*:\s*`([^`]+)`/i)
  if (branchMatch) metadata.branch = branchMatch[1].trim()

  metadata.date = extractMetadataValue(content, 'Date')

  // Spec link: **Spec**: [text](url)
  const specMatch = content.match(/\*\*Spec\*\*:\s*\[([^\]]+)\]\(([^)]+)\)/i)
  if (specMatch) metadata.specLink = specMatch[2].trim()

  metadata.input = extractMetadataValue(content, 'Input')

  return metadata
}

function parseSummary(sections: Section[]): string | undefined {
  const section = findSection(sections, 'Summary')
  if (!section) return undefined
  return extractText(section.children) || undefined
}

function parseTechnicalContext(sections: Section[]): Record<string, string> {
  const section = findSection(sections, 'Technical Context')
  if (!section) return {}

  const context: Record<string, string> = {}

  // Use raw content to preserve markdown formatting for regex matching
  // Extract text from paragraphs and look for Key: Value patterns
  for (const node of section.children) {
    if (node.type === 'paragraph') {
      // Get raw text with markdown preserved
      const text = extractText([node])
      // After toString(), **Key** becomes just "Key"
      const kvRegex = /([^:]+):\s*(.+)/g
      let match
      while ((match = kvRegex.exec(text)) !== null) {
        context[match[1].trim()] = match[2].trim()
      }
    }
  }

  return context
}

function parseConstitutionCheck(sections: Section[]): ConstitutionCheckData {
  const section = findSection(sections, 'Constitution Check')
  if (!section) return { items: [], note: undefined }

  const tables = extractTables(section.children)
  const items: ConstitutionCheckItem[] = []

  if (tables.length > 0) {
    const table = tables[0]
    for (const row of table.rows) {
      if (row.length >= 3) {
        items.push({
          principle: row[0],
          requirement: row[1],
          status: row[2],
        })
      }
    }
  }

  // Extract note from blockquote
  const note = extractBlockquote(section.children)

  return { items, note }
}

function parseQualityGates(content: string): string[] {
  // Quality Gates is usually a list after **Quality Gates**:
  const match = content.match(/\*\*Quality Gates\*\*:\s*\n([\s\S]*?)(?=\n## |$)/i)
  if (!match) return []

  const gates: string[] = []
  const lines = match[1].split('\n')
  for (const line of lines) {
    const itemMatch = line.match(/^-\s*(.+)/)
    if (itemMatch) {
      gates.push(itemMatch[1].trim())
    }
  }

  return gates
}

function parseProjectStructure(sections: Section[]): ProjectStructureItem[] {
  const section = findSection(sections, 'Project Structure')
  if (!section) return []

  const subsections = getSubsections(section, sections)
  const structures: ProjectStructureItem[] = []

  for (const sub of subsections) {
    const codeBlocks = extractCodeBlocks(sub.children)
    const codeBlock = codeBlocks.length > 0 ? codeBlocks[0].code : ''

    // Get description (text after code block)
    const text = extractText(sub.children)
    const description = text || undefined

    structures.push({
      title: sub.title,
      codeBlock,
      description,
    })
  }

  return structures
}

function parseComplexityTracking(sections: Section[]): ComplexityTrackingData {
  const section = findSection(sections, 'Complexity Tracking')
  if (!section) return { items: [], note: undefined }

  const tables = extractTables(section.children)
  const items: ComplexityItem[] = []

  if (tables.length > 0) {
    const table = tables[0]
    for (const row of table.rows) {
      if (row.length >= 3) {
        items.push({
          aspect: row[0],
          decision: row[1],
          rationale: row[2],
        })
      }
    }
  }

  // Extract note from blockquote
  const note = extractBlockquote(section.children)

  return { items, note }
}

// Known sections that have dedicated parsers
const KNOWN_SECTIONS = [
  'summary',
  'technical context',
  'constitution check',
  'quality gates',
  'project structure',
  'complexity tracking',
]

function parseOtherSections(sections: Section[]): PlanSection[] {
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
