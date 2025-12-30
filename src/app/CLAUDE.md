# App Directory

## Purpose
Next.js App Router pages and API routes.

## Overview
This directory contains all Next.js App Router pages and API routes. It follows the file-based routing convention where folders define routes and `page.tsx` files define the UI. API routes are in the `api/` subdirectory.

## Key Files

| File | Purpose |
|------|---------|
| `page.tsx` | Home page - recent projects list + open project button |
| `layout.tsx` | Root layout with metadata and global styles |
| `globals.css` | Global CSS with Tailwind and CSS variables |

## Route Structure

| Route | File | Purpose |
|-------|------|---------|
| `/` | `page.tsx` | Home - recent projects, open project |
| `/projects/[name]` | `projects/[name]/page.tsx` | Project dashboard |
| `/projects/[name]/features/[featureId]` | `projects/[name]/features/[featureId]/page.tsx` | Feature detail |
| `/projects/[name]/features/[featureId]/spec` | `.../spec/page.tsx` | Spec viewer |
| `/projects/[name]/features/[featureId]/plan` | `.../plan/page.tsx` | Plan viewer |

**Note:** The `[name]` parameter is a database slug (e.g., `todolist`), NOT a filesystem path. Projects are auto-registered via `/api/projects/register` which generates clean URL slugs from folder names.

## API Routes

See `api/CLAUDE.md` for detailed API documentation.

| Endpoint | Purpose |
|----------|---------|
| `/api/projects` | Project CRUD operations |
| `/api/projects/register` | Auto-register project from filesystem path |
| `/api/project` | Load spec data from filesystem |
| `/api/browse` | Directory browser for project selection |
| `/api/watch` | SSE endpoint for real-time updates |

## Patterns & Conventions

- **Client Components**: Pages use `'use client'` for interactivity
- **Dynamic Routes**: `[name]` (slug) and `[featureId]` for path parameters
- **Slug-based Routing**: URLs use database slugs, not filesystem paths
- **Data Fetching**: Client-side fetch to API routes
- **Auto-registration**: Home page registers projects via `/api/projects/register` before navigation

## URL Flow

1. User opens project from home page
2. Home page calls `POST /api/projects/register` with filesystem path
3. API returns project with slug (e.g., `my-todolist`)
4. Navigate to `/projects/my-todolist`
5. Project page calls `GET /api/projects/my-todolist` to get filesystem path
6. Project page calls `GET /api/project?path=...` to load spec data

## Dependencies

- **Internal**: `@/components/*`, `@/lib/store`, `@/types`
- **External**: next/navigation, react

## Common Tasks

- **Add new page**: Create `folder/page.tsx` with `'use client'`
- **Add API route**: Create `api/folder/route.ts` with HTTP handlers
- **Add dynamic route**: Use `[param]` folder naming

## Important Notes

- All pages are client components for React hooks
- URLs use clean slugs (e.g., `/projects/todolist`) not encoded paths
- Layout provides consistent header across pages
- CSS variables enable dark mode support
