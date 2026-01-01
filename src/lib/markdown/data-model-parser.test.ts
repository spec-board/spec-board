/**
 * Tests for AST-based data-model parser
 */

import { describe, it, expect } from 'vitest'
import { parseDataModelAST } from './data-model-parser'

const SAMPLE_DATA_MODEL = `**Feature**: Todo App
**Date**: 2024-01-15

## Entities

### Todo

The main todo item entity.

\`\`\`typescript
interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}
\`\`\`

### User

User account information.

\`\`\`typescript
interface User {
  id: string;
  email: string;
  name: string;
}
\`\`\`

## Enums

### Priority

\`\`\`typescript
enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}
\`\`\`

### Status

\`\`\`typescript
enum Status {
  PENDING = 'pending',
  COMPLETED = 'completed'
}
\`\`\`

## Validation Rules

### Title

- Required field
- Minimum 1 character
- Maximum 200 characters

### Email

- Valid email format
- Unique in database

## State Transitions

### Todo Status

| State | Condition | Transitions To |
|-------|-----------|----------------|
| pending | User marks complete | completed |
| completed | User reopens | pending |

### User Account

\`\`\`mermaid
stateDiagram
  active --> suspended
  suspended --> active
\`\`\`

Account state diagram.

## localStorage Schema

### Keys

| Key | Type | Description |
|-----|------|-------------|
| \`todos\` | \`Todo[]\` | All todo items |
| \`user\` | \`User\` | Current user |

### Structure

\`\`\`json
{
  "todos": [],
  "user": null
}
\`\`\`

**Note**: Data is persisted on every change

## Sorting Behavior

### By Date

Sort todos by creation date, newest first.

### By Priority

Sort todos by priority level, highest first.

## Filtering Behavior

| Filter | Condition |
|--------|-----------|
| All | No filter applied |
| Active | completed = false |
| Completed | completed = true |

## Search Behavior

- Search by title
- Case-insensitive matching
- Partial match support

## Data Integrity

### Referential Integrity

- Todo must have valid user ID
- Cascade delete on user removal

### Constraints

- Unique todo IDs
- Non-null required fields
`

