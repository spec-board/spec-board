# API Directory

## Purpose
RESTful API routes for project management and spec data.

## Overview
This directory contains all Next.js API routes using the App Router convention. Each folder represents an endpoint, with `route.ts` files containing HTTP method handlers. Routes handle project CRUD, auto-registration, filesystem browsing, spec data loading, and real-time updates.

## Key Files

| File | Purpose |
|------|---------|
| `projects/route.ts` | List and create projects |
| `projects/register/route.ts` | Auto-register project from filesystem path |
| `projects/[name]/route.ts` | Get, update, delete specific project |
| `project/route.ts` | Load spec data from filesystem path |
| `browse/route.ts` | Directory browser with autocomplete |
| `watch/route.ts` | Server-Sent Events for real-time updates |
| `checklist/route.ts` | Toggle checklist items in markdown files |
| `app-info/route.ts` | App metadata (version, readme, changelog) |
| `analysis/route.ts` | Save analysis reports |
| `spec-workflow/specify/route.ts` | Generate spec from feature description |
| `spec-workflow/clarify/route.ts` | Generate clarification questions (saves to DB) |
| `spec-workflow/plan/route.ts` | Generate implementation plan |
| `spec-workflow/tasks/route.ts` | Generate task breakdown |
| `spec-workflow/analyze/route.ts` | Analyze consistency across documents |

## Endpoints

### Projects CRUD (`/api/projects`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/projects` | List all projects from database |
| `POST` | `/api/projects` | Create new project |
| `GET` | `/api/projects/:name` | Get project by slug |
| `PUT` | `/api/projects/:name` | Update project |
| `DELETE` | `/api/projects/:name` | Delete project |

**Request/Response:**
```typescript
// POST /api/projects
{ name: string, displayName: string, filePath: string }

// Response
{ id, name, displayName, filePath, createdAt, updatedAt }
```

### Project Auto-Registration (`/api/projects/register`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/projects/register` | Auto-register project from filesystem path |

**Request/Response:**
```typescript
// POST /api/projects/register
{ filePath: string }

// Response (existing or newly created)
{ id, name, displayName, filePath, createdAt, updatedAt }
```

**Behavior:**
- Validates path exists and is a spec-kit project (has `specs/` or `.specify/`)
- Returns existing project if path already registered
- Generates unique slug from folder name (e.g., `/Users/paul/my-todolist` → `my-todolist`)
- Handles slug conflicts by appending numbers (`my-todolist-2`, `my-todolist-3`)
- Used by home page to auto-register projects when opened

### Spec Data (`/api/project`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/project?path=...` | Load and parse spec-kit project |

**Response:** Full `Project` object with features, tasks, constitution, etc.

### File Browser (`/api/browse`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/browse?path=...` | List directory contents |

**Response:**
```typescript
{
  path: string,
  entries: Array<{
    name: string,
    path: string,
    isDirectory: boolean,
    isSpecKit: boolean  // Has specs/ or .specify/
  }>
}
```

### Real-time Updates (`/api/watch`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/watch?path=...` | SSE stream for file changes |

**Events:** `update` (project data), `error`, `connected`

### Checklist Toggle (`/api/checklist`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `PATCH` | `/api/checklist` | Toggle a checklist item in a markdown file |

**Request:**
```typescript
{
  filePath: string,    // Absolute path to checklist markdown file
  lineIndex: number,   // 0-based line number to toggle
  expectedState: boolean  // Current state for conflict detection
}
```

**Response:**
```typescript
// Success
{
  success: true,
  newState: boolean,   // New checked state
  content: string      // Updated file content
}

// Error
{
  success: false,
  error: 'invalid_path' | 'file_not_found' | 'invalid_line' | 'conflict' | 'write_failed',
  message: string,
  currentState?: boolean  // Actual state if conflict
}
```

**Security:**
- Path must be within allowed directories (`isPathSafe()`)
- File must be `.md` extension
- File must be in a `checklists/` directory
- Uses async `fs/promises` for non-blocking I/O

### App Info (`/api/app-info`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/app-info` | Get app metadata |

**Response:**
```typescript
{
  version: string,     // From package.json
  readme: string,      // README.md content
  changelog: string    // CHANGELOG.md content
}
```

### Analysis (`/api/analysis`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/analysis` | Save analysis report |

**Request:**
```typescript
{
  featurePath: string,  // Path to feature directory
  content: string       // Analysis markdown content
}
```

### Spec Workflow (`/api/spec-workflow`)

AI-powered workflow for generating spec-kit documents. Flow: specify → clarify → plan → tasks → analyze

