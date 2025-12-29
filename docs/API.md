# SpecBoard API Documentation

## Overview

SpecBoard provides a REST API for managing spec-kit projects. The API enables filesystem browsing, project CRUD operations, real-time file watching via Server-Sent Events (SSE), and project parsing.

**Base URL:** `http://localhost:3000/api`

**Authentication:** None (local development tool)

---

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/browse` | Browse filesystem directories |
| GET | `/project` | Parse and load a spec-kit project |
| GET | `/projects` | List all registered projects |
| POST | `/projects` | Register a new project |
| GET | `/projects/[name]` | Get a project by slug |
| PUT | `/projects/[name]` | Update a project |
| DELETE | `/projects/[name]` | Delete a project |
| GET | `/watch` | SSE stream for real-time updates |

---

## GET /api/browse

Browse the filesystem to find spec-kit projects. Returns directory listings with spec-kit project detection.

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `path` | string | No | `~` (home) | Directory path to browse |

### Response (200 OK)

```json
{
  "currentPath": "/Users/paul/Projects",
  "parentPath": "/Users/paul",
  "entries": [
    {
      "name": "my-app",
      "path": "/Users/paul/Projects/my-app",
      "isDirectory": true,
      "isSpecKitProject": true
    }
  ],
  "isSpecKitProject": false
}
```

### DirectoryEntry

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Directory name |
| `path` | string | Full absolute path |
| `isDirectory` | boolean | Always `true` (only directories returned) |
| `isSpecKitProject` | boolean | Has `specs/` or `.specify/` directory |

### Errors

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Path is not a directory | Path exists but is a file |
| 403 | Access denied | Path is outside allowed directories |
| 404 | Directory does not exist | Path not found |
| 500 | Failed to browse directory | Server error |

### Example

```bash
curl "http://localhost:3000/api/browse?path=~/Projects"
```

---

## GET /api/project

Parse a spec-kit project from the filesystem and return structured data.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Absolute path to the project directory |

### Response (200 OK)

```json
{
  "path": "/Users/paul/Projects/my-app",
  "name": "my-app",
  "features": [...],
  "lastUpdated": "2024-01-15T10:30:00.000Z",
  "constitution": {...},
  "hasConstitution": true
}
```

### Feature Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Feature slug (directory name) |
| `name` | string | Human-readable name |
| `stage` | FeatureStage | `specify`, `plan`, `tasks`, `implement`, `complete` |
| `hasSpec` | boolean | Has `spec.md` file |
| `hasPlan` | boolean | Has `plan.md` file |
| `hasTasks` | boolean | Has `tasks.md` file |
| `tasks` | Task[] | All tasks from `tasks.md` |
| `totalTasks` | number | Total task count |
| `completedTasks` | number | Completed task count |

### Errors

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Project path is required | Missing `path` parameter |
| 500 | Failed to parse project | Parser error |

### Example

```bash
curl "http://localhost:3000/api/project?path=/Users/paul/Projects/my-app"
```

---

## GET /api/projects

List all registered projects from the database.

### Response (200 OK)

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "my-app",
    "displayName": "My Application",
    "filePath": "/Users/paul/Projects/my-app",
    "createdAt": "2024-01-10T08:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

### Project Object

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | UUID primary key |
| `name` | string | URL-safe slug (unique) |
| `displayName` | string | Human-readable name |
| `filePath` | string | Absolute path to project |
| `createdAt` | string | ISO 8601 timestamp |
| `updatedAt` | string | ISO 8601 timestamp |

### Example

```bash
curl "http://localhost:3000/api/projects"
```

---

## POST /api/projects

Register a new project in the database.

### Request Body

```json
{
  "name": "my-app",
  "displayName": "My Application",
  "filePath": "/Users/paul/Projects/my-app"
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | URL-safe slug (lowercase, numbers, hyphens) |
| `displayName` | string | Yes | Human-readable name |
| `filePath` | string | Yes | Absolute path to project directory |

### Response (201 Created)

Returns the created project object.

### Errors

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Missing required fields | `name`, `displayName`, or `filePath` missing |
| 400 | Name must be a URL-safe slug | Invalid `name` format |
| 409 | A project with this name already exists | Duplicate `name` |

### Example

```bash
curl -X POST "http://localhost:3000/api/projects" \
  -H "Content-Type: application/json" \
  -d '{"name": "my-app", "displayName": "My App", "filePath": "/path/to/project"}'
```

---

## GET /api/projects/[name]

Get a single project by its URL slug.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Project URL slug |

### Response (200 OK)

Returns the project object.

### Errors

| Status | Error | Description |
|--------|-------|-------------|
| 404 | Project not found | No project with this name |
| 500 | Failed to fetch project | Database error |

### Example

```bash
curl "http://localhost:3000/api/projects/my-app"
```

---

## PUT /api/projects/[name]

Update an existing project.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Project URL slug |

### Request Body

```json
{
  "displayName": "Updated Name",
  "filePath": "/new/path/to/project"
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `displayName` | string | No | New display name |
| `filePath` | string | No | New file path (must exist) |

### Response (200 OK)

Returns the updated project object.

### Errors

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Invalid file path | Directory does not exist |
| 404 | Project not found | No project with this name |

### Example

```bash
curl -X PUT "http://localhost:3000/api/projects/my-app" \
  -H "Content-Type: application/json" \
  -d '{"displayName": "My Updated App"}'
```

---

## DELETE /api/projects/[name]

Delete a project from the database. Does not delete files from the filesystem.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Project URL slug |

### Response (200 OK)

```json
{
  "success": true
}
```

### Errors

| Status | Error | Description |
|--------|-------|-------------|
| 404 | Project not found | No project with this name |

### Example

```bash
curl -X DELETE "http://localhost:3000/api/projects/my-app"
```

---

## GET /api/watch

Server-Sent Events (SSE) endpoint for real-time project updates. Watches the filesystem for changes and pushes updates when spec-kit files are modified.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | Yes | Absolute path to project directory |

### Response Headers

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

### Event Format

```
data: {"type": "update", "data": {...project object...}}
```

### Event Types

| Type | Description |
|------|-------------|
| `update` | Project data changed (includes full project object) |
| `error` | Error occurred during parsing |

### Behavior

1. On connection: Sends initial project state
2. On file change: Debounces (300ms) and sends updated project
3. Watches: `*.md` files up to 3 levels deep
4. Ignores: Dotfiles and hidden directories
5. Uses polling (300ms interval) for reliable cross-platform detection

### Example (JavaScript)

```javascript
const eventSource = new EventSource('/api/watch?path=/path/to/project');

eventSource.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'update') {
    console.log('Project updated:', message.data);
  }
};

