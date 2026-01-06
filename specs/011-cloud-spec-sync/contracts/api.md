# API Contracts: Cloud Specification Sync

**Feature**: 011-cloud-spec-sync
**Date**: 2026-01-06
**Version**: 1.0.0

## Base URL

- **Production**: `https://specboard.app/api`
- **Development**: `http://localhost:3000/api`

## Authentication

All endpoints (except auth) require Bearer token authentication:

```
Authorization: Bearer <session_token>
```

---

## Auth Endpoints

### POST /auth/register

Create a new user account with email/password.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response** (201 Created):
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "emailVerified": false
  },
  "session": {
    "token": "session_token_here",
    "expiresAt": "2026-02-06T00:00:00Z"
  }
}
```

**Errors**:
- 400: Invalid email format, weak password
- 409: Email already registered

---

### POST /auth/login

Authenticate with email/password.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response** (200 OK):
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "session": {
    "token": "session_token_here",
    "expiresAt": "2026-02-06T00:00:00Z"
  }
}
```

**Errors**:
- 401: Invalid credentials

---

### GET /auth/oauth/:provider

Initiate OAuth flow (google, github).

**Response**: Redirect to OAuth provider

---

### GET /auth/oauth/:provider/callback

OAuth callback handler.

**Response**: Redirect to dashboard with session cookie set

---

### POST /auth/logout

End current session.

**Response** (200 OK):
```json
{
  "success": true
}
```

---

## Project Endpoints

### GET /projects/cloud

