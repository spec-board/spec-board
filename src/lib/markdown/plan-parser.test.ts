/**
 * Tests for AST-based plan parser
 */

import { describe, it, expect } from 'vitest'
import { parsePlanAST } from './plan-parser'

const SAMPLE_PLAN = `**Branch**: \`feature/todo-app\`
**Date**: 2024-01-15
**Spec**: [Todo App Spec](./spec.md)
**Input**: User requirements document

## Summary

This plan outlines the implementation of a todo application with local storage persistence.

## Technical Context

**Framework**: Next.js 14
**State Management**: Zustand
**Styling**: Tailwind CSS

## Constitution Check

| Principle | Requirement | Status |
|-----------|-------------|--------|
| Simplicity | Keep UI minimal | ✅ |
| Performance | Fast load times | ✅ |
| Accessibility | WCAG 2.1 AA | ⚠️ |

> Note: Accessibility audit pending

## Project Structure

### Frontend

\`\`\`
src/
├── components/
│   ├── TodoList.tsx
│   └── TodoItem.tsx
├── hooks/
│   └── useTodos.ts
└── pages/
    └── index.tsx
\`\`\`

Main application components.

### Backend

\`\`\`
api/
├── routes/
│   └── todos.ts
└── middleware/
    └── auth.ts
\`\`\`

API routes and middleware.

## Complexity Tracking

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| State | Local-first | Offline support |
| Auth | None | MVP scope |

> Keep complexity low for initial release

## Implementation Notes

Additional notes about implementation details.

**Quality Gates**:
- All tests passing
- No TypeScript errors
- Lighthouse score > 90
`

describe('parsePlanAST', () => {
  const parsed = parsePlanAST(SAMPLE_PLAN)

  describe('metadata extraction', () => {
    it('should extract branch from backticks', () => {
      expect(parsed.metadata.branch).toBe('feature/todo-app')
    })

    it('should extract date', () => {
      expect(parsed.metadata.date).toBe('2024-01-15')
    })

    it('should extract spec link', () => {
      expect(parsed.metadata.specLink).toBe('./spec.md')
    })

    it('should extract input', () => {
      expect(parsed.metadata.input).toBe('User requirements document')
    })

    it('should preserve raw content', () => {
      expect(parsed.rawContent).toBe(SAMPLE_PLAN)
    })
  })

  describe('summary', () => {
    it('should extract summary text', () => {
      expect(parsed.summary).toContain('todo application')
      expect(parsed.summary).toContain('local storage')
    })
  })

  describe('technical context', () => {
    it('should extract key-value pairs', () => {
      expect(parsed.technicalContext['Framework']).toBe('Next.js 14')
      expect(parsed.technicalContext['State Management']).toBe('Zustand')
      expect(parsed.technicalContext['Styling']).toBe('Tailwind CSS')
    })
  })

  describe('constitution check', () => {
    it('should extract table items', () => {
      expect(parsed.constitutionCheck.items).toHaveLength(3)
      expect(parsed.constitutionCheck.items[0].principle).toBe('Simplicity')
      expect(parsed.constitutionCheck.items[0].requirement).toBe('Keep UI minimal')
      expect(parsed.constitutionCheck.items[0].status).toBe('✅')
    })

    it('should extract note from blockquote', () => {
      expect(parsed.constitutionCheck.note).toBe('Note: Accessibility audit pending')
    })
  })

  describe('quality gates', () => {
    it('should extract quality gates list', () => {
      expect(parsed.qualityGates).toHaveLength(3)
      expect(parsed.qualityGates).toContain('All tests passing')
      expect(parsed.qualityGates).toContain('No TypeScript errors')
      expect(parsed.qualityGates).toContain('Lighthouse score > 90')
    })
  })

  describe('project structure', () => {
    it('should extract structure subsections', () => {
      expect(parsed.projectStructure).toHaveLength(2)
      expect(parsed.projectStructure[0].title).toBe('Frontend')
      expect(parsed.projectStructure[1].title).toBe('Backend')
    })

    it('should extract code blocks', () => {
      expect(parsed.projectStructure[0].codeBlock).toContain('components/')
      expect(parsed.projectStructure[0].codeBlock).toContain('TodoList.tsx')
    })

    it('should extract descriptions', () => {
      expect(parsed.projectStructure[0].description).toContain('Main application')
    })
  })

  describe('complexity tracking', () => {
    it('should extract table items', () => {
      expect(parsed.complexityTracking.items).toHaveLength(2)
      expect(parsed.complexityTracking.items[0].aspect).toBe('State')
      expect(parsed.complexityTracking.items[0].decision).toBe('Local-first')
      expect(parsed.complexityTracking.items[0].rationale).toBe('Offline support')
    })

    it('should extract note', () => {
      expect(parsed.complexityTracking.note).toBe('Keep complexity low for initial release')
    })
  })

  describe('other sections', () => {
    it('should capture unknown sections', () => {
      expect(parsed.otherSections).toHaveLength(1)
      expect(parsed.otherSections[0].title).toBe('Implementation Notes')
      expect(parsed.otherSections[0].content).toContain('implementation details')
    })
  })
})

describe('parsePlanAST edge cases', () => {
  it('should handle empty content', () => {
    const parsed = parsePlanAST('')
    expect(parsed.metadata).toEqual({})
    expect(parsed.summary).toBeUndefined()
    expect(parsed.constitutionCheck.items).toEqual([])
  })

  it('should handle missing sections', () => {
    const parsed = parsePlanAST('## Random Section\n\nSome content')
    expect(parsed.summary).toBeUndefined()
    expect(parsed.projectStructure).toEqual([])
    expect(parsed.otherSections).toHaveLength(1)
  })

  it('should handle content without metadata', () => {
    const parsed = parsePlanAST('## Summary\n\nJust a summary')
    expect(parsed.metadata.branch).toBeUndefined()
    expect(parsed.metadata.date).toBeUndefined()
    expect(parsed.summary).toBe('Just a summary')
  })
})
