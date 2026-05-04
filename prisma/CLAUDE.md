# Prisma Directory

## Purpose
Database schema and migrations for PostgreSQL.

## Key Files

| File | Purpose |
|------|---------|
| `schema.prisma` | Database schema (7 models) |
| `migrations/` | 12 migration files |
| `seed.ts` | Database seeding |

## Database Models

```
Project ──┬── Feature ──┬── UserStory ── Task
          │             └── Task
          └── Constitution ── ConstitutionVersion

AppSettings (singleton)
```

### Project
- `name` (unique) — URL slug for routing
- `displayName` — human-readable name
- `isCloud` — cloud sync enabled
- Relations: has many Features, has one Constitution

### Feature
- `stage` — backlog, specs, plan, tasks
- Content fields: `specContent`, `planContent`, `tasksContent`, `clarificationsContent`, `researchContent`, `dataModelContent`, `quickstartContent`, `contractsContent` (JSON), `checklistsContent` (JSON), `analysisContent`
- Job tracking: `jobStatus`, `jobProgress`, `jobMessage`
- Relations: belongs to Project, has many UserStories + Tasks

### UserStory
- `storyId` — e.g., "US1"
- Relations: belongs to Feature, has many Tasks

### Task
- `taskId` — e.g., "T001"
- `priority` — P (High), M (Medium), L (Low)
- Relations: belongs to Feature, optionally belongs to UserStory

### Constitution
- `content` — full markdown
- `principles` — JSON array of {name, description}
- Version tracking via `version`, `ratifiedDate`, `lastAmendedDate`
- Relations: belongs to Project, has many ConstitutionVersions

### AppSettings
- Singleton for AI configuration (provider, API keys, model settings)

## Conventions

- Snake case mapping: TypeScript `projectId` → DB `project_id`
- Cascade deletes: Feature → UserStory → Task
- Composite unique constraints: `[projectId, featureId]`, `[featureId, storyId]`, `[featureId, taskId]`

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (pooled) |
| `POSTGRES_URL_NON_POOLING` | Direct connection (for migrations) |

## Dependencies

- **Internal**: Used by `src/lib/prisma.ts` singleton
- **External**: `@prisma/client`, `prisma` (dev), PostgreSQL