#### Specify (`/api/spec-workflow/specify`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/spec-workflow/specify` | Generate spec from feature description |

**Request:**
```typescript
{
  projectId: string,    // Database project ID
  name: string,         // Feature name
  description?: string  // Feature description
}
```

**Response:**
```typescript
{
  step: 'backlog',
  spec: { userStories, edgeCases, functionalRequirements },
  content: string,      // Generated spec.md markdown
  featureId: string,    // Database feature ID
  featureIdDb: string   // Human-readable ID (e.g., "001-feature-name")
}
```

#### Clarify (`/api/spec-workflow/clarify`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/spec-workflow/clarify` | Generate/answer clarification questions |

**Request:**
```typescript
{
  projectId?: string,        // Optional (used if featureId provided)
  featureId?: string,         // Optional - if provided, saves to database
  specContent: string,       // Current spec content
  questions?: { question: string; answer: string }[]  // Optional - existing Q&A
}
```

**Response:**
```typescript
{
  step: 'clarify',
  questions: { question: string; answer?: string }[],
  content: string,      // Generated clarifications markdown
  featureId: string     // Database feature ID (if provided)
}
```

**Behavior:**
- If `questions` provided (user answered), saves to database
- If no `questions`, generates new questions from AI
- Saves to `clarificationsContent` field in Feature table

#### Plan (`/api/spec-workflow/plan`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/spec-workflow/plan` | Generate implementation plan |

**Request:**
```typescript
{
  projectId: string,
  featureId: string,
  name?: string,
  specContent: string,
  clarifications?: { question: string; answer: string }[],  // Optional - reads from DB if missing
  constitution?: string
}
```

**Response:**
```typescript
{
  step: 'planning',
  plan: { summary, technicalContext, projectStructure, qualityGates },
  content: string,     // Generated plan.md markdown
  featureId: string
}
```

**Behavior:**
- If `clarifications` not provided, reads from database (`clarificationsContent`)
- Saves plan content and updates spec with clarifications
- Stage changes to 'planning'

#### Tasks (`/api/spec-workflow/tasks`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/spec-workflow/tasks` | Generate task breakdown |

**Request:**
```typescript
{
  projectId: string,
  featureId: string,
  name?: string,
  specContent: string,
  planContent: string
}
```

**Response:**
```typescript
{
  step: 'in_progress',
  tasks: { phases: [...] },
  content: string,     // Generated tasks.md markdown
  featureId: string,
  taskCount: number    // Number of tasks created
}
```

**Behavior:**
- Creates Task records in database linked to User Stories
- Stage changes to 'in_progress'

#### Analyze (`/api/spec-workflow/analyze`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/spec-workflow/analyze` | Analyze consistency across documents |

**Request:**
```typescript
{
  projectId?: string,
  featureId?: string,
  specContent: string,
  planContent: string,
  tasksContent: string,
  constitution?: string
}
```

**Response:**
```typescript
{
  step: 'analyze',
  analysis: {
    isValid: boolean,
    specPlanConsistency: { score: number, isConsistent: boolean },
    planTasksConsistency: { score: number, isConsistent: boolean },
    constitutionAlignment: { score: number, isConsistent: boolean },
    issues: { severity: string, description: string, location?: string }[]
  },
  content: string      // Generated analysis.md markdown
}
```

**Behavior:**
- Calculates consistency scores between spec/plan/tasks
- Compares against constitution if provided
- Stage changes to 'done' if featureId provided

## Patterns & Conventions

- **Route Handlers**: Export `GET`, `POST`, `PUT`, `DELETE` functions
- **Error Handling**: Return `NextResponse.json({ error }, { status })`
- **Path Validation**: Use `path-utils.ts` for security
- **Database**: Use Prisma client from `@/lib/prisma`

## Security Features

| Feature | Implementation |
|---------|----------------|
| Path Traversal Protection | `isPathSafe()` validates paths |
| Input Validation | Slug pattern for project names |
| Directory Restriction | Browse limited to user directories |
| XSS Prevention | Content sanitized on client |

## Dependencies

- **Internal**: `@/lib/parser`, `@/lib/path-utils`, `@/lib/prisma`
- **External**: next/server, chokidar (file watching)

## Common Tasks

- **Add new endpoint**: Create `folder/route.ts` with handlers
- **Add path parameter**: Use `[param]` folder naming
- **Add validation**: Use `path-utils.ts` functions

## Important Notes

- All routes are server-side (no `'use client'`)
- Use `NextResponse.json()` for responses
- Path validation is critical for security
- SSE uses `ReadableStream` for streaming
