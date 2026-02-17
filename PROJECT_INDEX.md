# PROJECT_INDEX.md

> Auto-generated codebase index for SpecBoard
> Last updated: 2026-02-17

## Overview

**SpecBoard** is a visual dashboard for spec-kit projects with a Kanban board interface for tracking feature development. It uses a **database-first** architecture - all project content (specs, plans, tasks, clarifications) is stored in PostgreSQL.

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
| **Markdown** | remark, unified, DOMPurify |
| **File Watching** | chokidar |
| **AI** | Anthropic Claude API (OpenAI-compatible) |
| **Auth** | Better Auth with OAuth |
| **Code Execution** | E2B Code Interpreter |

## Architecture

```
spec-board/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Home - project list from database
│   │   ├── layout.tsx          # Root layout
│   │   ├── globals.css         # Tailwind + CSS variables
│   │   ├── settings/           # Settings page
│   │   ├── cloud/              # Cloud sync dashboard
│   │   ├── auth/               # Authentication pages
│   │   ├── shortcuts/          # Keyboard shortcuts page
│   │   ├── projects/[name]/    # Project dashboard routes
│   │   │   ├── page.tsx        # Kanban board view
│   │   │   └── features/[featureId]/
│   │   │       ├── page.tsx    # Feature detail modal
│   │   │       ├── spec/       # Spec viewer
│   │   │       ├── plan/       # Plan viewer
│   │   │       └── spec/       # Feature spec page
│   │   └── api/                # API routes (26 endpoints)
│   ├── components/              # React UI components (50+)
│   │   ├── feature-detail-v2/   # Feature detail (Jira-like layout)
│   │   ├── feature-detail/      # Legacy feature detail
│   │   ├── kanban-board.tsx    # Kanban board view
│   │   ├── cloud/              # Cloud sync UI
│   │   ├── sync/               # Sync UI components
│   │   ├── drivers/            # E2B code execution
│   │   └── *-viewer.tsx        # Content viewers
│   ├── lib/                    # Utilities and business logic
│   │   ├── parser.ts           # Markdown parsing (legacy, DB-first now)
│   │   ├── markdown/           # Specialized markdown parsers
│   │   ├── path-utils.ts       # Path validation/security
│   │   ├── prisma.ts           # Database client
│   │   ├── store.ts            # Zustand state management
│   │   ├── settings-store.ts   # Settings persistence
│   │   ├── utils.ts            # General utilities
│   │   ├── ai/                 # AI client (Anthropic Claude)
│   │   ├── auth/               # Better Auth configuration
│   │   ├── services/           # Cloud sync services
│   │   ├── sync/               # Sync utilities
│   │   ├── drivers/            # E2B code execution
│   │   ├── validations/        # Input validation
│   │   └── accessibility/      # A11y utilities
│   └── types/                  # TypeScript definitions
│       └── index.ts            # All shared types
├── prisma/
│   └── schema.prisma           # Database schema (PostgreSQL)
├── e2e/                        # Playwright E2E tests
├── docs/                       # Documentation
├── .github/
│   └── PULL_REQUEST_TEMPLATE.md # PR template with CLA
├── CLA.md                       # Contributor License Agreement
├── CONTRIBUTING.md              # Development guide
└── .claude/                    # SoupSpec configuration
```

## Database-First Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE (PostgreSQL)                        │
│  - Projects, Features, Tasks, User Stories, Constitution        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  API Routes (/api/project/[name]/data, /api/browse)             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Zustand Store (lib/store.ts, settings-store.ts)                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  React UI Components                                           │
└─────────────────────────────────────────────────────────────────┘
```

## URL Routing

| Route | Purpose |
|-------|---------|
| `/` | Home - project list from database |
| `/settings` | Settings - keyboard shortcuts, about |
| `/cloud` | Cloud sync dashboard |
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
| `/api/projects/register` | POST | Auto-register project |
| `/api/projects/[name]` | GET/PUT/DELETE | Project CRUD |

### Database-First Data
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/project/[name]/data` | GET | Load project data from database |
| `/api/browse` | GET | List all projects |

### Spec Workflow (AI)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/spec-workflow/specify` | POST | Generate spec |
| `/api/spec-workflow/clarify` | POST | Generate clarifications |
| `/api/spec-workflow/plan` | POST | Generate plan |
| `/api/spec-workflow/tasks` | POST | Generate tasks |
| `/api/spec-workflow/analyze` | POST | Analyze consistency |

### Feature Management
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/features/[id]` | GET/PUT/DELETE | Feature CRUD |
| `/api/kanban` | GET/PUT | Kanban state |
| `/api/stories` | GET/POST | User stories |
| `/api/tasks` | GET/POST | Tasks |
| `/api/prd-to-us` | POST | PRD to user stories |

### Cloud Sync
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/cloud-projects` | GET/POST | Cloud project CRUD |
| `/api/cloud-projects/connect` | POST | Connect local to cloud |
| `/api/sync/[id]/push` | POST | Push to cloud |
| `/api/sync/[id]/status` | GET | Sync status |
| `/api/sync/[id]/conflicts` | GET | List conflicts |

