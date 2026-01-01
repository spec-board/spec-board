/**
 * AST-based markdown parsing utilities using unified/remark
 *
 * This module provides a cleaner, more maintainable approach to parsing
 * structured markdown files compared to regex-based parsing.
 */

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import { visit } from 'unist-util-visit'
import { toString } from 'mdast-util-to-string'
import type { Root, Content, Heading, Code, List, ListItem, Table, TableRow, Paragraph, Text } from 'mdast'

// ============================================
// Types
// ============================================

export interface Section {
  title: string
  depth: number
  children: Content[]
  position?: { line: number; column: number }
}

export interface CodeBlock {
  language?: string
  meta?: string
  code: string
  position?: { line: number; column: number }
}

export interface TableData {
  headers: string[]
  rows: string[][]
  align?: (string | null)[]
}

export interface ListItemData {
  text: string
  checked?: boolean  // For task lists
  children?: ListItemData[]
}

// ============================================
// Core Parser
// ============================================

/**
 * Parse markdown string into an AST
 */
export function parseMarkdown(content: string): Root {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)  // Enables tables, task lists, strikethrough
    .parse(content)
}

// ============================================
// Section Extraction
// ============================================

/**
 * Extract all sections from markdown, grouped by heading
 * Returns a flat list of sections with their depth and children
 */
export function extractSections(content: string): Section[] {
  const tree = parseMarkdown(content)
  const sections: Section[] = []
  let currentSection: Section | null = null

  for (const node of tree.children) {
    if (node.type === 'heading') {
      const heading = node as Heading
      currentSection = {
        title: toString(heading),
        depth: heading.depth,
        children: [],
        position: heading.position?.start
      }
      sections.push(currentSection)
    } else if (currentSection) {
      currentSection.children.push(node)
    }
  }

  return sections
}

/**
 * Find a section by title (case-insensitive partial match)
 */
export function findSection(sections: Section[], title: string): Section | undefined {
  const titleLower = title.toLowerCase()
  return sections.find(s => s.title.toLowerCase().includes(titleLower))
}

/**
 * Find all sections matching a title pattern
 */
export function findSections(sections: Section[], title: string): Section[] {
  const titleLower = title.toLowerCase()
  return sections.filter(s => s.title.toLowerCase().includes(titleLower))
}

/**
 * Get subsections (sections with depth > parent depth) within a section
 */
export function getSubsections(section: Section, allSections: Section[]): Section[] {
  const sectionIndex = allSections.indexOf(section)
  if (sectionIndex === -1) return []

  const subsections: Section[] = []
  for (let i = sectionIndex + 1; i < allSections.length; i++) {
    const s = allSections[i]
    if (s.depth <= section.depth) break  // Hit a sibling or parent section
    if (s.depth === section.depth + 1) {
      subsections.push(s)
    }
  }
  return subsections
}

// ============================================
// Code Block Extraction
// ============================================

/**
 * Extract all code blocks from a section's children
 */
export function extractCodeBlocks(children: Content[]): CodeBlock[] {
  const codeBlocks: CodeBlock[] = []

  for (const node of children) {
    if (node.type === 'code') {
      const code = node as Code
      codeBlocks.push({
        language: code.lang || undefined,
        meta: code.meta || undefined,
        code: code.value,
        position: code.position?.start
      })
    }
  }

  return codeBlocks
}

/**
 * Extract code blocks from entire markdown content
 */
export function extractAllCodeBlocks(content: string): CodeBlock[] {
  const tree = parseMarkdown(content)
  const codeBlocks: CodeBlock[] = []

  visit(tree, 'code', (node: Code) => {
    codeBlocks.push({
      language: node.lang || undefined,
      meta: node.meta || undefined,
      code: node.value,
      position: node.position?.start
    })
  })

  return codeBlocks
}

// ============================================
// List Extraction
// ============================================

/**
 * Extract list items from a section's children
 * Handles both regular lists and task lists (checkboxes)
 */
export function extractListItems(children: Content[]): ListItemData[] {
  const items: ListItemData[] = []

  for (const node of children) {
    if (node.type === 'list') {
      const list = node as List
      for (const item of list.children) {
        items.push(parseListItem(item))
      }
    }
  }

  return items
}

function parseListItem(item: ListItem): ListItemData {
  const text = toString(item)
  const result: ListItemData = {
    text,
    checked: item.checked ?? undefined
  }

  // Check for nested lists
  const nestedList = item.children.find(c => c.type === 'list') as List | undefined
  if (nestedList) {
    result.children = nestedList.children.map(parseListItem)
  }

  return result
}

/**
 * Extract simple string list from children (ignores nesting)
 */
export function extractSimpleList(children: Content[]): string[] {
  return extractListItems(children).map(item => item.text)
}

// ============================================
// Table Extraction
// ============================================

/**
 * Extract tables from a section's children
 */
export function extractTables(children: Content[]): TableData[] {
  const tables: TableData[] = []

  for (const node of children) {
    if (node.type === 'table') {
      tables.push(parseTable(node as Table))
    }
  }

  return tables
}

function parseTable(table: Table): TableData {
  const rows = table.children as TableRow[]
  if (rows.length === 0) {
    return { headers: [], rows: [] }
  }

  // First row is headers
  const headers = rows[0].children.map(cell => toString(cell))

  // Remaining rows are data
  const dataRows = rows.slice(1).map(row =>
    row.children.map(cell => toString(cell))
  )

  return {
    headers,
    rows: dataRows,
    align: table.align || undefined
  }
}

// ============================================
// Text Extraction
// ============================================

/**
 * Extract plain text from children (paragraphs only)
 */
export function extractText(children: Content[]): string {
  return children
    .filter(node => node.type === 'paragraph')
    .map(node => toString(node))
    .join('\n\n')
}

/**
 * Extract all text content from children (paragraphs, lists, blockquotes, etc.)
 */
export function extractFullText(children: Content[]): string {
  return children.map(node => toString(node)).join('\n\n')
}

/**
 * Extract blockquote text from children
 */
export function extractBlockquote(children: Content[]): string | undefined {
  for (const node of children) {
    if (node.type === 'blockquote') {
      return toString(node)
    }
  }
  return undefined
}

/**
 * Extract text before the first heading or list in children
 */
export function extractIntroText(children: Content[]): string | undefined {
  const introNodes: Content[] = []

  for (const node of children) {
    if (node.type === 'heading' || node.type === 'list') break
    if (node.type === 'paragraph') {
      introNodes.push(node)
    }
  }

  if (introNodes.length === 0) return undefined
  return introNodes.map(n => toString(n)).join('\n\n')
}

// ============================================
// Metadata Extraction
// ============================================

/**
 * Extract key-value metadata from bold patterns like **Key**: Value
 */
export function extractMetadata(content: string): Record<string, string> {
  const metadata: Record<string, string> = {}
  const tree = parseMarkdown(content)

  visit(tree, 'paragraph', (node: Paragraph) => {
    const text = toString(node)
    const match = text.match(/^\*\*([^*]+)\*\*:\s*(.+)$/m)
    if (match) {
      metadata[match[1].trim()] = match[2].trim()
    }
  })

  return metadata
}

/**
 * Extract a specific metadata value
 */
export function extractMetadataValue(content: string, key: string): string | undefined {
  const regex = new RegExp(`\\*\\*${key}\\*\\*:\\s*([^\\n]+)`, 'i')
  const match = content.match(regex)
  return match ? match[1].trim() : undefined
}
