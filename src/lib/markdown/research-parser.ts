/**
 * AST-based research.md parser
 */

import {
  extractSections,
  findSection,
  getSubsections,
  extractSimpleList,
  extractText,
  extractFullText,
  extractMetadataValue,
  type Section,
} from './ast-utils'

import type {
  ParsedResearch,
  TechnologyDecision,
  ResearchSection,
} from '@/types'

import type { Content } from 'mdast'

// ============================================
// Main Parser
// ============================================

/**
 * Parse research.md content using AST-based approach
 */
export function parseResearchAST(content: string): ParsedResearch {
  const sections = extractSections(content)

  return {
    rawContent: content,
    feature: extractMetadataValue(content, 'Feature'),
    date: extractMetadataValue(content, 'Date'),
    technologyDecisions: parseTechnologyDecisions(sections),
    otherSections: parseOtherSections(sections),
  }
}

// ============================================
// Section Parsers
// ============================================

function parseTechnologyDecisions(sections: Section[]): TechnologyDecision[] {
  const section = findSection(sections, 'Technology Decisions')
  if (!section) return []

  const subsections = getSubsections(section, sections)
  const decisions: TechnologyDecision[] = []

  for (const sub of subsections) {
    // Extract decision number from title (e.g., "1. State Management")
    const match = sub.title.match(/^(\d+)\.\s*(.+)/)
    if (!match) continue

    const id = parseInt(match[1], 10)
    const title = match[2].trim()

    // Parse decision, rationale, and alternatives from children
    const { decision, rationale, alternatives } = parseDecisionContent(sub.children)

    decisions.push({ id, title, decision, rationale, alternatives })
  }

  return decisions
}

function parseDecisionContent(children: Content[]): {
  decision: string
  rationale: string[]
  alternatives: { name: string; reason: string }[]
} {
  let decision = ''
  let rationale: string[] = []
  let alternatives: { name: string; reason: string }[] = []

  let currentSection: 'none' | 'rationale' | 'alternatives' = 'none'

  for (let i = 0; i < children.length; i++) {
    const node = children[i]

    if (node.type === 'paragraph') {
      const text = extractText([node])

      // Check for Decision: value
      const decisionMatch = text.match(/Decision:\s*(.+)/)
      if (decisionMatch) {
        decision = decisionMatch[1].trim()
        currentSection = 'none'
        continue
      }

      // Check for Rationale: label
      if (text.match(/Rationale:/i)) {
        currentSection = 'rationale'
        continue
      }

      // Check for Alternatives Considered: label
      if (text.match(/Alternatives Considered:/i)) {
        currentSection = 'alternatives'
        continue
      }
    }

    // Extract list items based on current section
    if (node.type === 'list') {
      const items = extractSimpleList([node])

      if (currentSection === 'rationale') {
        rationale = items
        currentSection = 'none'
      } else if (currentSection === 'alternatives') {
        alternatives = items.map(item => {
          const altMatch = item.match(/^([^:]+):\s*(.+)/)
          if (altMatch) {
            return { name: altMatch[1].trim(), reason: altMatch[2].trim() }
          }
          return { name: item, reason: '' }
        })
        currentSection = 'none'
      }
    }
  }

  return { decision, rationale, alternatives }
}

// Known sections that have dedicated parsers
const KNOWN_SECTIONS = ['technology decisions']

function parseOtherSections(sections: Section[]): ResearchSection[] {
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