### Code Execution
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/drivers/connect` | POST | Connect E2B sandbox |
| `/api/drivers/execute` | POST | Execute code |
| `/api/drivers/status` | GET | Session status |

### Other
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/checklist` | PATCH | Toggle checklist item |
| `/api/analysis` | POST | Save analysis |
| `/api/app-info` | GET | App metadata |
| `/api/settings` | GET/PUT | Settings CRUD |

## Core Types

```typescript
// Feature stages (Kanban columns)
type FeatureStage = 'backlog' | 'spec' | 'planning' | 'in_progress' | 'done';

// Spec-Kit file types
type SpecKitFileType = 'spec' | 'plan' | 'tasks' | 'research' | 'data-model' | 'quickstart' | 'contract' | 'checklist' | 'analysis';

// Database-first Feature model
interface Feature {
  id: string;
  name: string;
  stage: FeatureStage;
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
  tasks: Task[];
  userStories: UserStory[];
}
```

## Component Hierarchy

```
App
├── Home Page (src/app/page.tsx)
│   ├── ProjectList
│   ├── RecentProjectsList
│   ├── OpenProjectModal
│   ├── CreateProjectModal
│   └── DeleteProjectModal
│
├── Project Page (src/app/projects/[name]/page.tsx)
│   ├── Header
│   ├── KanbanBoard
│   │   └── FeatureCard (per feature)
│   ├── ConstitutionPanel
│   └── FeatureDetailV2 (modal)
│       ├── HeaderBar
│       ├── NavSidebar
│       │   └── SectionIcon
│       └── SplitView
│           └── ContentPane
│
├── Feature Pages
│   ├── Spec Viewer
│   └── Plan Viewer
│
├── Settings Page
│   └── ShortcutsHelp
│
└── Cloud Page
    └── CloudSync Dashboard
```

## Key Files Reference

| File | Purpose | Lines |
|------|---------|-------|
| `src/lib/parser.ts` | Core markdown parsing | ~900 |
| `src/lib/store.ts` | Zustand state management | ~50 |
| `src/lib/settings-store.ts` | Settings persistence | ~150 |
| `src/app/projects/[name]/page.tsx` | Project dashboard | ~300 |
| `src/components/kanban-board.tsx` | Kanban board UI | ~500 |
| `src/components/feature-detail-v2/` | Jira-like feature modal | ~1000 |
| `src/types/index.ts` | All TypeScript types | ~200 |
| `src/lib/ai/client.ts` | AI service | ~300 |

## Mandatory Policies

### UI Requirements
- **ALWAYS use FeatureDetailV2**: The Jira-like UI at `src/components/feature-detail-v2/` is the ONLY supported UI. Never use legacy `FeatureDetail`.
- **No legacy mode**: Never use `?legacy=true` to access old UI.

### AI Requirements
- **ALWAYS use real AI**: Call actual AI APIs (Anthropic Claude). Never mock data.
- **AI settings from database**: Use `getAISettings()` to retrieve API keys.
- **Use AIService**: All AI operations MUST use `AIService` from `src/lib/ai/client.ts`.
- **No mock fallback**: If no API key is configured, throw an error.

## Security Features

- Path traversal protection via `isPathSafe()`
- Input validation on all API endpoints
- Slug pattern validation for project names
- DOMPurify for markdown HTML sanitization
- No hardcoded secrets (env vars only)
- Rate limiting on public APIs

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

# Run E2E tests
npx playwright test
```

## Generated CLAUDE.md Files

The following directories have CLAUDE.md files for context-aware development:

| Directory | Status |
|-----------|--------|
| `src/CLAUDE.md` | ✅ Source overview |
| `src/app/CLAUDE.md` | ✅ App Router pages |
| `src/app/api/CLAUDE.md` | ✅ API routes |
| `src/components/CLAUDE.md` | ✅ UI components |
| `src/components/feature-detail/CLAUDE.md` | ✅ Legacy feature modal |
| `src/components/feature-detail-v2/` | ✅ Jira-like modal |
| `src/components/cloud/CLAUDE.md` | ✅ Cloud sync UI |
| `src/components/sync/CLAUDE.md` | ✅ Sync UI |
| `src/components/drivers/CLAUDE.md` | ✅ Code execution UI |
| `src/lib/CLAUDE.md` | ✅ Utilities |
| `src/lib/ai/CLAUDE.md` | ✅ AI client |
| `src/lib/auth/CLAUDE.md` | ✅ Better Auth |
| `src/lib/markdown/CLAUDE.md` | ✅ Markdown parsers |
| `src/lib/services/CLAUDE.md` | ✅ Cloud services |
| `src/lib/sync/CLAUDE.md` | ✅ Sync utilities |
| `src/lib/drivers/CLAUDE.md` | ✅ E2B drivers |
| `src/lib/validations/CLAUDE.md` | ✅ Validation |
| `src/lib/shortcuts/CLAUDE.md` | ✅ Keyboard shortcuts |
| `src/lib/accessibility/CLAUDE.md` | ✅ A11y utilities |
| `src/types/CLAUDE.md` | ✅ Type definitions |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, architecture, and contribution guidelines.

**License:** Available under [AGPL-3.0](LICENSE) or commercial license. Contributors must agree to the [CLA](CLA.md).
