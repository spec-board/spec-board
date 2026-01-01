/**
 * AST-based quickstart.md parser
 *
 * This is a proof-of-concept showing how AST-based parsing is cleaner
 * and more maintainable than regex-based parsing.
 */

import {
  extractSections,
  findSection,
  getSubsections,
  extractCodeBlocks,
  extractSimpleList,
  extractListItems,
  extractText,
  extractIntroText,
  extractMetadataValue,
  type Section,
  type CodeBlock,
} from './ast-utils'

import type {
  ParsedQuickstart,
  SetupStep,
  VerificationItem,
  VerificationData,
  KeyFilesData,
  BrowserSupportData,
  BrowserSupportSubsection,
  QuickstartSection,
  DevelopmentSection,
  DevelopmentSubsection,
  QuickstartSectionOrder,
  QuickstartSectionType,
} from '@/types'

// ============================================
// Main Parser
// ============================================

/**
 * Parse quickstart.md content using AST-based approach
 */
export function parseQuickstartAST(content: string): ParsedQuickstart {
  const sections = extractSections(content)

  // Extract section titles from markdown
  const sectionTitles = extractSectionTitles(sections)

  // Parse other sections first so we can reference them in sectionOrder
  const otherSections = parseOtherSections(sections)

  // Extract section order from markdown
  const sectionOrder = extractSectionOrder(sections, otherSections)

  return {
    rawContent: content,
    feature: extractMetadataValue(content, 'Feature'),
    date: extractMetadataValue(content, 'Date'),
    sectionOrder,
    sectionTitles,
    prerequisites: parsePrerequisites(sections),
    setupSteps: parseSetupSteps(sections),
    development: parseDevelopment(sections),
    developmentCommands: parseDevelopmentCommands(sections),
    projectScripts: parseProjectScripts(sections),
    verificationChecklist: parseVerificationChecklist(sections),
    keyFilesToCreate: parseKeyFilesToCreate(sections),
    browserSupport: parseBrowserSupport(sections),
    otherSections,
  }
}

// ============================================
// Section Title Extraction
// ============================================

function extractSectionTitles(sections: Section[]): ParsedQuickstart['sectionTitles'] {
  return {
    prerequisites: findSection(sections, 'Prerequisites')?.title,
    setupSteps: findSection(sections, 'Setup')?.title,
    verification: findSection(sections, 'Verification')?.title,
    keyFiles: findSection(sections, 'Key Files')?.title,
    browserSupport: findSection(sections, 'Browser Support')?.title,
    developmentCommands: findSection(sections, 'Development Commands')?.title,
    development: sections.find(s => {
      const titleLower = s.title.toLowerCase()
      return titleLower === 'development' ||
             (titleLower.includes('development') && !titleLower.includes('commands'))
    })?.title,
    projectScripts: findSection(sections, 'Project Scripts')?.title,
  }
}

// ============================================
// Section Order Extraction
// ============================================

/**
 * Map section title to its type for ordering
 */
function getSectionType(title: string): QuickstartSectionType {
  const titleLower = title.toLowerCase()

  if (titleLower.includes('prerequisites')) return 'prerequisites'
  if (titleLower.includes('setup')) return 'setupSteps'
  if (titleLower.includes('verification')) return 'verification'
  if (titleLower.includes('key files')) return 'keyFiles'
  if (titleLower.includes('browser support')) return 'browserSupport'
  if (titleLower.includes('development commands')) return 'developmentCommands'
  if (titleLower.includes('project scripts')) return 'projectScripts'
  if (titleLower === 'development' ||
      (titleLower.includes('development') && !titleLower.includes('commands'))) {
    return 'development'
  }

  return 'other'
}

/**
 * Extract section order from markdown to preserve original ordering
 */
function extractSectionOrder(sections: Section[], otherSections: QuickstartSection[]): QuickstartSectionOrder[] {
  const order: QuickstartSectionOrder[] = []
  let otherIndex = 0

  // Only process top-level sections (depth === 2, i.e., ## headings)
  for (const section of sections.filter(s => s.depth === 2)) {
    const type = getSectionType(section.title)

    if (type === 'other') {
      // Find the matching index in otherSections
      const matchIndex = otherSections.findIndex((os, idx) =>
        idx >= otherIndex && os.title === section.title
      )
      if (matchIndex !== -1) {
        order.push({ type: 'other', title: section.title, otherIndex: matchIndex })
        otherIndex = matchIndex + 1
      }
    } else {
      order.push({ type, title: section.title })
    }
  }

  return order
}

// ============================================
// Section Parsers
// ============================================

function parsePrerequisites(sections: Section[]): string[] {
  const section = findSection(sections, 'Prerequisites')
  if (!section) return []
  return extractSimpleList(section.children)
}

