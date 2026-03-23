# SpecBoard

> Visual dashboard that helps non-technical teams create, organize, and manage professional software specifications and documentation.

![License](https://img.shields.io/badge/license-MIT-green.svg)
![Version](https://img.shields.io/badge/version-2.3.0-black.svg)

Turn ideas into structured specs -- no coding required. SpecBoard provides a drag-and-drop Kanban interface to move features through a 4-stage AI-powered pipeline: **Backlog** > **Specs** > **Plan** > **Tasks**.

## Screenshots

### Kanban Board

Track features across your development pipeline with a 4-column Kanban board showing progress metrics for tasks and checklists.

![Kanban Board](https://github.com/spec-board/spec-board/blob/main/public/assests/board.png)

### Feature Detail View

Deep dive into specifications with structured user stories, acceptance scenarios, edge cases, and implementation guidance.

![Feature Detail](https://github.com/spec-board/spec-board/blob/main/public/assests/spec.png)

### AI-Powered Spec Generation

Generate complete feature specifications from natural language. Configure your preferred LLM provider (OpenAI, Anthropic, or any OpenAI-compatible API) with custom base URLs for self-hosted models.

### Spec Workflow Wizard

AI-powered 4-stage workflow: backlog > specs > plan > tasks

<p align="center">
  <img src="https://github.com/spec-board/spec-board/blob/main/public/assests/suggestion-next-action.png" alt="Next Action Suggestions" width="400" />
  <img src="https://github.com/spec-board/spec-board/blob/main/public/assests/save-the-analysis.png" alt="Save Analysis Report" width="300" />
</p>

## Features

### Core
- **Kanban Board** -- 4-column pipeline (Backlog > Specs > Plan > Tasks) with drag-and-drop
- **AI Spec Generation** -- Enter a feature name and description, AI generates spec, plan, and tasks
- **Spec Workflow Wizard** -- 4-stage AI workflow with automatic stage transitions
- **Multi-Provider AI** -- API Key providers (OpenAI, Anthropic, Gemini, Mistral, etc.) with optimistic toggle and preset defaults
- **Constitution System** -- AI-generated project constitution from description, with version history
- **Skeleton Loading** -- Responsive loading screens with animated placeholders for every route
- **Deep Linking** -- Shareable URLs for projects and features
- **Progress Tracking** -- Visual metrics for tasks, checklists, and user stories
- **Accessible** -- WCAG 2.2 AA compliant with full keyboard navigation

### Cloud Sync & Collaboration
- **Supabase PostgreSQL** -- Cloud database with Prisma ORM and connection pooling
- **OAuth Authentication** -- Login with Google or GitHub
- **Team Collaboration** -- Role-based access control (VIEW, EDIT, ADMIN)
- **Conflict Resolution** -- 3-way merge with visual diff viewer
- **Version History** -- Last 30 versions retained per spec file

### Developer Experience
- **Mono Design System** -- Minimal monochromatic UI with semantic design tokens
- **Theme Dropdown** -- Light, Dark, System modes with animated dropdown selector
- **Split-View Modal** -- Resizable panes for viewing multiple sections simultaneously
- **Keyboard Shortcuts** -- Navigate features and sections with number keys
- **React Compiler** -- Automatic memoization for optimal re-rendering

## How It Works

```
┌──────────────┐      ┌──────────────┐      ┌──────────────────┐
│              │      │              │      │                  │
│  spec-kit    │ ---> │  SpecBoard   │ ---> │   Kanban Board   │
│  project     │      │  parses      │      │                  │
│              │      │              │      │  ┌──┐┌──┐┌──┐┌──┐│
│  specs/      │      │  spec.md     │      │  │B ││S ││P ││T ││
│  ├─ feature/ │      │  plan.md     │      │  └──┘└──┘└──┘└──┘│
│  │  ├─ spec  │      │  tasks.md    │      │                  │
│  │  ├─ plan  │      │              │      │                  │
│  │  ├─ tasks │      │              │      │                  │
│  │  └─ ...   │      │              │      │                  │
└──────────────┘      └──────────────┘      └──────────────────┘

B = Backlog | S = Specs | P = Plan | T = Tasks
```

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- A Supabase project (or any PostgreSQL database)

### Setup

```bash
pnpm install
cp .env.example .env
```

Add your database connection string to `.env`:

```env
POSTGRES_PRISMA_URL="postgresql://..."
```

Run the database migration and start the dev server:

```bash
pnpm prisma db push
pnpm dev
```

### Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm start            # Start production server
pnpm test             # Run tests (watch mode)
pnpm test:run         # Run tests once
pnpm test:coverage    # Run tests with coverage
```

## URL Structure

```
/                                          Home (recent projects)
/projects/{slug}                           Project board
/projects/{slug}/features/{id}             Feature detail
/settings                                  AI provider & app settings
```

## Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND                                               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │ Next.js │  │Tailwind │  │ Zustand │  │ Sonner  │   │
│  │   16    │  │  CSS v4 │  │  State  │  │ Toasts  │   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │
├─────────────────────────────────────────────────────────┤
│  BACKEND                                                │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌─────────┐  │
│  │ Next.js │  │ Prisma  │  │ Supabase │  │ BullMQ  │  │
│  │   API   │  │   ORM   │  │ Postgres │  │  Queue  │  │
│  └─────────┘  └─────────┘  └──────────┘  └─────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Documentation

| Document | Description |
|----------|-------------|
| [CLAUDE.md](CLAUDE.md) | Development guide for Claude Code |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Development guide, API reference |
| [CHANGELOG.md](CHANGELOG.md) | Version history |
| [PROJECT_INDEX.md](PROJECT_INDEX.md) | Codebase structure |
| [docs/API.md](docs/API.md) | Complete API documentation |
| [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) | Developer guide with examples |

## License

Available under the [MIT License](LICENSE).

### Contributing

Contributions welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a PR.
