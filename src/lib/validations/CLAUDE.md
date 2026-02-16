# Validations Directory

## Purpose
Zod schema validations for API requests and data validation.

## Overview
This directory contains Zod schemas for validating incoming API requests and data structures. It provides type-safe validation for cloud sync operations and general utilities.

## Key Files

| File | Purpose |
|------|---------|
| `index.ts` | Main exports |
| `sync.ts` | Sync-specific Zod schemas |
| `utils.ts` | Validation helper functions |

## Patterns & Conventions
- Use Zod for all input validation
- Export reusable schemas
- Compose complex schemas from simple ones

## Dependencies
- **Internal**: `@/types`
- **External**: zod

## Common Tasks
- **Add new validation**: Create Zod schema in appropriate file
- **Validate request**: Import schema and use .parse()

## Important Notes
- Server-side only
- Always validate user input before processing