// Close connection when done
eventSource.close();
```

### Example (curl)

```bash
curl -N "http://localhost:3000/api/watch?path=/path/to/project"
```

---

## Type Definitions

### FeatureStage

```typescript
type FeatureStage = 'specify' | 'plan' | 'tasks' | 'implement' | 'complete';
```

### Task

```typescript
interface Task {
  id: string;           // e.g., "T001"
  description: string;
  completed: boolean;
  parallel: boolean;    // Can run in parallel with others
  userStory?: string;   // e.g., "US1"
  filePath?: string;    // Source file path
}
```

### UserStory

```typescript
interface UserStory {
  id: string;           // e.g., "US1"
  title: string;
  priority: 'P1' | 'P2' | 'P3';
  description: string;
  acceptanceCriteria: string[];
}
```

### TechnicalContext

```typescript
interface TechnicalContext {
  language: string;
  dependencies: string[];
  storage: string;
  testing: string;
  platform: string;
}
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Human-readable error message"
}
```

---

## Notes

- All endpoints use `force-dynamic` to disable Next.js caching
- Paths support `~` expansion to home directory
- The `/browse` endpoint validates paths for security (no directory traversal)
- The `/watch` endpoint uses chokidar with polling for reliable cross-platform file watching
- Database operations use Prisma with PostgreSQL
