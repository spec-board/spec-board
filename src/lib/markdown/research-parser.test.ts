/**
 * Tests for AST-based research parser
 */

import { describe, it, expect } from 'vitest'
import { parseResearchAST } from './research-parser'

const SAMPLE_RESEARCH = `**Feature**: Todo App
**Date**: 2024-01-15

## Technology Decisions

### 1. State Management

**Decision**: Zustand

**Rationale**:
- Lightweight and simple API
- No boilerplate required
- Built-in TypeScript support

**Alternatives Considered**:
- Redux: Too much boilerplate for this project
- Jotai: Less ecosystem support
- Context API: Performance concerns with frequent updates

### 2. Styling Solution

**Decision**: Tailwind CSS

**Rationale**:
- Utility-first approach speeds development
- Great DX with IDE support

**Alternatives Considered**:
- CSS Modules: More setup required
- Styled Components: Runtime overhead

## Performance Considerations

This section discusses performance optimizations.

- Use React.memo for expensive components
- Implement virtual scrolling for long lists

## Security Notes

Authentication and authorization considerations.
`

describe('parseResearchAST', () => {
  const parsed = parseResearchAST(SAMPLE_RESEARCH)

  describe('metadata extraction', () => {
    it('should extract feature name', () => {
      expect(parsed.feature).toBe('Todo App')
    })

    it('should extract date', () => {
      expect(parsed.date).toBe('2024-01-15')
    })

    it('should preserve raw content', () => {
      expect(parsed.rawContent).toBe(SAMPLE_RESEARCH)
    })
  })

  describe('technology decisions', () => {
    it('should extract all decisions', () => {
      expect(parsed.technologyDecisions).toHaveLength(2)
    })

    it('should parse decision IDs and titles', () => {
      expect(parsed.technologyDecisions[0].id).toBe(1)
      expect(parsed.technologyDecisions[0].title).toBe('State Management')
      expect(parsed.technologyDecisions[1].id).toBe(2)
      expect(parsed.technologyDecisions[1].title).toBe('Styling Solution')
    })

    it('should extract decision value', () => {
      expect(parsed.technologyDecisions[0].decision).toBe('Zustand')
      expect(parsed.technologyDecisions[1].decision).toBe('Tailwind CSS')
    })

    it('should extract rationale list', () => {
      expect(parsed.technologyDecisions[0].rationale).toHaveLength(3)
      expect(parsed.technologyDecisions[0].rationale).toContain('Lightweight and simple API')
      expect(parsed.technologyDecisions[0].rationale).toContain('No boilerplate required')
    })

    it('should extract alternatives', () => {
      expect(parsed.technologyDecisions[0].alternatives).toHaveLength(3)
      expect(parsed.technologyDecisions[0].alternatives[0].name).toBe('Redux')
      expect(parsed.technologyDecisions[0].alternatives[0].reason).toBe('Too much boilerplate for this project')
    })
  })

  describe('other sections', () => {
    it('should capture non-technology-decisions sections', () => {
      expect(parsed.otherSections).toHaveLength(2)
      expect(parsed.otherSections[0].title).toBe('Performance Considerations')
      expect(parsed.otherSections[1].title).toBe('Security Notes')
    })

    it('should extract section content', () => {
      expect(parsed.otherSections[0].content).toContain('performance optimizations')
      expect(parsed.otherSections[0].content).toContain('React.memo')
    })
  })
})

describe('parseResearchAST edge cases', () => {
  it('should handle empty content', () => {
    const parsed = parseResearchAST('')
    expect(parsed.technologyDecisions).toEqual([])
    expect(parsed.otherSections).toEqual([])
  })

  it('should handle missing technology decisions', () => {
    const parsed = parseResearchAST('## Other Section\n\nSome content')
    expect(parsed.technologyDecisions).toEqual([])
    expect(parsed.otherSections).toHaveLength(1)
  })

  it('should handle content without metadata', () => {
    const parsed = parseResearchAST('## Technology Decisions\n\n### 1. Test\n\n**Decision**: Value')
    expect(parsed.feature).toBeUndefined()
    expect(parsed.date).toBeUndefined()
    expect(parsed.technologyDecisions).toHaveLength(1)
  })

  it('should handle decisions without alternatives', () => {
    const content = `## Technology Decisions

### 1. Simple Decision

**Decision**: Just this

**Rationale**:
- One reason
`
    const parsed = parseResearchAST(content)
    expect(parsed.technologyDecisions[0].alternatives).toEqual([])
    expect(parsed.technologyDecisions[0].rationale).toHaveLength(1)
  })
})
