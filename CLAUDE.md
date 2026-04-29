# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

SpecBoard is a visual dashboard for spec-kit projects with a Kanban board interface for tracking feature development. It uses a **database-first** architecture — all project content (specs, plans, tasks, clarifications) is stored in PostgreSQL.

**Legacy**: The `lib/parser.ts` module exists for parsing markdown files but is no longer used for the main data flow.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Prisma ORM (Supabase for cloud deployments)
- **Auth**: Better Auth with OAuth (Google, GitHub)
- **State**: Zustand
- **UI**: Tailwind CSS v4, shadcn/ui, Lucide icons
- **AI**: Configurable via `AIService` — supports OpenAI, Anthropic, or any OpenAI-compatible API
- **Code Execution**: E2B sandbox
- **Package Manager**: pnpm

## Commands

```bash
pnpm dev              # Start dev server (port 3000)
pnpm dev:all          # Dev server + worker
pnpm build            # Production build
pnpm start            # Start production server
pnpm lint             # Run linter
pnpm tsc --noEmit     # Type check

# Database
pnpm db:studio        # Open Prisma Studio
pnpm db:migrate       # Create migration (prisma migrate dev)
pnpm db:push          # Push schema to DB
pnpm db:seed          # Seed database
pnpm db:reset         # Reset database (migrate reset --force)

# Testing (vitest)
pnpm test             # Watch mode
pnpm test:run         # Run once
pnpm test:coverage    # With coverage
pnpm vitest run src/lib/parser.test.ts  # Single file
```

## Architecture

### Database-First Data Flow

```
PostgreSQL → API Routes (/api/project/[name]/data) → Zustand Store → React UI
```

The Feature model stores all content as text fields: `specContent`, `planContent`, `tasksContent`, `clarificationsContent`, `researchContent`, `dataModelContent`, `quickstartContent`, `contractsContent` (JSON), `checklistsContent` (JSON), `analysisContent`.

### Database Models

- **Project** → has many Features, has one Constitution
- **Feature** → has many UserStories, has many Tasks; tracks background job status (`jobStatus`, `jobProgress`, `jobMessage`)
- **UserStory** → belongs to Feature, has many Tasks
- **Task** → belongs to Feature, optionally belongs to UserStory
- **Constitution** → belongs to Project, has many ConstitutionVersions (version history)

### Workflow Stages

4-stage pipeline: **Backlog → Specs → Plan → Tasks**

| Stage | Description |
|-------|-------------|
| `backlog` | Feature ideas and descriptions |
| `specs` | Spec + Clarifications (merged from old specify + clarify stages) |
| `plan` | Implementation plan + checklist |
| `tasks` | Task breakdown + Analysis (analysis runs automatically) |

### URL Structure

| Route | Purpose |
|-------|---------|
| `/` | Home — project list from database |
| `/projects/:name` | Kanban board |
| `/projects/:name/features/:featureId` | Feature detail |
| `/projects/:name/features/:featureId/spec` | Spec view |
| `/projects/:name/features/:featureId/plan` | Plan view |
| `/auth/login` | OAuth login |
| `/cloud` | Cloud sync dashboard |
| `/shortcuts` | Keyboard shortcuts reference |

URLs use database slugs (Project `name` field), not filesystem paths.

### API Routes

- `/api/projects` — CRUD for projects
- `/api/project/:name/data` — Load full project data from database
- `/api/browse` — List all projects
- `/api/spec-workflow/specify` — Generate spec from description
- `/api/spec-workflow/clarify` — Generate clarification questions
- `/api/spec-workflow/plan` — Generate implementation plan
- `/api/spec-workflow/checklist` — Generate quality checklist
- `/api/spec-workflow/tasks` — Generate task breakdown
- `/api/spec-workflow/analyze` — Analyze consistency
- `/api/checklist` — Toggle checklist items
- `/api/sync/*` — Cloud sync operations
- `/api/auth/*` — Better Auth OAuth

### State Management

Zustand store (`src/lib/store.ts`) manages: `project`, `selectedFeature`, `focusState` (keyboard navigation with column/cardIndex/featureId).

### AI Integration

All AI operations go through `AIService` from `src/lib/ai/client.ts`. Settings stored in database, retrieved via `getAISettings()`.

## Mandatory Policies

- **ALWAYS use FeatureDetailV2** (`src/components/feature-detail-v2/`) — the only supported feature detail UI
- **ALWAYS use real AI** — call actual AI APIs via `AIService`, never mock data. If no API key is configured, throw an error.
- Use `getAISettings()` to retrieve API keys from database

## Code Conventions

- **Imports**: Use `@/` alias (e.g., `import from '@/lib/store'`)
- **Components**: `'use client'` directive, PascalCase, `cn()` for conditional classes
- **Types**: Import from `@/types`
- **Styling**: Tailwind CSS v4 with CSS variables (`var(--foreground)`, etc.)
- **File naming**: kebab-case

## Testing

Tests co-located with source files: `src/lib/*.test.ts`, `src/app/api/**/*.test.ts`

## Key Files

| File | Purpose |
|------|---------|
| `src/app/api/project/[name]/data/route.ts` | Main DB-first data endpoint |
| `src/lib/store.ts` | Zustand state management |
| `src/lib/ai/client.ts` | AI service (real implementations only) |
| `prisma/schema.prisma` | Database schema |
| `src/components/feature-detail-v2/` | Feature detail UI (ONLY supported) |
| `src/components/kanban-board.tsx` | Kanban board with stage transitions |
| `src/lib/path-utils.ts` | Path validation (`isPathSafe()`) for security |
| `scripts/migrate-stages.ts` | Migration script for stage changes |
| `scripts/worker.ts` | BullMQ worker for background jobs |

## Stage Migrations

When workflow stages change, run: `pnpm tsx scripts/migrate-stages.ts`

## Security

- All filesystem operations use `isPathSafe()` from `src/lib/path-utils.ts` to prevent directory traversal
- HTML content sanitized with DOMPurify before rendering

## Environment Setup

Copy `.env.example` to `.env` and configure:
- `DATABASE_URL` — PostgreSQL connection string
- `POSTGRES_URL_NON_POOLING` — Direct connection (non-pooled, for migrations)
- `BETTER_AUTH_SECRET` — Auth secret key
- AI provider API keys (OpenAI, Anthropic, etc.)
