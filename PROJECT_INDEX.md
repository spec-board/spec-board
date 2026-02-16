# PROJECT_INDEX.md

> Auto-generated codebase index for SpecBoard
> Last updated: 2026-02-16

## Overview

**SpecBoard** is a real-time dashboard for visualizing spec-kit projects. It provides a Kanban-style interface for tracking feature development through stages (specify → plan → tasks → implement → complete), with live updates via Server-Sent Events (SSE).

**Version:** 1.1.0
**License:** AGPL-3.0 (with commercial licensing available)
**Package Manager:** pnpm 10.26.0

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16.1.1 (App Router) |
| **Language** | TypeScript 5.9.3 (strict mode) |
| **UI** | React 19.2.3, Tailwind CSS v4.x, Lucide Icons |
| **Database** | PostgreSQL via Prisma ORM |
| **State** | Zustand (client), localStorage persistence |
| **Markdown** | remark, DOMPurify |
| **File Watching** | chokidar |
| **AI** | OpenAI-compatible API (Ollama, LM Studio, etc.) |
| **Auth** | Better Auth with OAuth |

## Architecture

```
spec-board/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Home - recent projects + open modal
│   │   ├── layout.tsx          # Root layout
│   │   ├── globals.css         # Tailwind + CSS variables
│   │   ├── settings/           # Settings page
│   │   │   └── page.tsx        # Shortcuts + About (README/Changelog)
│   │   ├── api/                # API routes
│   │   │   ├── app-info/       # App metadata (version, readme, changelog)
│   │   │   ├── projects/       # Project CRUD + registration
│   │   │   ├── project/        # Load spec data from filesystem
│   │   │   ├── browse/         # Directory browser
│   │   │   └── watch/          # SSE real-time updates
│   │   └── projects/[name]/    # Project dashboard routes
│   │       ├── page.tsx        # Kanban board view
│   │       └── features/[featureId]/
│   │           ├── page.tsx    # Feature detail
│   │           ├── spec/       # Spec viewer
│   │           └── plan/       # Plan viewer
│   ├── components/             # React UI components
│   │   ├── feature-detail-v2/  # NEW: Feature detail modal (Jira-like layout)
│   │   ├── feature-detail/      # Legacy feature detail modal
│   │   ├── kanban-board.tsx    # Kanban board view
│   │   ├── cloud/              # Cloud sync UI components
│   │   ├── sync/               # Sync UI components
│   │   └── ...
│   ├── lib/                    # Utilities and business logic
│   │   ├── parser.ts           # Markdown parsing (core logic)
│   │   ├── markdown/           # Specialized markdown parsers
│   │   ├── path-utils.ts       # Path validation/security
│   │   ├── prisma.ts           # Database client
│   │   ├── store.ts            # Zustand state management
│   │   ├── utils.ts            # General utilities
│   │   ├── ai/                 # AI client (OpenAI-compatible)
│   │   ├── auth/               # Better Auth configuration
│   │   ├── services/           # Cloud sync services
│   │   ├── sync/               # Sync utilities
│   │   └── accessibility/      # A11y utilities
│   └── types/                  # TypeScript definitions
│       └── index.ts            # All shared types
├── prisma/
│   └── schema.prisma           # Database schema (PostgreSQL)
├── .github/
│   └── PULL_REQUEST_TEMPLATE.md # PR template with CLA
├── CLA.md                      # Contributor License Agreement
├── CONTRIBUTING.md             # Development guide
├── LICENSE                     # AGPL-3.0
└── .claude/                    # SoupSpec configuration
```

## Key Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION                          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Home Page (src/app/page.tsx)                                   │
│  - Recent projects list (from localStorage + Zustand)           │
│  - Open project modal (filesystem browser)                      │
│  - Auto-registers project → gets slug → navigates               │
└─────────────────────────────────────────────────────────────────┘
                                │
                    POST /api/projects/register
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Project Registration (src/app/api/projects/register/route.ts)  │
│  - Validates path exists and is spec-kit project                │
│  - Returns existing project or creates new with unique slug     │
│  - Slug generated from folder name (e.g., "my-todolist")        │
└─────────────────────────────────────────────────────────────────┘
                                │
                    Navigate to /projects/{slug}
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Project Page (src/app/projects/[name]/page.tsx)                │
│  1. GET /api/projects/{slug} → get filePath from database       │
│  2. GET /api/project?path={filePath} → parse spec-kit files     │
│  3. SSE /api/watch?path={filePath} → real-time updates          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Parser (src/lib/parser.ts)                                     │
│  - parseProject() → Project with features, constitution         │
│  - parseFeature() → Feature with tasks, phases, user stories    │
│  - parseTasksFile() → Tasks with [P], [USx] markers             │
│  - parseClarifications() → Q&A history from spec.md             │
│  - parseUserStories() → User stories from spec.md               │
│  - parseTechnicalContext() → Tech context from plan.md          │
└─────────────────────────────────────────────────────────────────┘
```

## URL Routing

| Route | Purpose |
|-------|---------|
| `/` | Home - recent projects, open project modal |
| `/settings` | Settings - keyboard shortcuts, about (README/Changelog) |
| `/projects/{slug}` | Project dashboard with Kanban board |
| `/projects/{slug}/features/{featureId}` | Feature detail modal |
| `/projects/{slug}/features/{featureId}/spec` | Full-page spec viewer |
| `/projects/{slug}/features/{featureId}/plan` | Full-page plan viewer |

**Note:** URLs use database slugs (e.g., `todolist`) not filesystem paths.

## API Endpoints

### Project Management
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/projects` | GET/POST | List/create projects |
| `/api/projects/register` | POST | Auto-register project from path |
| `/api/projects/{slug}` | GET/PUT/DELETE | Project CRUD |

