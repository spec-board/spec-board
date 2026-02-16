# Drivers Directory (Components)

## Purpose
UI components for AI driver execution and session management.

## Overview
This directory contains React components for displaying AI code execution sessions (E2B sandbox integration) within the application UI.

## Key Files

| File | Purpose |
|------|---------|
| `execution-panel.tsx` | Main panel showing code execution results |
| `session-status.tsx` | Displays current session status and progress |

## Dependencies
- **Internal**: `@/components/*`, `@/lib/drivers/*`, `@/types`
- **External**: react, lucide-react

## Common Tasks
- **Add new driver UI**: Create component in this directory
- **Modify execution display**: Update execution-panel.tsx

## Important Notes
- These are client components (use 'use client' directive)
- State is managed via parent components or Zustand store
