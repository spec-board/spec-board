# Contributing to SpecBoard

Thank you for your interest in contributing to SpecBoard! This project is licensed under the [MIT License](LICENSE) -- all contributions are made under the same terms.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Code Style](#code-style)
- [Pull Request Guidelines](#pull-request-guidelines)

## Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or Supabase)
- pnpm (required - see packageManager in package.json)

### Environment Variables

```bash
# .env
POSTGRES_PRISMA_URL="postgresql://user:password@localhost:5432/specboard"
BETTER_AUTH_SECRET="your-secret-key"
```

### Commands

```bash
# Development
pnpm dev              # Start dev server with Turbopack (port 3000)
pnpm dev:all         # Run dev server + worker (if needed)
pnpm build           # Build for production
pnpm start           # Start production server

# Database
pnpm db:studio       # Open Prisma Studio
pnpm db:migrate      # Run migrations
pnpm db:push         # Push schema to DB
pnpm db:seed         # Seed database
pnpm db:reset        # Reset database

# Testing
pnpm test            # Run tests (watch mode)
pnpm test:run       # Run tests once
pnpm test:coverage  # Run tests with coverage

# Type checking
pnpm lint            # Run linter
pnpm tsc --noEmit   # Type check
```

## Project Structure

```
spec-board/
├── prisma/
│   └── schema.prisma      # Database schema (PostgreSQL)
├── src/
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── projects/       # Project routes
│   │   ├── settings/       # Settings page
│   │   └── page.tsx        # Home page
│   ├── components/         # React components
│   │   ├── feature-detail-v2/  # Feature detail (current UI)
│   │   ├── kanban-board.tsx    # Kanban board
│   │   └── header.tsx          # App header
│   ├── lib/                # Utilities and business logic
│   │   ├── prisma.ts       # Database client
│   │   ├── store.ts        # Zustand state
│   │   ├── settings-store.ts  # Settings persistence
│   │   ├── ai/             # AI client
│   │   └── utils.ts        # General utilities
│   └── types/              # TypeScript types
├── docs/                   # Documentation
├── specs/                  # Feature specifications
└── scripts/                # Database scripts
```

## Architecture

### Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict mode) |
| UI | React 19, Tailwind CSS v4, shadcn/ui, Lucide Icons |
| Database | PostgreSQL via Prisma ORM (Supabase) |
| Auth | Better Auth with OAuth |
| State | Zustand (client) |
| AI | Configurable (OpenAI, Anthropic, or any OpenAI-compatible API) |

### 4-Stage Workflow

```
backlog --> specs --> plan --> tasks
```

Each stage transition triggers AI-powered generation via API routes.

### Design System

SpecBoard uses a monochromatic design with CSS custom properties (`var(--foreground)`, `var(--border)`, `var(--accent)`, etc.) and a global button system (`.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger`). Always use design tokens instead of raw colors.

## Code Style

### Naming Conventions

| Type | Convention |
|------|------------|
| Files | `kebab-case.ts` |
| Components | `kebab-case.tsx` |
| Functions | `camelCase` |
| Types/Interfaces | `PascalCase` |
| Constants | `UPPER_SNAKE_CASE` |

### Styling

- Use Tailwind CSS with `cn()` utility for conditional classes
- Use CSS variables for theming: `var(--foreground)`, `var(--border)`, etc.
- Use the global `.btn` classes for buttons
- Icons from `lucide-react`

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

## Pull Request Guidelines

1. Create a feature branch from `main`
2. Make focused, atomic commits
3. Write tests for new functionality
4. Ensure all tests pass
5. Update documentation if needed
6. Submit PR with a clear description

### What to include in your PR

- A clear description of what your PR does and why
- The type of change (bug fix, feature, refactor, docs, etc.)
- Screenshots or recordings for UI changes
- Reference any related issues

## License

By contributing to SpecBoard, you agree that your contributions will be licensed under the [MIT License](LICENSE).

## Questions

If you have questions, please open an issue on the [GitHub repository](https://github.com/spec-board/spec-board/issues).