### Spec Data
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/project?path=...` | GET | Parse spec-kit project |
| `/api/browse?path=...` | GET | List directory |
| `/api/watch?path=...` | GET | SSE real-time updates |

### Spec Workflow (AI)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/spec-workflow/specify` | POST | Generate spec from description |
| `/api/spec-workflow/clarify` | POST | Generate clarification questions |
| `/api/spec-workflow/plan` | POST | Generate implementation plan |
| `/api/spec-workflow/tasks` | POST | Generate tasks |
| `/api/spec-workflow/analyze` | POST | Analyze consistency |
| `/api/spec-workflow/constitution` | POST | Create constitution |

### Cloud Sync
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/cloud-projects` | GET/POST | Cloud project CRUD |
| `/api/cloud-projects/connect` | POST | Connect local to cloud |
| `/api/sync/{id}/push` | POST | Push changes to cloud |
| `/api/sync/{id}/status` | GET | Get sync status |
| `/api/sync/{id}/conflicts` | GET | List conflicts |

### Other
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/checklist` | POST | Toggle checklist item |
| `/api/analysis` | POST | Save analysis report |
| `/api/app-info` | GET | App metadata |

## Core Types

```typescript
// Feature stages (Kanban columns)
type FeatureStage = 'specify' | 'plan' | 'tasks' | 'implement' | 'complete';

// Spec-Kit file types
type SpecKitFileType = 'spec' | 'plan' | 'tasks' | 'research' | 'data-model' | 'quickstart' | 'contract' | 'checklist' | 'analysis';

interface SpecKitFile {
  type: SpecKitFileType;
  content: string;
  path: string;
}

// Main domain types
interface Project {
  path: string;
  name: string;
  features: Feature[];
  constitution: Constitution | null;
  hasConstitution: boolean;
}

interface Feature {
  id: string;
  name: string;
  path: string;
  stage: FeatureStage;
  hasSpec: boolean;
  hasPlan: boolean;
  hasTasks: boolean;
  tasks: Task[];
  phases: TaskPhase[];
  userStories: UserStory[];
  taskGroups: TaskGroup[];
  branch: string | null;
  clarificationSessions: ClarificationSession[];
  specContent: string | null;
  planContent: string | null;
  tasksContent: string | null;
  additionalFiles: SpecKitFile[];
  analysis: FeatureAnalysis | null;
}

interface Task {
  id: string;
  description: string;
  completed: boolean;
  parallel: boolean;
  userStory?: string;
  filePath?: string;
}
```

## Component Hierarchy

```
App
├── Home Page
│   ├── RecentProjectsList
│   └── OpenProjectModal
│
└── Project Page
    ├── ConstitutionPanel
    ├── ClarityHistoryPanel
    ├── KanbanBoard
    │   └── FeatureCard (per feature)
    └── FeatureDetail (full-screen modal)
        ├── HeaderBar
        ├── NavSidebar
        │   ├── StatusHeader
        │   └── NavItem[] (grouped by phase)
        │       └── SectionIcon
        └── SplitView
            ├── ContentPane (left)
            │   └── [SpecViewer|PlanViewer|TaskGroup|...]
            └── ContentPane (right, optional)
```

## Key Files Reference

| File | Purpose | Lines |
|------|---------|-------|
| `src/lib/parser.ts` | Core markdown parsing logic | ~720 |
| `src/app/projects/[name]/page.tsx` | Project dashboard | ~265 |
| `src/components/feature-detail/feature-detail.tsx` | Feature modal with split-view | ~510 |
| `src/components/feature-detail/types.ts` | Feature detail types and constants | ~190 |
| `src/components/kanban-board.tsx` | Kanban board UI | ~240 |
| `src/components/readme-viewer.tsx` | Beautified README with custom diagrams | ~420 |
| `src/components/changelog-viewer.tsx` | Version timeline with badges | ~180 |
| `src/app/settings/page.tsx` | Settings page (shortcuts + about) | ~400 |
| `src/types/index.ts` | All TypeScript types | ~160 |
| `src/lib/store.ts` | Zustand state management | ~225 |
| `src/app/api/projects/register/route.ts` | Auto-registration API | ~125 |
| `CLA.md` | Contributor License Agreement | ~70 |
| `CONTRIBUTING.md` | Development guide and PR guidelines | ~400 |