describe('parseDataModelAST', () => {
  const parsed = parseDataModelAST(SAMPLE_DATA_MODEL)

  describe('metadata extraction', () => {
    it('should extract feature name', () => {
      expect(parsed.feature).toBe('Todo App')
    })

    it('should extract date', () => {
      expect(parsed.date).toBe('2024-01-15')
    })

    it('should preserve raw content', () => {
      expect(parsed.rawContent).toBe(SAMPLE_DATA_MODEL)
    })
  })

  describe('entities', () => {
    it('should extract all entities', () => {
      expect(parsed.entities).toHaveLength(2)
    })

    it('should parse entity names', () => {
      expect(parsed.entities[0].name).toBe('Todo')
      expect(parsed.entities[1].name).toBe('User')
    })

    it('should extract descriptions', () => {
      expect(parsed.entities[0].description).toContain('main todo item')
    })

    it('should extract code blocks', () => {
      expect(parsed.entities[0].codeBlock).toContain('interface Todo')
      expect(parsed.entities[0].codeBlock).toContain('completed: boolean')
    })
  })

  describe('enums', () => {
    it('should extract all enums', () => {
      expect(parsed.enums).toHaveLength(2)
    })

    it('should parse enum names', () => {
      expect(parsed.enums[0].name).toBe('Priority')
      expect(parsed.enums[1].name).toBe('Status')
    })

    it('should extract code blocks', () => {
      expect(parsed.enums[0].codeBlock).toContain('enum Priority')
      expect(parsed.enums[0].codeBlock).toContain("LOW = 'low'")
    })
  })

  describe('validation rules', () => {
    it('should extract all validation rules', () => {
      expect(parsed.validationRules).toHaveLength(2)
    })

    it('should parse field names', () => {
      expect(parsed.validationRules[0].field).toBe('Title')
      expect(parsed.validationRules[1].field).toBe('Email')
    })

    it('should extract rules list', () => {
      expect(parsed.validationRules[0].rules).toHaveLength(3)
      expect(parsed.validationRules[0].rules).toContain('Required field')
      expect(parsed.validationRules[0].rules).toContain('Maximum 200 characters')
    })
  })

  describe('state transitions', () => {
    it('should extract subsections', () => {
      expect(parsed.stateTransitions.subsections).toHaveLength(2)
    })

    it('should parse subsection titles', () => {
      expect(parsed.stateTransitions.subsections[0].title).toBe('Todo Status')
      expect(parsed.stateTransitions.subsections[1].title).toBe('User Account')
    })

    it('should extract transitions from table', () => {
      const todoStatus = parsed.stateTransitions.subsections[0]
      expect(todoStatus.transitions).toHaveLength(2)
      expect(todoStatus.transitions![0].state).toBe('pending')
      expect(todoStatus.transitions![0].transitionsTo).toContain('completed')
    })

    it('should extract code blocks', () => {
      const userAccount = parsed.stateTransitions.subsections[1]
      expect(userAccount.codeBlock).toContain('stateDiagram')
    })
  })

  describe('storage schema', () => {
    it('should extract subsections', () => {
      expect(parsed.storageSchema.subsections).toHaveLength(2)
    })

    it('should extract keys from table', () => {
      const keysSection = parsed.storageSchema.subsections[0]
      expect(keysSection.keys).toHaveLength(2)
      expect(keysSection.keys![0].key).toBe('todos')
      expect(keysSection.keys![0].type).toBe('Todo[]')
    })

    it('should extract note', () => {
      expect(parsed.storageSchema.note).toBe('Data is persisted on every change')
    })
  })

  describe('sorting behavior', () => {
    it('should extract sorting options', () => {
      expect(parsed.sortingBehavior).toHaveLength(2)
      expect(parsed.sortingBehavior[0].option).toBe('Date')
      expect(parsed.sortingBehavior[1].option).toBe('Priority')
    })

    it('should extract descriptions', () => {
      expect(parsed.sortingBehavior[0].description).toContain('newest first')
    })
  })

  describe('filtering behavior', () => {
    it('should extract filters from table', () => {
      expect(parsed.filteringBehavior).toHaveLength(3)
      expect(parsed.filteringBehavior[0].filter).toBe('All')
      expect(parsed.filteringBehavior[1].condition).toBe('completed = false')
    })
  })

  describe('search behavior', () => {
    it('should extract search behaviors', () => {
      expect(parsed.searchBehavior).toHaveLength(3)
      expect(parsed.searchBehavior).toContain('Search by title')
      expect(parsed.searchBehavior).toContain('Case-insensitive matching')
    })
  })

  describe('data integrity', () => {
    it('should extract integrity rules', () => {
      expect(parsed.dataIntegrity).toHaveLength(2)
      expect(parsed.dataIntegrity[0].title).toBe('Referential Integrity')
      expect(parsed.dataIntegrity[1].title).toBe('Constraints')
    })

    it('should extract rule items', () => {
      expect(parsed.dataIntegrity[0].items).toHaveLength(2)
      expect(parsed.dataIntegrity[0].items).toContain('Todo must have valid user ID')
    })
  })
})

describe('parseDataModelAST edge cases', () => {
  it('should handle empty content', () => {
    const parsed = parseDataModelAST('')
    expect(parsed.entities).toEqual([])
    expect(parsed.enums).toEqual([])
    expect(parsed.validationRules).toEqual([])
  })

  it('should handle missing sections', () => {
    const parsed = parseDataModelAST('## Entities\n\n### Item\n\nDescription')
    expect(parsed.entities).toHaveLength(1)
    expect(parsed.enums).toEqual([])
    expect(parsed.stateTransitions.subsections).toEqual([])
  })

  it('should handle content without metadata', () => {
    const parsed = parseDataModelAST('## Search Behavior\n\n- Item 1')
    expect(parsed.feature).toBeUndefined()
    expect(parsed.date).toBeUndefined()
    expect(parsed.searchBehavior).toEqual(['Item 1'])
  })
})
