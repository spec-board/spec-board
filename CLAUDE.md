# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

SpecBoard is a visual dashboard for spec-kit projects that provides a Kanban board interface for tracking feature development. It parses spec-kit markdown files (spec.md, plan.md, tasks.md) and displays them in an interactive web interface with real-time updates.

## Commands

### Development
```bash
pnpm dev              # Start development server (default port 3000)
pnpm build            # Build for production
pnpm start            # Start production server
```

### Testing
```bash
pnpm test             # Run tests in watch mode
pnpm test:run         # Run tests once
pnpm test:coverage    # Run tests with coverage report
```

### Type Checking
```bash
pnpm tsc --noEmit     # Type check without emitting files
```

### Database
```bash
pnpm prisma studio           # Open Prisma Studio GUI
pnpm prisma migrate dev      # Run migrations in development
pnpm prisma generate         # Regenerate Prisma client
pnpm prisma db push          # Push schema changes (dev only)
pnpm prisma migrate reset    # Reset database
```

### Linting
```bash
pnpm lint             # Run Next.js linter
```

## Architecture

### High-Level Structure

SpecBoard follows a three-layer architecture:

1. **Filesystem Layer**: Reads spec-kit markdown files from local filesystem
2. **Database Layer**: PostgreSQL stores project metadata (slugs, paths, user accounts for cloud sync)
3. **Application Layer**: Next.js App Router with React 19, Zustand state management

### Key Architectural Patterns

**Slug-Based Routing**: Projects are accessed via database-generated slugs (e.g., `/projects/my-todolist`) rather than filesystem paths. This provides clean URLs and decouples routing from filesystem structure.

**Parser-Driven Data Model**: The `parser.ts` module is the heart of the application. It reads markdown files and extracts structured data (tasks, user stories, phases, clarifications, etc.) which drives the entire UI.

**Real-Time Updates**: Server-Sent Events (SSE) via `/api/watch` provide live updates when spec files change on disk using `chokidar` file watching.

**Client-Side State**: Zustand store manages project state, recent projects list (persisted to localStorage), and keyboard navigation focus state.

### Data Flow

```
Filesystem (spec-kit files)
    ↓
Parser (lib/parser.ts) → Structured data
    ↓
API Routes (/api/project, /api/watch)
    ↓
Zustand Store (lib/store.ts)
    ↓
React Components (Kanban board, feature detail modal)
```

### URL Structure

| Route | Description |
|-------|-------------|
| `/` | Home page with recent projects |
| `/projects/:slug` | Project Kanban board (slug from database) |
| `/projects/:slug/features/:id` | Feature detail modal |
| `/projects/:slug/features/:id/spec` | Spec viewer |
| `/projects/:slug/features/:id/plan` | Plan viewer |
| `/cloud` | Cloud sync dashboard (OAuth authentication) |
| `/settings` | Application settings |
| `/shortcuts` | Keyboard shortcuts reference |

**Important**: URLs use database slugs (e.g., `my-project`), not filesystem paths. Projects are auto-registered via `/api/projects/register` which generates unique slugs from folder names.

## Project Structure

```
spec-board/
├── prisma/
│   ├── schema.prisma          # Database schema (Project, User, CloudProject, etc.)
│   └── migrations/            # Database migration history
├── src/
│   ├── app/
│   │   ├── page.tsx           # Home page
│   │   ├── layout.tsx         # Root layout
│   │   ├── projects/[name]/   # Dynamic project routes
│   │   ├── cloud/             # Cloud sync UI
│   │   └── api/               # API routes
│   │       ├── projects/      # Project CRUD (register, list, update, delete)
│   │       ├── project/       # Load and parse spec-kit files
│   │       ├── watch/         # SSE real-time updates
│   │       ├── browse/        # File browser for project selection
│   │       ├── checklist/     # Toggle checklist items
│   │       ├── analysis/      # Save AI analysis reports
│   │       ├── sync/          # Cloud sync operations
│   │       ├── auth/          # Better Auth OAuth
│   │       └── tokens/        # API token management
│   ├── components/
│   │   ├── feature-detail/    # Feature modal (split-view, navigation)
│   │   ├── kanban-board.tsx   # Main Kanban board
│   │   ├── *-viewer.tsx       # Content viewers (spec, plan, research, etc.)
│   │   ├── sync/              # Cloud sync UI components
│   │   └── ...
│   ├── lib/
│   │   ├── parser.ts          # Core markdown parser (spec-kit files)
│   │   ├── store.ts           # Zustand state management
│   │   ├── path-utils.ts      # Path validation and security
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── utils.ts           # General utilities (cn, colors, etc.)
│   │   ├── checklist-utils.ts # Checklist parsing and toggling
│   │   ├── markdown/          # Specialized parsers (plan, research, data-model, etc.)
│   │   ├── accessibility/     # Focus trap, announcements
│   │   ├── auth/              # Better Auth configuration
│   │   ├── services/          # Cloud sync services
│   │   └── sync/              # Sync utilities (checksum, diff)
│   └── types/
│       └── index.ts           # All TypeScript type definitions
├── .env                       # Environment variables (DATABASE_URL, PORT)
└── vitest.config.ts           # Vitest configuration
```

