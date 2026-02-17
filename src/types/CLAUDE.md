# Types Directory

## Purpose
TypeScript type definitions for the entire application.

## Overview
This directory contains all shared TypeScript interfaces and types used throughout the application. All types are defined in a single `index.ts` file for easy importing via `@/types`.

## Key Files

| File | Purpose |
|------|---------|
| `index.ts` | All TypeScript type definitions |

## Type Categories

### Core Domain Types (Database-First)

| Type | Purpose |
|------|---------|
| `Project` | Root project from database |
| `Feature` | Feature with stage, content fields |
| `Task` | Individual task item |
| `UserStory` | User story linked to feature |
| `Constitution` | Project principles |

### Feature Stages

| Stage | Description |
|-------|-------------|
| `backlog` | Not started |
| `planning` | Being planned |
| `in_progress` | Implementation in progress |
| `done` | Completed |

### Spec-Kit File Content Types

These are stored as string content in the database:

| Field | Content Type |
|-------|--------------|
| `specContent` | spec.md |
| `planContent` | plan.md |
| `tasksContent` | tasks.md |
| `clarificationsContent` | Q&A history |
| `researchContent` | research.md |
| `dataModelContent` | data-model.md |
| `quickstartContent` | quickstart.md |
| `contractsContent` | contracts/ |
| `checklistsContent` | checklists/ |
| `analysisContent` | analysis/ |

### API Response Types

| Type | Purpose |
|------|---------|
| `ProjectData` | Full project data from `/api/project/[name]/data` |
| `BrowseEntry` | Project entry for browsing |
| `FeatureWithDetails` | Feature with all content fields |

## Key Interfaces

```typescript
// Feature stages (database-first)
type FeatureStage = 'backlog' | 'planning' | 'in_progress' | 'done';

// Database-first Feature
interface Feature {
  id: string;
  name: string;
  stage: FeatureStage;
  // Content fields (stored in DB, not filesystem)
  specContent: string | null;
  planContent: string | null;
  tasksContent: string | null;
  clarificationsContent: string | null;
  researchContent: string | null;
  dataModelContent: string | null;
  quickstartContent: string | null;
  contractsContent: string | null;
  checklistsContent: string | null;
  analysisContent: string | null;
  // Relations
  tasks: Task[];
  userStories: UserStory[];
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Task with markers
interface Task {
  id: string;
  description: string;
  completed: boolean;
  parallel: boolean;    // [P] marker
  userStoryId?: string; // Linked user story
  filePath?: string;
}
```

## Patterns & Conventions

- **Single File**: All types in `index.ts` for simplicity
- **Interfaces over Types**: Prefer `interface` for objects
- **Optional Fields**: Use `?` for nullable/optional
- **Enums as Unions**: Use string unions over enums
- **Database-First**: Content stored as strings in database

## Dependencies

- **Internal**: None (types are standalone)
- **External**: None

## Common Tasks

- **Add new type**: Add to `index.ts`, export
- **Extend type**: Add optional field with `?`
- **Add enum value**: Extend union type

## Important Notes

- Import types via `@/types` path alias
- Types are used by both client and server code
- Database-first: Content comes from PostgreSQL, not filesystem
- Use `Record<K, V>` for dynamic keys
