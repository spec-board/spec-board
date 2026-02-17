# Lib Directory

## Purpose
Utilities, parsers, state management, AI client, auth, and business logic.

## Overview
This directory contains all non-component TypeScript code including markdown parsers, path utilities, Zustand stores, AI client, authentication, cloud sync services, and code execution drivers. Most code is server-only (uses Node.js fs), while stores work on client.

## Architecture

**Database-First**: All project content is stored in PostgreSQL. The `parser.ts` module exists for legacy filesystem parsing but is no longer used for the main data flow.

## Key Files

| File | Purpose | Environment |
|------|---------|-------------|
| `parser.ts` | Legacy markdown parsing (DB-first now) | Server only |
| `path-utils.ts` | Path validation and security | Server only |
| `prisma.ts` | Prisma client singleton | Server only |
| `store.ts` | Zustand state management | Client only |
| `settings-store.ts` | Settings persistence | Client only |
| `utils.ts` | General utilities (cn, colors) | Both |
| `errors.ts` | Error classes and handling | Both |
| `logger.ts` | Logging utilities | Both |
| `rate-limit.ts` | Rate limiting middleware | Server only |
| `ai/` | AI client (Anthropic Claude) | Server only |
| `auth/` | Better Auth configuration | Server only |
| `services/` | Cloud sync services | Server only |
| `sync/` | Sync utilities | Server only |
| `drivers/` | E2B code execution | Server only |
| `validations/` | Input validation | Server only |
| `markdown/` | Specialized parsers | Server only |
| `shortcuts/` | Keyboard shortcuts | Client only |
| `accessibility/` | A11y utilities | Client only |

## File Details

### store.ts (Client Only)
Zustand store for client-side state:

| State | Purpose |
|-------|---------|
| `project` | Current loaded project |
| `selectedFeature` | Currently selected feature |
| `focusState` | Keyboard navigation (column, cardIndex, featureId) |

**Key Actions:**
| Action | Purpose |
|--------|---------|
| `setProject(project)` | Set current project |
| `setSelectedFeature(feature)` | Set selected feature |
| `updateFocusState(state)` | Update keyboard focus |

### settings-store.ts (Client Only)
Zustand store for app settings with localStorage persistence:

| State | Purpose |
|-------|---------|
| `aiSettings` | AI API configuration |
| `theme` | Theme preference (light/dark/system) |
| `shortcutsEnabled` | Keyboard shortcuts toggle |

### parser.ts (Legacy - Server Only)
Core business logic for parsing spec-kit markdown files. Now used only for legacy filesystem projects:

| Function | Purpose |
|----------|---------|
| `parseTaskLine()` | Parse single task: `- [ ] T001 [P] [US1] Description` |
| `parseTasksFile()` | Parse tasks.md into tasks and phases |
| `parseFeature()` | Parse entire feature directory |
| `parseProject()` | Parse entire project with all features |

**Note:** Database-first projects use Prisma queries instead.

### path-utils.ts (Server Only)
Security utilities for filesystem operations:

| Function | Purpose |
|----------|---------|
| `isPathSafe()` | Validate path is within allowed directories |
| `isSpecKitProject()` | Check for specs/ or .specify/ directory |
| `isValidDirectoryPath()` | Verify path exists and is directory |
| `normalizePath()` | Expand ~ to home directory |

### utils.ts (Both)
General utilities:

| Function | Purpose |
|----------|---------|
| `cn()` | Merge Tailwind classes (clsx + tailwind-merge) |
| `getStageColor()` | Get color classes for feature stage |
| `getKanbanColumn()` | Map stage to Kanban column |
| `isPrismaError()` | Type guard for Prisma errors |
| `openInEditor()` | Open file in VS Code via URI |

## Subdirectories

### ai/ (Server Only)
AI client using Anthropic Claude API:
- `client.ts` - AIService class with real AI implementations
- `types.ts` - AI request/response types

### auth/ (Server Only)
Better Auth configuration:
- `config.ts` - Auth configuration
- `client.ts` - Client-side auth helpers
- `session.ts` - Session management
- `api-token.ts` - API token management

### drivers/ (Server Only)
E2B code execution:
- `manager.ts` - Driver manager
- `e2b.ts` - E2B integration
- `base.ts` - Base driver interface

### services/ (Server Only)
Cloud sync services:
- `cloud-project.ts` - Cloud project CRUD
- `project-member.ts` - Team member management
- `sync.ts` - Sync operations
- `conflict.ts` - Conflict resolution

### sync/ (Server Only)
Sync utilities:
- `diff.ts` - Diff computation
- `checksum.ts` - Checksum calculation

### validations/ (Server Only)
Input validation:
- `sync.ts` - Sync validation
- `utils.ts` - Validation utilities

### markdown/ (Server Only)
Specialized markdown parsers:
- `plan-parser.ts` - Plan document parsing
- `research-parser.ts` - Research document parsing
- `data-model-parser.ts` - Data model parsing
- `quickstart-parser.ts` - Quickstart parsing
- `contract-parser.ts` - Contract parsing

### shortcuts/ (Client Only)
Keyboard shortcuts:
- `use-shortcuts.ts` - Shortcut handler hook
- `shortcut-config.ts` - Shortcut definitions

### accessibility/ (Client Only)
Accessibility utilities:
- `use-focus-trap.ts` - Focus trap for modals
- `announcer.ts` - Screen reader announcements

## Patterns & Conventions

- **Server-only imports**: Most files use Node.js `fs`
- **Type guards**: Use for runtime type checking (e.g., `isPrismaError`)
- **Regex parsing**: Markdown parsing uses regex patterns
- **Error handling**: Graceful fallbacks for missing files
- **Singleton pattern**: Prisma client uses singleton to prevent multiple instances

## Dependencies

- **Internal**: `@/types`
- **External**: fs, path, zustand, prisma, gray-matter, clsx, tailwind-merge, better-auth, @e2b/code-interpreter

## Common Tasks

- **Add new utility**: Add to `utils.ts` if client-compatible
- **Add store state**: Extend store in `store.ts` or `settings-store.ts`
- **Add path validation**: Add to `path-utils.ts`
- **Add validation**: Add to `validations/`

## Important Notes

- Database-first architecture: Use Prisma queries for data, not parser.ts
- `prisma.ts` uses singleton pattern to prevent multiple client instances
- Stores persist to localStorage (settings-store for settings, store for project state)
- Path utils prevent directory traversal attacks