## Core Components

### Parser System (lib/parser.ts)

The parser is the most critical component. It reads spec-kit markdown files and extracts structured data:

**Key Functions**:
- `parseTaskLine()`: Parse task format `- [ ] T001 [P] [US1] Description`
- `parseTasksFile()`: Parse tasks.md into tasks and phases
- `parseUserStories()`: Extract user stories from spec.md
- `parseTechnicalContext()`: Extract tech context from plan.md
- `parseClarifications()`: Extract Q&A history from spec.md
- `parseConstitution()`: Parse constitution.md principles and sections
- `parseFeature()`: Parse entire feature directory (spec, plan, tasks, research, etc.)
- `parseProject()`: Parse entire project with all features

**Task Format**:
```markdown
- [ ] T001 [P] [US1] Description with file path
```
- `T001`: Task ID
- `[P]`: Parallel marker (optional)
- `[US1]`: User story reference (optional)

**Feature Stages**: `specify` → `plan` → `tasks` → `implement` → `complete`

### State Management (lib/store.ts)

Zustand store with localStorage persistence:

**State**:
- `project`: Current loaded project
- `selectedFeature`: Currently selected feature
- `recentProjects`: Recently opened projects (max 10, with slugs cached)
- `focusState`: Keyboard navigation focus (column, cardIndex, featureId)

**Key Actions**:
- `addRecentProject(project, slug?)`: Add/update project in recent list with metadata
- `loadRecentProjects()`: Load from localStorage
- `setFocusState()`: Update keyboard navigation focus

**RecentProject Structure**:
```typescript
{
  path: string;              // Filesystem path
  name: string;              // Project name
  slug?: string;             // Database slug for routing
  lastOpened: string;        // ISO date
  summary: string | null;    // From constitution.md
  activeFeature: { stage, featureName } | null;
  featureCount: number;
  completionPercentage: number;
  stageBreakdown: Record<FeatureStage, number>;
}
```

### Database Schema (prisma/schema.prisma)

**Local Projects**:
- `Project`: Stores project metadata (id, name/slug, displayName, filePath)

**Cloud Sync** (Feature 011):
- `User`: User accounts with OAuth support
- `CloudProject`: Cloud-hosted projects
- `SyncedSpec`: Spec files stored in cloud
- `ProjectMember`: Project membership with roles (VIEW, EDIT, ADMIN)
- `SyncEvent`: Audit log for sync operations
- `ConflictRecord`: Conflict resolution tracking
- `SpecVersion`: Version history for conflict resolution

### API Routes

**Project Management**:
- `POST /api/projects/register`: Auto-register project from filesystem path
- `GET /api/projects`: List all projects
- `GET /api/projects/:name`: Get project by slug
- `PUT /api/projects/:name`: Update project
- `DELETE /api/projects/:name`: Delete project

**Spec Data**:
- `GET /api/project?path=...`: Load and parse spec-kit project
- `GET /api/watch?path=...`: SSE stream for real-time updates
- `GET /api/browse?path=...`: Browse filesystem directories

**Checklist Interaction**:
- `POST /api/checklist`: Toggle checklist item in markdown file

**Analysis Reports**:
- `POST /api/analysis`: Save AI analysis report to feature directory

**Cloud Sync**:
- `POST /api/cloud-projects`: Create cloud project
- `GET /api/cloud-projects`: List user's cloud projects
- `POST /api/cloud-projects/connect`: Connect local project to cloud
- `POST /api/sync/:projectId/push`: Push local changes to cloud
- `GET /api/sync/:projectId/status`: Get sync status
- `GET /api/sync/:projectId/conflicts`: List conflicts
- `POST /api/sync/:projectId/conflicts/:id/resolve`: Resolve conflict

## Key Features

### Keyboard Navigation

Comprehensive keyboard shortcuts for accessibility:

**Kanban Board**:
- `Tab`: Navigate cards
- `Enter`: Open feature detail
- `Arrow keys`: Navigate within columns

**Feature Modal**:
- `Escape`: Close split view or modal
- `1-9`: Jump to section
- `Shift+1-9`: Open section in right pane (split view)
- `Ctrl+\`: Toggle split view
- `Tab`: Switch focus between panes
- `↑/↓`: Navigate sections
- `Enter`: Open selected section
- `Shift+Enter`: Open in split view

### Checklist Interaction

Users can toggle checklist items by clicking or pressing `Space`/`Enter`. The system:
1. Sends toggle request to `/api/checklist` with file path and line index
2. Server validates path, reads file, toggles checkbox
3. Writes updated content back to disk
4. File watcher triggers SSE update to refresh UI

### Real-Time Updates

File watching via `chokidar` monitors spec-kit directories. When files change:
1. Parser re-parses affected files
2. SSE connection sends updated project data to client
3. Zustand store updates
4. React components re-render

### Cloud Sync (Feature 011)

OAuth-based authentication with Better Auth. Users can:
- Create cloud projects
- Connect local projects to cloud via 6-character link codes
- Push/pull changes with conflict detection
- Resolve conflicts with 3-way merge UI
- Invite team members with role-based access (VIEW, EDIT, ADMIN)

## Code Conventions

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | `kebab-case.ts` | `kanban-board.tsx` |
| Components | `PascalCase` | `FeatureDetail` |
| Functions | `camelCase` | `parseTaskLine` |
| Types/Interfaces | `PascalCase` | `Feature`, `Task` |
| Constants | `UPPER_SNAKE_CASE` | `RECENT_PROJECTS_KEY` |

### Import Aliases

Use `@/` for all imports:
```typescript
import { parseProject } from '@/lib/parser';
import type { Feature } from '@/types';
import { cn } from '@/lib/utils';
```

### Component Structure

```typescript
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Feature } from '@/types';