## Spec-Kit File Structure

SpecBoard expects projects with this structure:

```
project/
├── specs/                      # Feature specifications
│   └── {feature-name}/
│       ├── spec.md             # Feature specification
│       ├── plan.md             # Implementation plan
│       ├── tasks.md            # Task list with checkboxes
│       ├── research.md         # (optional) Research notes
│       ├── data-model.md       # (optional) Data model docs
│       ├── quickstart.md       # (optional) Quick start guide
│       ├── contracts/          # (optional) API contracts
│       ├── checklists/         # (optional) Checklists
│       └── analysis/           # (optional) Spec alignment
│           ├── analysis.json
│           └── analysis.md
└── .specify/
    └── memory/
        └── constitution.md     # Project principles
```

## Task Format

Tasks in `tasks.md` follow this format:

```markdown
## Phase 1: Setup

- [ ] T001 [P] [US1] Create project structure
- [x] T002 [US1] Initialize database
- [ ] T003 [P] Add authentication

## Phase 2: US2 – Edit Tasks

- [ ] T004 [US2] Implement edit form
```

Markers:
- `[P]` - Parallel task (can run concurrently)
- `[USx]` - User story association
- Phase names with `USx –` auto-assign user story to tasks

## Security Features

- Path traversal protection via `isPathSafe()`
- Input validation on all API endpoints
- Slug pattern validation for project names
- DOMPurify for markdown HTML sanitization
- No hardcoded secrets (env vars only)

## Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation (arrow keys, number shortcuts)
- Focus trapping in modals
- Screen reader announcements
- High contrast CSS variables

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Run tests
pnpm test

# Run tests once
pnpm test:run

# Build for production
pnpm build
```

## Database

PostgreSQL database managed by Prisma:

```prisma
model Project {
  id          String   @id @default(uuid())
  name        String   @unique  // URL slug
  displayName String
  filePath    String              // Filesystem path
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Recent Changes

- **FeatureDetailV2**: New Jira-like layout with user story panel, task hierarchy, and document panels
- **AI Integration**: OpenAI-compatible AI client with spec-workflow API endpoints
- **Cloud Sync**: OAuth-based cloud sync with Better Auth, conflict resolution
- **SpecKitFileType**: Added support for 9 file types (spec, plan, tasks, research, data-model, quickstart, contract, checklist, analysis)
- **UI Rebrand**: Tailwind CSS v4 with new design system

## Mandatory Policies

### UI Requirements
- **ALWAYS use FeatureDetailV2**: The new UI component at `src/components/feature-detail-v2/` is the ONLY supported UI. Never use the legacy `FeatureDetail` component.
- **No legacy mode**: Never use `?legacy=true` query parameter to access old UI.

### AI API Requirements
- **ALWAYS use real AI**: AI functions MUST call actual AI APIs (Anthropic Claude or OpenAI). Never return mock data.
- **AI settings from database**: Use `getAISettings()` to retrieve API keys from the database (not hardcoded).
- **AIService from client.ts**: All AI operations MUST use the `AIService` class from `src/lib/ai/client.ts` which contains real implementations.
- **No mock fallback**: Do NOT use mock implementations. If no API key is configured, throw an error instead of returning fake data.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, architecture, and contribution guidelines.

**License:** Available under [AGPL-3.0](LICENSE) or commercial license. Contributors must agree to the [CLA](CLA.md).

## Generated CLAUDE.md Files

The following directories have CLAUDE.md files for context:
- `src/CLAUDE.md` - Source directory overview
- `src/app/CLAUDE.md` - App Router pages and API routes
- `src/app/api/CLAUDE.md` - API routes documentation
- `src/components/CLAUDE.md` - UI components
- `src/components/feature-detail/CLAUDE.md` - Legacy feature modal
- `src/components/feature-detail-v2/` - NEW: Jira-like feature modal
- `src/components/cloud/CLAUDE.md` - Cloud sync UI
- `src/components/sync/CLAUDE.md` - Sync UI
- `src/lib/CLAUDE.md` - Utilities and helpers
- `src/lib/ai/CLAUDE.md` - AI client (NEW)
- `src/lib/auth/CLAUDE.md` - Better Auth (NEW)
- `src/lib/markdown/CLAUDE.md` - Markdown parsers
- `src/lib/services/CLAUDE.md` - Cloud sync services
- `src/lib/sync/CLAUDE.md` - Sync utilities
- `src/lib/shortcuts/CLAUDE.md` - Keyboard shortcuts
- `src/lib/accessibility/CLAUDE.md` - Accessibility
- `src/types/CLAUDE.md` - Type definitions
- `prisma/CLAUDE.md` - Database schema