function parseSetupSteps(sections: Section[]): SetupStep[] {
  const section = findSection(sections, 'Setup')
  if (!section) return []

  const subsections = getSubsections(section, sections)
  const steps: SetupStep[] = []

  for (const sub of subsections) {
    // Extract step number from title (e.g., "1. Install Dependencies")
    const match = sub.title.match(/^(\d+)\.\s*(.+)/)
    if (!match) continue

    const codeBlocks = extractCodeBlocks(sub.children)
    const commands = codeBlocks.map(block => ({
      description: undefined,  // Could extract from preceding paragraph
      code: block.code,
      language: block.language,
    }))

    steps.push({
      id: parseInt(match[1], 10),
      title: match[2].trim(),
      commands,
    })
  }

  return steps
}

function parseDevelopment(sections: Section[]): DevelopmentSection | undefined {
  // Find "Development" but not "Development Commands"
  const section = sections.find(s => {
    const titleLower = s.title.toLowerCase()
    return titleLower === 'development' ||
           (titleLower.includes('development') && !titleLower.includes('commands'))
  })

  if (!section) return undefined

  const subsections = getSubsections(section, sections)
  const intro = extractIntroText(section.children)
  const topLevelCodeBlocks = extractCodeBlocks(section.children)

  const parsedSubsections: DevelopmentSubsection[] = subsections.map(sub => ({
    title: sub.title,
    content: extractText(sub.children),
    codeBlocks: extractCodeBlocks(sub.children).map(cb => ({
      language: cb.language,
      code: cb.code,
    })),
  }))

  return {
    intro,
    subsections: parsedSubsections,
    codeBlocks: topLevelCodeBlocks.map(cb => ({
      language: cb.language,
      code: cb.code,
    })),
  }
}

function parseDevelopmentCommands(sections: Section[]): { title: string; command: string; description?: string }[] {
  const section = findSection(sections, 'Development Commands')
  if (!section) return []

  const codeBlocks = extractCodeBlocks(section.children)
  return codeBlocks.map(block => ({
    title: block.language || block.code.split(' ')[0],
    command: block.code,
    description: undefined,
  }))
}

function parseProjectScripts(sections: Section[]): { title: string; content: string } | undefined {
  const section = findSection(sections, 'Project Scripts')
  if (!section) return undefined

  const codeBlocks = extractCodeBlocks(section.children)
  const content = codeBlocks.length > 0
    ? codeBlocks[0].code
    : extractText(section.children)

  if (!content) return undefined

  return {
    title: section.title,
    content,
  }
}

function parseVerificationChecklist(sections: Section[]): VerificationData {
  const section = findSection(sections, 'Verification')
  if (!section) return { items: [] }

  const intro = extractIntroText(section.children)
  const listItems = extractListItems(section.children)
  const items = listItems.map(item => ({
    text: item.text.replace(/^\[[ xX]\]\s*/, ''),  // Remove checkbox syntax
    checked: item.checked ?? item.text.match(/^\[[xX]\]/) !== null,
  }))

  return { intro, items }
}

function parseKeyFilesToCreate(sections: Section[]): KeyFilesData {
  const section = findSection(sections, 'Key Files')
  if (!section) return { files: [] }

  const intro = extractIntroText(section.children)
  const listItems = extractSimpleList(section.children)
  // Extract file paths from backticks if present
  const files = listItems.map(item => {
    const match = item.match(/`([^`]+)`/)
    return match ? match[1] : item
  })

  return { intro, files }
}

function parseBrowserSupport(sections: Section[]): BrowserSupportData {
  const section = findSection(sections, 'Browser Support')
  if (!section) return { subsections: [] }

  // Parse subsections by looking for paragraphs followed by lists
  const subsections: BrowserSupportSubsection[] = []
  let currentIntro: string | undefined

  for (const child of section.children) {
    if (child.type === 'paragraph') {
      // This is an intro for the next list
      currentIntro = extractText([child])
    } else if (child.type === 'list' && currentIntro) {
      const items = extractSimpleList([child])
      subsections.push({
        intro: currentIntro,
        items,
      })
      currentIntro = undefined
    }
  }

  // If there's no structured subsections, fall back to simple list
  if (subsections.length === 0) {
    const items = extractSimpleList(section.children)
    if (items.length > 0) {
      subsections.push({
        intro: '',
        items,
      })
    }
  }

  return { subsections }
}

// Known sections that have dedicated parsers
const KNOWN_SECTIONS = [
  'prerequisites',
  'setup',
  'verification',
  'key files',
  'browser support',
  'development commands',
  'development',
  'project scripts',
]

function parseOtherSections(sections: Section[]): QuickstartSection[] {
  return sections
    .filter(s => s.depth === 2)  // Only top-level sections
    .filter(s => !KNOWN_SECTIONS.some(known =>
      s.title.toLowerCase().includes(known)
    ))
    .map(s => ({
      title: s.title,
      content: extractText(s.children),
    }))
}