interface Props {
  feature: Feature;
  onClose: () => void;
}

export function FeatureDetail({ feature, onClose }: Props) {
  // Implementation
}
```

### Styling

- **Tailwind CSS v4**: Use utility classes with `cn()` for conditional classes
- **CSS Variables**: Theme colors via `var(--foreground)`, `var(--border)`, etc.
- **Dark Mode**: Automatic via CSS custom properties
- **Icons**: `lucide-react` library

## Security

### Path Validation

All filesystem operations use `path-utils.ts` for security:
- `isPathSafe()`: Prevents directory traversal attacks
- `isValidDirectoryPath()`: Verifies path exists and is directory
- `normalizePath()`: Expands `~` to home directory

### Input Validation

- Project names validated against URL-safe slug pattern
- File paths validated before read/write operations
- Markdown content sanitized with DOMPurify before rendering

### Authentication

Better Auth with OAuth providers (Google, GitHub). API tokens for MCP server authentication.

## Testing

### Test Files

Tests are co-located with source files:
- `src/lib/parser.test.ts`
- `src/lib/path-utils.test.ts`
- `src/lib/utils.test.ts`
- `src/lib/markdown/*.test.ts`

### Running Tests

```bash
pnpm test              # Watch mode
pnpm test:run          # Single run
pnpm test:coverage     # With coverage
```

### Test Coverage

Vitest configured to cover:
- `src/lib/**/*.ts`
- `src/app/api/**/*.ts`

## Environment Variables

```bash
# Required
DATABASE_URL="postgresql://user:password@localhost:5432/specboard"

# Optional
PORT=3000                    # Default: 3000

# For Docker deployment
POSTGRES_USER=specboard
POSTGRES_PASSWORD=specboard
POSTGRES_DB=specboard
POSTGRES_PORT=5432
APP_PORT=3000
```

## Common Development Tasks

### Adding a New API Route

1. Create `src/app/api/your-route/route.ts`
2. Export `GET`, `POST`, `PUT`, or `DELETE` functions
3. Use `NextRequest` and `NextResponse` types
4. Validate inputs and handle errors

### Adding a New Parser

1. Create parser in `src/lib/markdown/your-parser.ts`
2. Export parsing function that returns structured data
3. Add types to `src/types/index.ts`
4. Write tests in `src/lib/markdown/your-parser.test.ts`
5. Integrate into `parseFeature()` in `lib/parser.ts`

### Adding a New Component

1. Create component in `src/components/your-component.tsx`
2. Use `'use client'` directive if interactive
3. Import types from `@/types`
4. Use `cn()` for conditional Tailwind classes
5. Follow accessibility best practices (ARIA labels, keyboard navigation)

### Modifying Database Schema

1. Edit `prisma/schema.prisma`
2. Run `pnpm prisma migrate dev --name your-migration-name`
3. Prisma client auto-regenerates
4. Update TypeScript types if needed

## Important Notes

- **Parser is server-only**: Uses Node.js `fs` module, cannot run in browser
- **URLs use slugs**: Never expose filesystem paths in URLs
- **Store persists to localStorage**: Recent projects cached client-side
- **Real-time via SSE**: Not WebSockets (simpler, more reliable)
- **Markdown is source of truth**: Database only stores metadata, not content
- **Path security is critical**: Always validate paths before filesystem operations
- **TypeScript strict mode**: All code must pass strict type checking
- **Accessibility first**: WCAG 2.2 AA compliance required

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker compose -f docker-compose.db.yml ps

# Reset database
pnpm prisma migrate reset
```

### Parser Errors

- Check markdown file format matches expected structure
- Verify file paths are absolute, not relative
- Check for malformed task lines (missing `T001` ID)

### Real-Time Updates Not Working

- Verify file watcher has permissions to watch directory
- Check SSE connection in browser DevTools Network tab
- Ensure project path is valid and accessible

┌─────────────────────────────────────────────────┐
│ Tóm tắt: Đã tạo file CLAUDE.md toàn diện với    │
│ thông tin về kiến trúc, lệnh phát triển, cấu    │
│ trúc dự án, các thành phần chính (parser, state │
│ management, database), API routes, quy ước code,│
│ bảo mật, testing và các tác vụ phát triển thông │
│ dụng. File này giúp Claude Code hiểu rõ codebase│
│ và làm việc hiệu quả hơn.                        │
└─────────────────────────────────────────────────┘
