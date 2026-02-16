# Lib Directory

## Purpose
Utilities, parsers, state management, AI client, auth, and business logic.

## Overview
This directory contains all non-component TypeScript code including markdown parsers, path utilities, the Zustand store, AI client, authentication, and cloud sync services. Some files are server-only (use Node.js fs), while others work on both client and server.

## Key Files

| File | Purpose | Environment |
|------|---------|-------------|
| `parser.ts` | Parse spec-kit markdown files | Server only |
| `path-utils.ts` | Path validation and security | Server only |
| `prisma.ts` | Prisma client singleton | Server only |
| `store.ts` | Zustand state management | Client only |
| `utils.ts` | General utilities (cn, colors) | Both |
| `ai/` | AI client (OpenAI-compatible) | Server only |
| `auth/` | Better Auth configuration | Server only |
| `services/` | Cloud sync services | Server only |
| `sync/` | Sync utilities | Server only |

## File Details

### parser.ts (Server Only)
Core business logic for parsing spec-kit markdown files:

| Function | Purpose |
|----------|---------|
| `parseTaskLine()` | Parse single task: `- [ ] T001 [P] [US1] Description` |
| `parseTasksFile()` | Parse tasks.md into tasks and phases |
| `parseClarifications()` | Extract Q&A from spec.md |
| `parseUserStories()` | Extract user stories from spec.md |
| `parseTechnicalContext()` | Extract tech context from plan.md |
| `groupTasksByUserStory()` | Group tasks by [US1], [US2] markers |
| `parseAdditionalFiles()` | Load research.md, data-model.md, etc. |
| `parseConstitution()` | Parse constitution.md principles |
| `parseFeature()` | Parse entire feature directory |
| `parseProject()` | Parse entire project with all features |

### path-utils.ts (Server Only)
Security utilities for filesystem operations:

| Function | Purpose |
|----------|---------|
| `isPathSafe()` | Validate path is within allowed directories |
| `isSpecKitProject()` | Check for specs/ or .specify/ directory |
| `isValidDirectoryPath()` | Verify path exists and is directory |
| `normalizePath()` | Expand ~ to home directory |

### store.ts (Client Only)
Zustand store for client-side state:

| State | Purpose |
|-------|---------|
| `project` | Current loaded project |
| `selectedFeature` | Currently selected feature |
| `isLoading` | Loading state |
| `error` | Error message |
| `projectPath` | Current project filesystem path |
| `recentProjects` | Recently opened projects (localStorage persisted) |

**RecentProject Interface:**
```typescript
interface RecentProject {
  path: string;           // Filesystem path
  name: string;           // Project name
  slug?: string;          // URL-safe slug from database (for routing)
  lastOpened: string;     // ISO date string
  summary: string | null; // From constitution.md
  featureCount: number;
  completionPercentage: number;
  stageBreakdown: Record<FeatureStage, number>;
}
```

**Key Actions:**
| Action | Purpose |
|--------|---------|
| `addRecentProject(project, slug?)` | Add/update project in recent list with metadata and optional slug |
| `loadRecentProjects()` | Load recent projects from localStorage |
| `getMetrics()` | Calculate dashboard metrics from current project |

**Note:** The `slug` field is cached from the database when a project is opened. This allows the home page to navigate directly using the slug without re-registering the project.

### utils.ts (Both)
General utilities:

| Function | Purpose |
|----------|---------|
| `cn()` | Merge Tailwind classes (clsx + tailwind-merge) |
| `getStageColor()` | Get color classes for feature stage |
| `getKanbanColumn()` | Map stage to Kanban column |
| `isPrismaError()` | Type guard for Prisma errors |
| `openInEditor()` | Open file in VS Code via URI |

## Patterns & Conventions

- **Server-only imports**: `parser.ts` and `path-utils.ts` use Node.js `fs`
- **Type guards**: Use for runtime type checking (e.g., `isPrismaError`)
- **Regex parsing**: Markdown parsing uses regex patterns
- **Error handling**: Graceful fallbacks for missing files

## Dependencies

- **Internal**: `@/types`
- **External**: fs, path, os, gray-matter, clsx, tailwind-merge, zustand, better-auth

## Common Tasks

- **Add new parser**: Add function to `parser.ts`, export from module
- **Add utility**: Add to `utils.ts` if client-compatible, else appropriate file
- **Add store state**: Extend `ProjectStore` interface in `store.ts`
- **Add path validation**: Add to `path-utils.ts`

## Important Notes

- `parser.ts` is the heart of the application - handles all markdown parsing
- `prisma.ts` uses singleton pattern to prevent multiple client instances
- Store persists `recentProjects` to localStorage
- Path utils prevent directory traversal attacks
