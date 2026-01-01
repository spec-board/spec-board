/**
 * Tests for AST-based quickstart parser
 */

import { describe, it, expect } from 'vitest'
import { parseQuickstartAST } from './quickstart-parser'

const SAMPLE_QUICKSTART = `**Feature**: Todo App
**Date**: 2024-01-15

## Prerequisites

- Node.js 18+
- pnpm package manager
- Git

## Setup

### 1. Clone Repository

\`\`\`bash
git clone https://github.com/example/todo-app
cd todo-app
\`\`\`

### 2. Install Dependencies

\`\`\`bash
pnpm install
\`\`\`

### 3. Configure Environment

\`\`\`bash
cp .env.example .env
\`\`\`

## Development

Get started with development.

\`\`\`bash
pnpm dev
\`\`\`

### Running Tests

\`\`\`bash
pnpm test
\`\`\`

### Code Style

We use ESLint and Prettier.

\`\`\`bash
pnpm lint
\`\`\`

## Development Commands

\`\`\`bash
pnpm dev
\`\`\`

\`\`\`bash
pnpm build
\`\`\`

## Project Scripts

\`\`\`json
{
  "dev": "next dev",
  "build": "next build",
  "test": "vitest"
}
\`\`\`

## Verification Checklist

- [x] Dependencies installed
- [x] Environment configured
- [ ] Tests passing
- [ ] Build successful

## Key Files to Create

1. \`src/config.ts\`
2. \`src/types/index.ts\`
3. \`.env.local\`

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Additional Notes

This is an additional section that should be captured in otherSections.
`

describe('parseQuickstartAST', () => {
  const parsed = parseQuickstartAST(SAMPLE_QUICKSTART)

  describe('metadata extraction', () => {
    it('should extract feature name', () => {
      expect(parsed.feature).toBe('Todo App')
    })

    it('should extract date', () => {
      expect(parsed.date).toBe('2024-01-15')
    })

    it('should preserve raw content', () => {
      expect(parsed.rawContent).toBe(SAMPLE_QUICKSTART)
    })
  })

  describe('prerequisites', () => {
    it('should extract all prerequisites', () => {
      expect(parsed.prerequisites).toHaveLength(3)
      expect(parsed.prerequisites).toContain('Node.js 18+')
      expect(parsed.prerequisites).toContain('pnpm package manager')
      expect(parsed.prerequisites).toContain('Git')
    })
  })

  describe('setup steps', () => {
    it('should extract all setup steps', () => {
      expect(parsed.setupSteps).toHaveLength(3)
    })

    it('should parse step IDs and titles', () => {
      expect(parsed.setupSteps[0].id).toBe(1)
      expect(parsed.setupSteps[0].title).toBe('Clone Repository')
      expect(parsed.setupSteps[1].id).toBe(2)
      expect(parsed.setupSteps[1].title).toBe('Install Dependencies')
      expect(parsed.setupSteps[2].id).toBe(3)
      expect(parsed.setupSteps[2].title).toBe('Configure Environment')
    })

    it('should extract commands with language', () => {
      expect(parsed.setupSteps[0].commands).toHaveLength(1)
      expect(parsed.setupSteps[0].commands[0].code).toContain('git clone')
      expect(parsed.setupSteps[0].commands[0].language).toBe('bash')
    })
  })

  describe('development section', () => {
    it('should extract development section', () => {
      expect(parsed.development).toBeDefined()
    })

    it('should extract intro text', () => {
      expect(parsed.development?.intro).toBe('Get started with development.')
    })

    it('should extract top-level code blocks', () => {
      expect(parsed.development?.codeBlocks).toHaveLength(1)
      expect(parsed.development?.codeBlocks[0].code).toBe('pnpm dev')
    })

    it('should extract subsections', () => {
      expect(parsed.development?.subsections).toHaveLength(2)
      expect(parsed.development?.subsections[0].title).toBe('Running Tests')
      expect(parsed.development?.subsections[1].title).toBe('Code Style')
    })

    it('should extract subsection code blocks', () => {
      expect(parsed.development?.subsections[0].codeBlocks).toHaveLength(1)
      expect(parsed.development?.subsections[0].codeBlocks[0].code).toBe('pnpm test')
    })
  })

  describe('development commands', () => {
    it('should extract development commands', () => {
      expect(parsed.developmentCommands).toHaveLength(2)
      expect(parsed.developmentCommands[0].command).toBe('pnpm dev')
      expect(parsed.developmentCommands[1].command).toBe('pnpm build')
    })
  })

  describe('project scripts', () => {
    it('should extract project scripts', () => {
      expect(parsed.projectScripts).toBeDefined()
      expect(parsed.projectScripts?.content).toContain('"dev": "next dev"')
    })
  })

  describe('verification checklist', () => {
    it('should extract all checklist items', () => {
      expect(parsed.verificationChecklist.items).toHaveLength(4)
    })

    it('should track checked state', () => {
      expect(parsed.verificationChecklist.items[0].checked).toBe(true)
      expect(parsed.verificationChecklist.items[0].text).toBe('Dependencies installed')
      expect(parsed.verificationChecklist.items[2].checked).toBe(false)
      expect(parsed.verificationChecklist.items[2].text).toBe('Tests passing')
    })
  })

  describe('key files to create', () => {
    it('should extract file paths from backticks', () => {
      expect(parsed.keyFilesToCreate.files).toHaveLength(3)
      expect(parsed.keyFilesToCreate.files).toContain('src/config.ts')
      expect(parsed.keyFilesToCreate.files).toContain('src/types/index.ts')
      expect(parsed.keyFilesToCreate.files).toContain('.env.local')
    })
  })

  describe('browser support', () => {
    it('should extract browser support list', () => {
      expect(parsed.browserSupport.subsections.length).toBeGreaterThan(0)
      const allItems = parsed.browserSupport.subsections.flatMap(s => s.items)
      expect(allItems).toContain('Chrome 90+')
      expect(allItems).toContain('Safari 14+')
    })
  })

  describe('other sections', () => {
    it('should capture unknown sections', () => {
      expect(parsed.otherSections).toHaveLength(1)
      expect(parsed.otherSections[0].title).toBe('Additional Notes')
      expect(parsed.otherSections[0].content).toContain('additional section')
    })
  })
})

describe('parseQuickstartAST edge cases', () => {
  it('should handle empty content', () => {
    const parsed = parseQuickstartAST('')
    expect(parsed.prerequisites).toEqual([])
    expect(parsed.setupSteps).toEqual([])
    expect(parsed.development).toBeUndefined()
  })

  it('should handle missing sections', () => {
    const parsed = parseQuickstartAST('## Random Section\n\nSome content')
    expect(parsed.prerequisites).toEqual([])
    expect(parsed.setupSteps).toEqual([])
    expect(parsed.otherSections).toHaveLength(1)
  })

  it('should handle content without metadata', () => {
    const parsed = parseQuickstartAST('## Prerequisites\n\n- Item 1')
    expect(parsed.feature).toBeUndefined()
    expect(parsed.date).toBeUndefined()
    expect(parsed.prerequisites).toEqual(['Item 1'])
  })
})
