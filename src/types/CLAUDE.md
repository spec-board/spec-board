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

### Core Domain Types

| Type | Purpose |
|------|---------|
| `Project` | Root project with features, constitution |
| `Feature` | Single feature with tasks, specs, plans |
| `Task` | Individual task item |
| `TaskPhase` | Group of tasks in a phase |
| `FeatureStage` | Stage enum: specify, plan, tasks, implement, complete |

### Spec-Kit File Types

| Type | Purpose |
|------|---------|
| `UserStory` | User story from spec.md |
| `TechnicalContext` | Tech context from plan.md |
| `TaskGroup` | Tasks grouped by user story |
| `SpecKitFile` | Generic spec-kit file (research, data-model, etc.) |
| `SpecKitFileType` | File type enum |

### Clarification Types

| Type | Purpose |
|------|---------|
| `Clarification` | Single Q&A pair |
| `ClarificationSession` | Session with date and clarifications |

### Constitution Types

| Type | Purpose |
|------|---------|
| `Constitution` | Full constitution with title, principles, sections, version metadata |
| `ConstitutionPrinciple` | Named principle with description |
| `ConstitutionSection` | Named section with content and subsections |
| `ConstitutionSubsection` | Named subsection within a section |
| `SyncImpactReport` | Sync impact report from HTML comment in constitution.md |

### Dashboard Types

| Type | Purpose |
|------|---------|
| `DashboardMetrics` | Aggregated project metrics |
| `WebSocketMessage` | Real-time update message |

## Key Interfaces

```typescript
// Feature stages
type FeatureStage = 'specify' | 'plan' | 'tasks' | 'implement' | 'complete';

// Task with markers
interface Task {
  id: string;           // T001, T002, etc.
  description: string;
  completed: boolean;
  parallel: boolean;    // [P] marker
  userStory?: string;   // [US1] marker
  filePath?: string;
}

// Full feature
interface Feature {
  id: string;
  name: string;
  path: string;
  stage: FeatureStage;
  tasks: Task[];
  phases: TaskPhase[];
  userStories: UserStory[];
  taskGroups: TaskGroup[];
  // ... more fields
}
```

## Patterns & Conventions

- **Single File**: All types in `index.ts` for simplicity
- **Interfaces over Types**: Prefer `interface` for objects
- **Optional Fields**: Use `?` for nullable/optional
- **Enums as Unions**: Use string unions over enums

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
- Keep types in sync with parser output
- Use `Record<K, V>` for dynamic keys
