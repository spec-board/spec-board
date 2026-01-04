# SpecBoard

> Visual dashboard for [spec-kit](https://github.com/github/spec-kit) projects

![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)

🚧 Under Development 🚧 <br>
This project is in its early stages. I came up with this idea a few days before the January 1st, 2026 holiday and it's still being refined. Updates may not be frequent as I can't commit to a fixed weekly schedule.

Please use it, report bugs and provide support: software bugs, feature requests, questions, anything helpful.

## Screenshots

### Kanban Board

Track features across your development pipeline with a 4-column Kanban board showing progress metrics for tasks and checklists.

![Kanban Board](https://github.com/paulpham157/spec-board/blob/main/public/assests/board.png)

### Feature Detail View

Deep dive into specifications with structured user stories, acceptance scenarios, edge cases, and implementation guidance.

![Feature Detail](https://github.com/paulpham157/spec-board/blob/main/public/assests/spec.png)

### AI-Powered Development Assistance

Get intelligent next action suggestions and save analysis reports for quality assurance.

<p align="center">
  <img src="https://github.com/paulpham157/spec-board/blob/main/public/assests/suggestion-next-action.png" alt="Next Action Suggestions" width="400" />
  <img src="https://github.com/paulpham157/spec-board/blob/main/public/assests/save-the-analysis.png" alt="Save Analysis Report" width="300" />
</p>

## Features

- **Kanban Board** — 4-column pipeline (Backlog → Planning → In Progress → Done)
- **Real-Time Updates** — Live file watching via SSE
- **Interactive Checklists** — Click or keyboard to toggle checklist items
- **Deep Linking** — Shareable URLs for projects and features
- **Progress Tracking** — Visual metrics for tasks and checklists
- **Accessible** — WCAG 2.2 AA compliant with keyboard navigation
- **AI Integration** — Next action suggestions and analysis reports

https://youtu.be/WQXb2-dj9zQ

## How It Works

```
┌──────────────┐      ┌──────────────┐      ┌──────────────────┐
│              │      │              │      │                  │
│  spec-kit    │ ───▶ │  SpecBoard   │ ───▶ │   Kanban Board   │
│  project     │      │  parses      │      │                  │
│              │      │              │      │  ┌──┐┌──┐┌──┐┌──┐│
│  specs/      │      │  spec.md     │      │  │B ││P ││I ││D ││
│  ├─ feature/ │      │  plan.md     │      │  └──┘└──┘└──┘└──┘│
│  │  ├─ spec  │      │  tasks.md    │      │                  │
│  │  ├─ plan  │      │              │      │                  │
│  │  └─ tasks │      │              │      │                  │
└──────────────┘      └──────────────┘      └──────────────────┘

B = Backlog | P = Planning | I = In Progress | D = Done
```

## Quick Start

```bash
pnpm install
cp .env.example .env
```

```.env
PORT=3000
DATABASE_URL="postgresql://user1:passwordD@localhost:5432/specboard1"
POSTGRES_USER="user1"
POSTGRES_PASSWORD="passwordD"
POSTGRES_DB="specboard1"
```

```bash
docker compose -f docker-compose.db.yml up -d
pnpm prisma db:setup
```

Run dev

```bash
pnpm dev
```

Or build for stable production

```bash
pnpm build
pnpm start
```


## URL Structure

```
/                                          → Home (recent projects)
/projects/{slug}                           → Project board
/projects/{slug}/features/{id}             → Feature detail
/projects/{slug}/features/{id}/spec        → Spec viewer
/projects/{slug}/features/{id}/plan        → Plan viewer
```

**Note:** URLs use clean database slugs (e.g., `todolist`) generated from folder names, not encoded filesystem paths.

## Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND                                               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│  │ Next.js │  │Tailwind │  │ Zustand │  │Recharts │     │
│  │   16    │  │  CSS v4 │  │  State  │  │ Charts  │     │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘     │
├─────────────────────────────────────────────────────────┤
│  BACKEND                                                │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐                 │
│  │ Next.js │  │ Prisma  │  │PostgreSQL│                 │
│  │   API   │  │   ORM   │  │    DB    │                 │
│  └─────────┘  └─────────┘  └──────────┘                 │
└─────────────────────────────────────────────────────────┘
```

## Documentation

| Document | Description |
|----------|-------------|
| [CONTRIBUTING.md](https://github.com/paulpham157/spec-board/blob/main/CONTRIBUTING.md) | Development guide, API reference |
| [CHANGELOG.md](https://github.com/paulpham157/spec-board/blob/main/CHANGELOG.md) | Version history |
| [PROJECT_INDEX.md](https://github.com/paulpham157/spec-board/blob/main/PROJECT_INDEX.md) | Codebase structure |

## License

Available under [AGPL-3.0](https://github.com/paulpham157/spec-board/blob/main/LICENSE) or commercial license. For commercial licensing, contact us at [Email](mailto:paulpham157@gmail.com).

### Contributing

By contributing to this project, you agree to the [Contributor License Agreement (CLA)](https://github.com/paulpham157/spec-board/blob/main/CLA.md). All contributions must be made under the AGPL-3.0 license.
