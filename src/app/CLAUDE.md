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

## API Routes

See `api/CLAUDE.md` for detailed API documentation.

| Endpoint | Purpose |
|----------|---------|
| `/api/projects` | Project CRUD operations |
| `/api/project` | Load spec data from filesystem |
| `/api/browse` | Directory browser for project selection |
| `/api/watch` | SSE endpoint for real-time updates |

## Patterns & Conventions

- **Client Components**: Pages use `'use client'` for interactivity
- **Dynamic Routes**: `[name]` and `[featureId]` for path parameters
- **URL Encoding**: Project paths are URL-encoded in routes
- **Data Fetching**: Client-side fetch to API routes

## Dependencies

- **Internal**: `@/components/*`, `@/lib/store`, `@/types`
- **External**: next/navigation, react

## Common Tasks

- **Add new page**: Create `folder/page.tsx` with `'use client'`
- **Add API route**: Create `api/folder/route.ts` with HTTP handlers
- **Add dynamic route**: Use `[param]` folder naming

## Important Notes

- All pages are client components for React hooks
- Project paths are URL-encoded using `encodeURIComponent`
- Layout provides consistent header across pages
- CSS variables enable dark mode support