List cloud projects for authenticated user.

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response** (200 OK):
```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "My Project",
      "slug": "my-project",
      "description": "Project description",
      "role": "ADMIN",
      "specsCount": 5,
      "membersCount": 3,
      "lastSyncAt": "2026-01-05T10:00:00Z",
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### POST /projects/cloud

Create a new cloud project.

**Request**:
```json
{
  "name": "My New Project",
  "description": "Optional description"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "name": "My New Project",
  "slug": "my-new-project",
  "description": "Optional description",
  "ownerId": "user-uuid",
  "createdAt": "2026-01-06T00:00:00Z"
}
```

**Errors**:
- 400: Invalid name
- 409: Slug already exists

---

### GET /projects/cloud/:slug

Get cloud project details.

**Response** (200 OK):
```json
{
  "id": "uuid",
  "name": "My Project",
  "slug": "my-project",
  "description": "Description",
  "owner": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "role": "ADMIN",
  "specsCount": 5,
  "membersCount": 3,
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-05T00:00:00Z"
}
```

**Errors**:
- 403: Not a member
- 404: Project not found

---

### DELETE /projects/cloud/:slug

Delete a cloud project (owner only).

**Response** (200 OK):
```json
{
  "success": true
}
```

**Errors**:
- 403: Not the owner
- 404: Project not found

---

## Project Link Endpoints

### POST /projects/cloud/:slug/links

Generate a project link code (Admin only).

**Request**:
```json
{
  "role": "EDIT"
}
```

**Response** (201 Created):
```json
{
  "code": "ABC123",
  "role": "EDIT",
  "expiresAt": "2026-01-07T00:00:00Z"
}
```

**Errors**:
- 403: Not an admin

---

### POST /projects/cloud/connect

Redeem a project link code.

**Request**:
```json
{
  "code": "ABC123"
}
```

**Response** (200 OK):
```json
{
  "project": {
    "id": "uuid",
    "name": "My Project",
    "slug": "my-project"
  },
  "role": "EDIT"
}
```

**Errors**:
- 400: Invalid or expired code
- 409: Already a member

---

## Member Endpoints

### GET /projects/cloud/:slug/members

List project members (any member can view).

**Response** (200 OK):
```json
{
  "members": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com",
        "avatarUrl": "https://..."
      },
      "role": "ADMIN",
      "joinedAt": "2026-01-01T00:00:00Z",
      "lastSyncAt": "2026-01-05T10:00:00Z"
    }
  ]
}
```

---

### PATCH /projects/cloud/:slug/members/:userId

Update member role (Admin only).

**Request**:
```json
{
  "role": "EDIT"
}
```

**Response** (200 OK):
```json
{
  "id": "uuid",
  "userId": "uuid",
  "role": "EDIT"
}
```

**Errors**:
- 403: Not an admin, or trying to demote owner
- 404: Member not found

---

### DELETE /projects/cloud/:slug/members/:userId

Remove member (Admin only, cannot remove owner).

**Response** (200 OK):
```json
{
  "success": true
}
```

---

## Sync Endpoints

### GET /sync/:slug/status

Get sync status for a project.

**Response** (200 OK):
```json
{
  "projectId": "uuid",
  "lastSyncAt": "2026-01-05T10:00:00Z",
  "specsCount": 5,
  "pendingConflicts": 1,
  "specs": [
    {
      "path": "specs/001-feature/spec.md",
      "checksum": "sha256hash",
      "lastModifiedAt": "2026-01-05T10:00:00Z",
      "lastModifiedBy": {
        "id": "uuid",
        "name": "John Doe"
      }
    }
  ]
}
```

---

### POST /sync/:slug/push

Push local changes to cloud (Edit/Admin only).

**Request**:
```json
{
  "specs": [
    {
      "path": "specs/001-feature/spec.md",
      "content": "# Feature Spec\n\nContent here...",
      "localChecksum": "sha256hash"
    }
  ],
  "deleted": [
    "specs/002-old-feature/spec.md"
  ]
}
```

**Response** (200 OK):
```json
{
  "pushed": [
    {
      "path": "specs/001-feature/spec.md",
      "checksum": "sha256hash",
      "version": 5
    }
  ],
  "archived": [
    "specs/002-old-feature/spec.md"
  ],
  "conflicts": [
    {
      "id": "conflict-uuid",
      "path": "specs/003-conflict/spec.md",
      "localChecksum": "local-sha256",
      "cloudChecksum": "cloud-sha256"
    }
  ]
}
```

**Errors**:
- 403: View-only member
- 413: Content too large (>1MB per file)

---

### GET /sync/:slug/pull

Pull cloud changes to local.

**Query Parameters**:
- `since` (optional): ISO timestamp to get changes since

**Response** (200 OK):
```json
{
  "specs": [
    {
      "path": "specs/001-feature/spec.md",
      "content": "# Feature Spec\n\nContent here...",
      "checksum": "sha256hash",
      "lastModifiedAt": "2026-01-05T10:00:00Z",
      "lastModifiedBy": {
        "id": "uuid",
        "name": "John Doe"
      }
    }
  ],
  "archived": [
    {
      "path": "specs/002-old-feature/spec.md",
      "archivedAt": "2026-01-04T00:00:00Z"
    }
  ]
}
```

---

## Conflict Endpoints

### GET /sync/:slug/conflicts

List pending conflicts for a project.

**Response** (200 OK):
```json
{
  "conflicts": [
    {
      "id": "uuid",
      "specPath": "specs/001-feature/spec.md",
      "localContent": "Local version...",
      "cloudContent": "Cloud version...",
      "localUser": {
        "id": "uuid",
        "name": "John Doe"
      },
      "cloudUser": {
        "id": "uuid",
        "name": "Jane Smith"
      },
      "createdAt": "2026-01-05T10:00:00Z"
    }
  ]
}
```

---

### POST /sync/:slug/conflicts/:conflictId/resolve

Resolve a conflict (Edit/Admin only).

**Request**:
```json
{
  "resolution": "KEEP_LOCAL",
  "mergedContent": null
}
```

Or for manual merge:
```json
{
  "resolution": "MERGE",
  "mergedContent": "Manually merged content..."
}
```

**Resolution options**: `KEEP_LOCAL`, `KEEP_CLOUD`, `MERGE`

**Response** (200 OK):
```json
{
  "success": true,
  "spec": {
    "path": "specs/001-feature/spec.md",
    "checksum": "sha256hash",
    "version": 6
  }
}
```

---

## Spec Version Endpoints

### GET /sync/:slug/specs/:path/versions

Get version history for a spec.

**Path encoding**: URL-encode the spec path (e.g., `specs%2F001-feature%2Fspec.md`)

**Response** (200 OK):
```json
{
  "versions": [
    {
      "version": 5,
      "checksum": "sha256hash",
      "modifiedBy": {
        "id": "uuid",
        "name": "John Doe"
      },
      "createdAt": "2026-01-05T10:00:00Z"
    }
  ]
}
```

---

### GET /sync/:slug/specs/:path/versions/:version

Get specific version content.

**Response** (200 OK):
```json
{
  "version": 5,
  "content": "# Feature Spec\n\nContent at version 5...",
  "checksum": "sha256hash",
  "modifiedBy": {
    "id": "uuid",
    "name": "John Doe"
  },
  "createdAt": "2026-01-05T10:00:00Z"
}
```

---

## Error Response Format

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

**Common Error Codes**:
- `UNAUTHORIZED`: Missing or invalid auth token
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid request data
- `CONFLICT`: Resource conflict (duplicate, etc.)
- `RATE_LIMITED`: Too many requests
- `INTERNAL_ERROR`: Server error
