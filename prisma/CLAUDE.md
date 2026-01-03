# Prisma Directory

## Purpose
Database schema and migrations for PostgreSQL.

## Overview
This directory contains the Prisma ORM configuration for SpecBoard. Prisma manages the PostgreSQL database schema, migrations, and provides a type-safe client for database operations.

## Key Files

| File | Purpose |
|------|---------|
| `schema.prisma` | Database schema definition |
| `migrations/` | Database migration history |

## Database Schema

### Project Model

```prisma
model Project {
  id          String   @id @default(uuid())
  name        String   @unique  // URL slug (e.g., "my-project")
  displayName String              // Human-readable name
  filePath    String              // Local filesystem path to spec files
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Fields:**

| Field | Type | Purpose |
|-------|------|---------|
| `id` | UUID | Primary key |
| `name` | String (unique) | URL-safe slug for routing |
| `displayName` | String | Human-readable project name |
| `filePath` | String | Filesystem path to spec-kit project |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

## Patterns & Conventions

- **Slug-based routing**: `name` field is used in URLs (`/projects/{name}`)
- **Filesystem reference**: `filePath` links to actual spec-kit files
- **Auto-timestamps**: `createdAt` and `updatedAt` managed by Prisma
- **Snake case mapping**: Database columns use snake_case (`display_name`, `file_path`)

## Dependencies

- **Internal**: Used by `src/lib/prisma.ts` singleton
- **External**: `@prisma/client`, PostgreSQL

## Common Tasks

### Run migrations
```bash
npx prisma migrate dev
```

### Generate client
```bash
npx prisma generate
```

### Open Prisma Studio
```bash
npx prisma studio
```

### Reset database
```bash
npx prisma migrate reset
```

### Push schema changes (dev only)
```bash
npx prisma db push
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |

**Example:**
```
DATABASE_URL="postgresql://user:password@localhost:5432/specboard?schema=public"
```

## Important Notes

- Prisma client is instantiated as singleton in `src/lib/prisma.ts`
- Schema changes require migration (`prisma migrate dev`)
- The `name` field must be URL-safe (lowercase, hyphens only)
- `filePath` stores absolute filesystem paths
- Database stores project metadata only; spec content is read from filesystem
