# Source Directory

## Purpose
Main source code for the SpecBoard application.

## Overview
This directory contains all application source code organized by Next.js App Router conventions. It includes pages, API routes, React components, utilities, and TypeScript type definitions.

## Directory Structure

| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js App Router pages and API routes |
| `components/` | React UI components |
| `lib/` | Utilities, parsers, state management |
| `types/` | TypeScript type definitions |

## Key Entry Points

| File | Purpose |
|------|---------|
| `app/page.tsx` | Home page - recent projects, open project modal |
| `app/layout.tsx` | Root layout with metadata and global styles |
| `app/globals.css` | Tailwind CSS and CSS variables |
| `lib/parser.ts` | Core markdown parsing engine |
| `lib/store.ts` | Zustand state management |
| `types/index.ts` | All shared TypeScript types |

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Home page
│   ├── layout.tsx          # Root layout
│   ├── globals.css         # Global styles
│   ├── settings/           # Settings page
│   ├── shortcuts/          # Keyboard shortcuts
│   ├── projects/[name]/    # Project routes (slug-based)
│   └── api/                # API routes
├── components/             # React components
│   ├── feature-detail/     # Feature modal components
│   ├── kanban-board.tsx    # Kanban view
│   ├── *-viewer.tsx        # Content viewers
│   └── ...
├── lib/                    # Business logic
│   ├── parser.ts           # Markdown parsing
│   ├── store.ts            # State management
│   ├── path-utils.ts       # Path security
│   ├── prisma.ts           # Database client
│   ├── markdown/           # Specialized parsers
│   └── accessibility/      # A11y utilities
└── types/
    └── index.ts            # Type definitions
```

## Data Flow

1. **Home Page** → User opens project → `/api/projects/register`
2. **Registration** → Validates path, creates/returns slug
3. **Navigation** → `/projects/{slug}` → Fetch project data
4. **Project Page** → `/api/project?path=...` → Parse spec-kit files
5. **Real-time** → `/api/watch` → SSE updates on file changes

## Patterns & Conventions

- **Client Components**: Use `'use client'` directive for interactivity
- **Server Components**: API routes are server-only
- **Path Aliases**: Use `@/` for imports (e.g., `@/lib/parser`)
- **CSS Variables**: Dark mode via CSS custom properties
- **Zustand**: Client-side state with localStorage persistence

## Dependencies

- **Internal**: Cross-directory imports via `@/` alias
- **External**: next, react, zustand, prisma, tailwindcss, lucide-react

## Common Tasks

- **Add new page**: Create `app/folder/page.tsx` with `'use client'`
- **Add API route**: Create `app/api/folder/route.ts`
- **Add component**: Create in `components/` directory
- **Add utility**: Add to appropriate file in `lib/`
- **Add type**: Add to `types/index.ts`

## Important Notes

- All pages use client-side rendering for React hooks
- URLs use database slugs, not filesystem paths
- Parser runs server-side only (uses Node.js fs)
- Store persists recent projects to localStorage
- Path validation prevents directory traversal attacks
