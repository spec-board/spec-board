# SpecBoard API Documentation

> **Version**: 1.1.0
> **Last Updated**: 2026-01-08
> **Base URL**: `http://localhost:3000/api`

## Table of Contents

- [Authentication](#authentication)
- [Project Management](#project-management)
- [Spec Data](#spec-data)
- [File Operations](#file-operations)
- [Cloud Sync](#cloud-sync)
- [Real-Time Updates](#real-time-updates)
- [Error Handling](#error-handling)

---

## Authentication

### OAuth Authentication

SpecBoard uses Better Auth for OAuth authentication with Google and GitHub providers.

**Endpoints**: `/api/auth/*` (handled by Better Auth)

**Supported Providers**:
- Google OAuth 2.0
- GitHub OAuth

**Authentication Flow**:
1. User clicks "Sign in with Google/GitHub"
2. Redirected to OAuth provider
3. User authorizes application
4. Redirected back with authorization code
5. Session created and stored in database
6. Session cookie set (HTTP-only, secure)

**Session Management**:
- Sessions expire after 30 days of inactivity
- Stored in PostgreSQL `sessions` table
- Validated on each authenticated request

### API Tokens

For MCP server integration, use API tokens instead of OAuth.

#### Create API Token

```http
POST /api/tokens
Authorization: Bearer <session-token>
Content-Type: application/json

{
  "name": "My MCP Token",
  "expiresAt": "2026-12-31T23:59:59Z"  // Optional
}
```

**Response** (201 Created):
```json
{
  "id": "token_123",
  "userId": "user_456",
  "name": "My MCP Token",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2026-12-31T23:59:59Z",
  "createdAt": "2026-01-08T10:00:00Z"
}
```

#### List API Tokens

```http
GET /api/tokens
Authorization: Bearer <session-token>
```

**Response** (200 OK):
```json
[
  {
    "id": "token_123",
    "name": "My MCP Token",
    "expiresAt": "2026-12-31T23:59:59Z",
    "lastUsedAt": "2026-01-08T09:00:00Z",
    "createdAt": "2026-01-08T08:00:00Z"
  }
]
```

#### Revoke API Token

```http
DELETE /api/tokens/:id
Authorization: Bearer <session-token>
```

**Response** (204 No Content)

---

## Project Management

### List All Projects

```http
GET /api/projects
```

**Response** (200 OK):
```json
[
  {
    "id": "proj_123",
    "name": "my-todolist",
    "displayName": "My Todolist",
    "filePath": "/Users/paul/Projects/my-todolist",
    "createdAt": "2026-01-01T10:00:00Z",
    "updatedAt": "2026-01-08T09:00:00Z"
  }
]
```

### Create Project

```http
POST /api/projects
Content-Type: application/json

{
  "name": "my-project",
  "displayName": "My Project",
  "filePath": "/Users/paul/Projects/my-project"
}
```

**Validation**:
- `name`: Must be URL-safe slug (lowercase, numbers, hyphens only)
- `displayName`: Human-readable name
- `filePath`: Must be absolute path to existing directory

**Response** (201 Created):
```json
{
  "id": "proj_124",
  "name": "my-project",
  "displayName": "My Project",
  "filePath": "/Users/paul/Projects/my-project",
  "createdAt": "2026-01-08T10:00:00Z",
  "updatedAt": "2026-01-08T10:00:00Z"
}
```

**Errors**:
- `400`: Missing required fields or invalid slug format
- `409`: Project with this name already exists

### Auto-Register Project

Automatically register a project from filesystem path. Returns existing project if already registered, or creates new one with auto-generated slug.

```http
POST /api/projects/register
Content-Type: application/json

{
  "filePath": "/Users/paul/Projects/my-todolist"
}
```

**Behavior**:
1. Validates path exists and is a directory
2. Checks for `specs/` or `.specify/` directory (spec-kit project)
3. Returns existing project if path already registered
4. Generates unique slug from folder name (e.g., `my-todolist`)
5. Handles slug conflicts by appending numbers (`my-todolist-2`)

**Response** (200 OK or 201 Created):
```json
{
  "id": "proj_125",
  "name": "my-todolist",
  "displayName": "My Todolist",
  "filePath": "/Users/paul/Projects/my-todolist",
  "createdAt": "2026-01-08T10:00:00Z",
  "updatedAt": "2026-01-08T10:00:00Z"
}
```

**Errors**:
- `400`: Missing filePath, invalid path, or not a spec-kit project

### Get Project by Slug

```http
GET /api/projects/:name
```

**Example**:
```http
GET /api/projects/my-todolist
```

**Response** (200 OK):
```json
{
  "id": "proj_125",
  "name": "my-todolist",
  "displayName": "My Todolist",
  "filePath": "/Users/paul/Projects/my-todolist",
  "createdAt": "2026-01-08T10:00:00Z",
  "updatedAt": "2026-01-08T10:00:00Z"
}
```

**Errors**:
- `404`: Project not found

### Update Project

```http
PUT /api/projects/:name
Content-Type: application/json

{
  "displayName": "Updated Name",
  "filePath": "/Users/paul/Projects/new-path"
}
```

**Response** (200 OK):
```json
{
  "id": "proj_125",
  "name": "my-todolist",
  "displayName": "Updated Name",
  "filePath": "/Users/paul/Projects/new-path",
  "createdAt": "2026-01-08T10:00:00Z",
  "updatedAt": "2026-01-08T11:00:00Z"
}
```

### Delete Project

```http
DELETE /api/projects/:name
```

**Response** (204 No Content)

**Note**: Only deletes database record, not filesystem files.

---

## Spec Data

### Load Project Data

Parse spec-kit project from filesystem and return structured data.

```http
GET /api/project?path=/Users/paul/Projects/my-todolist
```

**Query Parameters**:
- `path` (required): Absolute filesystem path to project

**Security**: Path must be within allowed directories (home directory, /tmp, /var/tmp)

**Response** (200 OK):
```json
{
  "path": "/Users/paul/Projects/my-todolist",
  "name": "my-todolist",
  "lastUpdated": "2026-01-08T10:00:00Z",
  "hasConstitution": true,
  "constitution": {
    "title": "Project Constitution",
    "version": "1.0.0",
    "principles": [
      {
        "name": "Simplicity First",
        "description": "Keep solutions simple and maintainable"
      }
    ],
    "sections": [...]
  },
  "features": [
    {
      "id": "001-user-auth",
      "name": "User Authentication",
      "path": "/Users/paul/Projects/my-todolist/specs/001-user-auth",
      "stage": "implement",
      "hasSpec": true,
      "hasPlan": true,
      "hasTasks": true,
      "tasks": [
        {
          "id": "T001",
          "description": "Create login form",
          "completed": true,
          "parallel": false,
          "userStory": "US1"
        }
      ],
      "phases": [
        {
          "name": "Phase 1: Setup",
          "tasks": [...],
          "contentBlocks": [...]
        }
      ],
      "userStories": [
        {
          "id": "US1",
          "title": "User Login",
          "priority": "P1",
          "description": "As a user, I want to log in...",
          "acceptanceCriteria": [...]
        }
      ],
      "totalTasks": 10,
      "completedTasks": 7,
      "branch": "feature/user-auth",
      "specContent": "# User Authentication\n...",
      "planContent": "# Implementation Plan\n...",
      "additionalFiles": [...]
    }
  ]
}
```

**Errors**:
- `400`: Missing path parameter
- `403`: Path outside allowed directories
- `500`: Failed to parse project

---

## File Operations

### Browse Filesystem

List directory contents for project selection.

```http
GET /api/browse?path=/Users/paul/Projects
```

**Query Parameters**:
- `path` (required): Directory path to browse

**Security**: Limited to user home directory and temp directories

**Response** (200 OK):
```json
{
  "path": "/Users/paul/Projects",
  "entries": [
    {
      "name": "my-todolist",
      "path": "/Users/paul/Projects/my-todolist",
      "isDirectory": true,
      "isSpecKit": true
    },
    {
      "name": "other-project",
      "path": "/Users/paul/Projects/other-project",
      "isDirectory": true,
      "isSpecKit": false
    }
  ]
}
```

**Errors**:
- `400`: Missing path parameter
- `403`: Path outside allowed directories
- `404`: Directory not found

### Toggle Checklist Item

Toggle a checkbox in a markdown checklist file.

```http
PATCH /api/checklist
Content-Type: application/json

{
  "filePath": "/Users/paul/Projects/my-todolist/specs/001-feature/checklists/qa.md",
  "lineIndex": 5,
  "expectedState": false
}
```

**Request Body**:
- `filePath`: Absolute path to markdown file (must be in `checklists/` directory)
- `lineIndex`: 0-based line number of checkbox to toggle
- `expectedState`: Current checkbox state for conflict detection

**Response** (200 OK):
```json
{
  "success": true,
  "newState": true,
  "content": "# QA Checklist\n\n- [x] Test login\n..."
}
```

**Errors**:
```json
{
  "success": false,
  "error": "conflict",
  "message": "Checkbox state has changed",
  "currentState": true
}
```

**Error Codes**:
- `invalid_path`: Path outside allowed directories or not a `.md` file
- `file_not_found`: File doesn't exist
- `invalid_line`: Line index out of bounds or not a checkbox
- `conflict`: Checkbox state doesn't match expectedState
- `write_failed`: Failed to write updated content

### Save Analysis Report

Save AI analysis report to feature directory.

```http
POST /api/analysis
Content-Type: application/json

{
  "featurePath": "/Users/paul/Projects/my-todolist/specs/001-feature",
  "content": "# Analysis Report\n\n## Summary\n..."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "filePath": "/Users/paul/Projects/my-todolist/specs/001-feature/analysis/2026-01-08-10-30-analysis.md"
}
```

---

## Cloud Sync

### Create Cloud Project

```http
POST /api/cloud-projects
Authorization: Bearer <session-token>
Content-Type: application/json

{
  "name": "My Cloud Project",
  "slug": "my-cloud-project",
  "description": "Project description"
}
```

**Response** (201 Created):
```json
{
  "id": "cloud_123",
  "name": "My Cloud Project",
  "slug": "my-cloud-project",
  "description": "Project description",
  "ownerId": "user_456",
  "createdAt": "2026-01-08T10:00:00Z",
  "updatedAt": "2026-01-08T10:00:00Z"
}
```

### List Cloud Projects

```http
GET /api/cloud-projects
Authorization: Bearer <session-token>
```

**Response** (200 OK):
```json
[
  {
    "id": "cloud_123",
    "name": "My Cloud Project",
    "slug": "my-cloud-project",
    "description": "Project description",
    "role": "ADMIN",
    "memberCount": 3,
    "lastSyncAt": "2026-01-08T09:00:00Z",
    "createdAt": "2026-01-08T08:00:00Z"
  }
]
```

### Generate Link Code

Generate a 6-character code for connecting local projects to cloud.

```http
POST /api/cloud-projects/:id/links
Authorization: Bearer <session-token>
```

**Response** (201 Created):
```json
{
  "code": "ABC123",
  "expiresAt": "2026-01-08T11:00:00Z"
}
```

**Note**: Codes expire after 1 hour and are single-use.

### Connect Local Project

Connect a local project to cloud using a link code.

```http
POST /api/cloud-projects/connect
Authorization: Bearer <session-token>
Content-Type: application/json

{
  "code": "ABC123",
  "localProjectId": "proj_125"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "cloudProjectId": "cloud_123",
  "role": "EDIT"
}
```

### Push Changes to Cloud

```http
POST /api/sync/:projectId/push
Authorization: Bearer <session-token>
Content-Type: application/json

{
  "features": [
    {
      "featureId": "001-user-auth",
      "featureName": "User Authentication",
      "files": [
        {
          "type": "spec",
          "content": "# User Authentication\n..."
        },
        {
          "type": "plan",
          "content": "# Implementation Plan\n..."
        }
      ]
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "pushedFeatures": 1,
  "conflicts": []
}
```

### Get Sync Status

```http
GET /api/sync/:projectId/status
Authorization: Bearer <session-token>
```

**Response** (200 OK):
```json
{
  "projectId": "cloud_123",
  "lastPushAt": "2026-01-08T09:00:00Z",
  "lastPullAt": "2026-01-08T08:00:00Z",
  "pendingChanges": 3,
  "hasConflicts": true,
  "conflictCount": 2
}
```

### List Conflicts

```http
GET /api/sync/:projectId/conflicts
Authorization: Bearer <session-token>
```

**Response** (200 OK):
```json
[
  {
    "id": "conflict_123",
    "specId": "spec_456",
    "featureId": "001-user-auth",
    "fileType": "spec",
    "status": "PENDING",
    "localChecksum": "abc123...",
    "cloudChecksum": "def456...",
    "createdAt": "2026-01-08T09:00:00Z"
  }
]
```

### Resolve Conflict

```http
POST /api/sync/:projectId/conflicts/:conflictId/resolve
Authorization: Bearer <session-token>
Content-Type: application/json

{
  "resolution": "RESOLVED_LOCAL",
  "mergedContent": "# Merged content..."
}
```

**Resolution Options**:
- `RESOLVED_LOCAL`: Keep local version
- `RESOLVED_CLOUD`: Keep cloud version
- `RESOLVED_MERGED`: Use manually merged content

**Response** (200 OK):
```json
{
  "success": true,
  "conflictId": "conflict_123",
  "resolution": "RESOLVED_LOCAL"
}
```

---

## Real-Time Updates

### Watch Project Changes

Server-Sent Events (SSE) stream for real-time file updates.

```http
GET /api/watch?path=/Users/paul/Projects/my-todolist
```

**Query Parameters**:
- `path` (required): Project filesystem path

**Event Types**:

**Connected Event**:
```
event: connected
data: {"message":"Connected to file watcher"}
```

**Update Event**:
```
event: update
data: {"type":"update","data":{...project data...}}
```

**Error Event**:
```
event: error
data: {"type":"error","error":"Failed to parse project"}
```

**Client Example**:
```javascript
const eventSource = new EventSource('/api/watch?path=/path/to/project');

eventSource.addEventListener('update', (event) => {
  const data = JSON.parse(event.data);
  console.log('Project updated:', data.data);
});

eventSource.addEventListener('error', (event) => {
  const data = JSON.parse(event.data);
  console.error('Error:', data.error);
});
```

---

## Error Handling

### Standard Error Response

```json
{
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| `200` | OK | Request successful |
| `201` | Created | Resource created successfully |
| `204` | No Content | Resource deleted successfully |
| `400` | Bad Request | Missing required fields, invalid input |
| `401` | Unauthorized | Missing or invalid authentication |
| `403` | Forbidden | Path outside allowed directories |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Duplicate resource (e.g., project name) |
| `500` | Internal Server Error | Server-side error |

### Common Error Scenarios

**Path Security Errors**:
```json
{
  "error": "Access denied: Path is outside allowed directories"
}
```

**Validation Errors**:
```json
{
  "error": "Name must be a URL-safe slug (lowercase letters, numbers, hyphens)"
}
```

**Conflict Errors**:
```json
{
  "error": "A project with this name already exists"
}
```

**Not Found Errors**:
```json
{
  "error": "Project not found"
}
```

---

## Rate Limiting

Currently, there are no rate limits on API endpoints. This may change in future versions.

## CORS

CORS is configured to allow requests from the same origin only. Cross-origin requests are not supported.

## Versioning

API version is included in the response headers:
```
X-API-Version: 1.1.0
```

Future breaking changes will be introduced with a new version prefix (e.g., `/api/v2/`).
