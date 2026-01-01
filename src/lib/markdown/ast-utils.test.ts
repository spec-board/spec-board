/**
 * Tests for AST-based markdown parsing utilities
 */

import { describe, it, expect } from 'vitest'
import {
  parseMarkdown,
  extractSections,
  findSection,
  getSubsections,
  extractCodeBlocks,
  extractSimpleList,
  extractListItems,
  extractTables,
  extractText,
  extractIntroText,
  extractMetadataValue,
} from './ast-utils'

describe('AST Utils', () => {
  describe('parseMarkdown', () => {
    it('should parse markdown into AST', () => {
      const tree = parseMarkdown('# Hello\n\nWorld')
      expect(tree.type).toBe('root')
      expect(tree.children.length).toBeGreaterThan(0)
    })

    it('should handle GFM tables', () => {
      const tree = parseMarkdown('| A | B |\n|---|---|\n| 1 | 2 |')
      expect(tree.children[0].type).toBe('table')
    })

    it('should handle task lists', () => {
      const tree = parseMarkdown('- [x] Done\n- [ ] Todo')
      expect(tree.children[0].type).toBe('list')
    })
  })

  describe('extractSections', () => {
    it('should extract sections by heading', () => {
      const content = `# Title

Intro text

## Section 1

Content 1

## Section 2

Content 2`

      const sections = extractSections(content)
      expect(sections).toHaveLength(3)
      expect(sections[0].title).toBe('Title')
      expect(sections[1].title).toBe('Section 1')
      expect(sections[2].title).toBe('Section 2')
    })

    it('should track heading depth', () => {
      const content = `# H1

## H2

### H3`

      const sections = extractSections(content)
      expect(sections[0].depth).toBe(1)
      expect(sections[1].depth).toBe(2)
      expect(sections[2].depth).toBe(3)
    })

    it('should include children in sections', () => {
      const content = `## Section

Paragraph 1

Paragraph 2`

      const sections = extractSections(content)
      expect(sections[0].children.length).toBe(2)
    })
  })

  describe('findSection', () => {
    it('should find section by title (case-insensitive)', () => {
      const sections = extractSections('## Prerequisites\n\nContent')
      const found = findSection(sections, 'prerequisites')
      expect(found).toBeDefined()
      expect(found?.title).toBe('Prerequisites')
    })

    it('should find section by partial match', () => {
      const sections = extractSections('## Development Commands\n\nContent')
      const found = findSection(sections, 'development')
      expect(found).toBeDefined()
    })

    it('should return undefined if not found', () => {
      const sections = extractSections('## Other\n\nContent')
      const found = findSection(sections, 'missing')
      expect(found).toBeUndefined()
    })
  })

  describe('getSubsections', () => {
    it('should get immediate subsections', () => {
      const content = `## Parent

### Child 1

### Child 2

## Sibling`

      const sections = extractSections(content)
      const parent = findSection(sections, 'Parent')!
      const subsections = getSubsections(parent, sections)

      expect(subsections).toHaveLength(2)
      expect(subsections[0].title).toBe('Child 1')
      expect(subsections[1].title).toBe('Child 2')
    })

    it('should not include deeper nested sections', () => {
      const content = `## Parent

### Child

#### Grandchild`

      const sections = extractSections(content)
      const parent = findSection(sections, 'Parent')!
      const subsections = getSubsections(parent, sections)

      expect(subsections).toHaveLength(1)
      expect(subsections[0].title).toBe('Child')
    })
  })

  describe('extractCodeBlocks', () => {
    it('should extract code blocks with language', () => {
      const content = `## Section

\`\`\`typescript
const x = 1
\`\`\`

\`\`\`bash
echo hello
\`\`\``

      const sections = extractSections(content)
      const codeBlocks = extractCodeBlocks(sections[0].children)

      expect(codeBlocks).toHaveLength(2)
      expect(codeBlocks[0].language).toBe('typescript')
      expect(codeBlocks[0].code).toBe('const x = 1')
      expect(codeBlocks[1].language).toBe('bash')
    })

    it('should handle code blocks without language', () => {
      const content = `## Section

\`\`\`
plain code
\`\`\``

      const sections = extractSections(content)
      const codeBlocks = extractCodeBlocks(sections[0].children)

      expect(codeBlocks[0].language).toBeUndefined()
      expect(codeBlocks[0].code).toBe('plain code')
    })
  })

  describe('extractSimpleList', () => {
    it('should extract list items as strings', () => {
      const content = `## Section

- Item 1
- Item 2
- Item 3`

      const sections = extractSections(content)
      const items = extractSimpleList(sections[0].children)

      expect(items).toEqual(['Item 1', 'Item 2', 'Item 3'])
    })
  })

  describe('extractListItems', () => {
    it('should extract task list items with checked state', () => {
      const content = `## Section

- [x] Done task
- [ ] Pending task`

      const sections = extractSections(content)
      const items = extractListItems(sections[0].children)

      expect(items).toHaveLength(2)
      expect(items[0].checked).toBe(true)
      expect(items[1].checked).toBe(false)
    })
  })

  describe('extractTables', () => {
    it('should extract table data', () => {
      const content = `## Section

| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |`

      const sections = extractSections(content)
      const tables = extractTables(sections[0].children)

      expect(tables).toHaveLength(1)
      expect(tables[0].headers).toEqual(['Header 1', 'Header 2'])
      expect(tables[0].rows).toEqual([
        ['Cell 1', 'Cell 2'],
        ['Cell 3', 'Cell 4'],
      ])
    })
  })

  describe('extractText', () => {
    it('should extract paragraph text', () => {
      const content = `## Section

First paragraph.

Second paragraph.`

      const sections = extractSections(content)
      const text = extractText(sections[0].children)

      expect(text).toBe('First paragraph.\n\nSecond paragraph.')
    })
  })

  describe('extractIntroText', () => {
    it('should extract text before first heading or list', () => {
      const content = `## Section

Intro text here.

- List item`

      const sections = extractSections(content)
      const intro = extractIntroText(sections[0].children)

      expect(intro).toBe('Intro text here.')
    })

    it('should return undefined if no intro text', () => {
      const content = `## Section

- List item`

      const sections = extractSections(content)
      const intro = extractIntroText(sections[0].children)

      expect(intro).toBeUndefined()
    })
  })

  describe('extractMetadataValue', () => {
    it('should extract metadata value by key', () => {
      const content = '**Feature**: My Feature\n**Date**: 2024-01-01'

      expect(extractMetadataValue(content, 'Feature')).toBe('My Feature')
      expect(extractMetadataValue(content, 'Date')).toBe('2024-01-01')
    })

    it('should return undefined for missing key', () => {
      const content = '**Feature**: My Feature'
      expect(extractMetadataValue(content, 'Missing')).toBeUndefined()
    })
  })
})
