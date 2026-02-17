# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

SpecBoard is a visual dashboard for spec-kit projects with a Kanban board interface for tracking feature development. It uses a **database-first** architecture - all project content (specs, plans, tasks, clarifications) is stored in PostgreSQL.

**Legacy**: The `lib/parser.ts` module exists for parsing markdown files but is no longer used for the main data flow.

## Commands

```bash
pnpm dev              # Start development server (port 3000)
pnpm build            # Build for production
pnpm start            # Start production server
pnpm test             # Run tests in watch mode
pnpm test:run        # Run tests once
pnpm test:coverage   # Run tests with coverage
pnpm tsc --noEmit    # Type check
pnpm lint            # Run linter
pnpm prisma studio   # Open Prisma Studio
pnpm prisma migrate dev --name migration_name  # Create migration
```

## Architecture

### Database-First

All content is stored in PostgreSQL. The Feature model contains content fields:
- `specContent`, `planContent`, `tasksContent`, `clarificationsContent`
- `researchContent`, `dataModelContent`, `quickstartContent`
- `contractsContent`, `checklistsContent`, `analysisContent`

### Data Flow

```
PostgreSQL → API Routes (/api/project/[name]/data) → Zustand Store → React UI
```

### URL Structure

| Route | Purpose |
|-------|---------|
| `/` | Home - project list from database |
| `/projects/:slug` | Kanban board (slug from DB) |
| `/projects/:slug/features/:id` | Feature detail modal |
| `/cloud` | Cloud sync dashboard |
| `/settings` | App settings |

**Important**: URLs use database slugs, not filesystem paths.

## Core Patterns

### API Routes

- `/api/projects` - CRUD for projects (name/slug stored in DB)
- `/api/project/:name/data` - Load project data from database
- `/api/browse` - List all projects from database
- `/api/spec-workflow/*` - AI workflow endpoints (save to DB)
- `/api/checklist` - Toggle checklist items
- `/api/sync/*` - Cloud sync operations
- `/api/auth/*` - Better Auth OAuth

### State Management

Zustand store (`lib/store.ts`) manages:
- `project`: Current loaded project
- `selectedFeature`: Currently selected feature
- `focusState`: Keyboard navigation (column, cardIndex, featureId)

### AI Integration

All AI operations use `AIService` from `src/lib/ai/client.ts`. AI settings stored in database, retrieved via `getAISettings()`.

## Mandatory Policies

### UI Requirements
- **ALWAYS use FeatureDetailV2** (`src/components/feature-detail-v2/`) - the only supported UI
- Never use `?legacy=true` to access old UI

### AI Requirements
- **ALWAYS use real AI** - call actual AI APIs, never mock data
- Use `getAISettings()` to retrieve API keys from database
- Use `AIService` from `src/lib/ai/client.ts` for all AI operations
- If no API key configured, throw an error - do NOT fallback to fake data

## Code Conventions

- **Imports**: Use `@/` alias (e.g., `import from '@/lib/store'`)
- **Components**: `'use client'` directive, PascalCase, `cn()` for conditional classes
- **Types**: Import from `@/types`
- **Styling**: Tailwind CSS v4 with CSS variables (`var(--foreground)`, etc.)

## Testing

Tests co-located with source files:
- `src/lib/*.test.ts`
- `src/app/api/**/*.test.ts`

Run specific test: `pnpm vitest run src/lib/parser.test.ts`

## Key Files

| File | Purpose |
|------|---------|
| `src/app/api/project/[name]/data/route.ts` | Main DB-first data endpoint |
| `src/lib/store.ts` | Zustand state management |
| `src/lib/ai/client.ts` | AI service with real implementations |
| `prisma/schema.prisma` | Database schema |
| `src/components/feature-detail-v2/` | Feature detail UI (ONLY supported) |
