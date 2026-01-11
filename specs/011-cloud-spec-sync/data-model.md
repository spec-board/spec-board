# Data Model: Cloud Specification Sync

**Feature**: 011-cloud-spec-sync
**Date**: 2026-01-06
**Status**: Complete

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────┐
│    User     │───────│  ProjectMember  │───────│CloudProject │
└─────────────┘  1:N  └─────────────────┘  N:1  └─────────────┘
      │                                               │
      │                                               │ 1:N
      │                                               ▼
      │                                        ┌─────────────┐
      │                                        │ SyncedSpec  │
      │                                        └─────────────┘
      │                                               │
      │ 1:N                                           │ 1:N
      ▼                                               ▼
┌─────────────┐                               ┌─────────────┐
│   Session   │                               │SpecVersion  │
└─────────────┘                               └─────────────┘

┌─────────────┐       ┌─────────────────┐
│CloudProject │───────│  ProjectLink    │
└─────────────┘  1:N  └─────────────────┘

┌─────────────┐       ┌─────────────────┐
│ SyncedSpec  │───────│ ConflictRecord  │
└─────────────┘  1:N  └─────────────────┘

┌─────────────┐       ┌─────────────────┐
│CloudProject │───────│   SyncEvent     │
└─────────────┘  1:N  └─────────────────┘
```

## Entities

### User

Represents an authenticated user of the SpecBoard cloud service.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| email | String | Unique, Not Null | User's email address |
| name | String | Not Null | Display name |
| passwordHash | String | Nullable | Hashed password (null for OAuth-only users) |
| avatarUrl | String | Nullable | Profile picture URL |
| emailVerified | Boolean | Default: false | Email verification status |
| createdAt | DateTime | Not Null | Account creation timestamp |
| updatedAt | DateTime | Not Null | Last update timestamp |

**Relationships**:
- Has many `Session` (authentication sessions)
- Has many `ProjectMember` (project memberships)
- Has many `SpecVersion` (as modifier)
- Has many `SyncEvent` (as actor)

### Session

Authentication session for a user (managed by Better Auth).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| userId | UUID | FK → User | Owner of the session |
| token | String | Unique, Not Null | Session token |
| expiresAt | DateTime | Not Null | Session expiration |
| ipAddress | String | Nullable | Client IP address |
| userAgent | String | Nullable | Client user agent |
| createdAt | DateTime | Not Null | Session creation timestamp |

### OAuthAccount

OAuth provider connections for a user.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| userId | UUID | FK → User | Associated user |
| provider | String | Not Null | Provider name (google, github) |
| providerAccountId | String | Not Null | ID from OAuth provider |
| accessToken | String | Nullable | OAuth access token |
| refreshToken | String | Nullable | OAuth refresh token |
| expiresAt | DateTime | Nullable | Token expiration |
| createdAt | DateTime | Not Null | Connection timestamp |

**Constraints**:
- Unique: (provider, providerAccountId)

### CloudProject

A spec-kit project stored in the cloud.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | String | Not Null | Project display name |
| slug | String | Unique, Not Null | URL-safe identifier |
| description | String | Nullable | Project description |
| ownerId | UUID | FK → User | Project owner |
| isArchived | Boolean | Default: false | Soft delete flag |
| createdAt | DateTime | Not Null | Creation timestamp |
| updatedAt | DateTime | Not Null | Last update timestamp |

**Relationships**:
- Belongs to `User` (owner)
- Has many `ProjectMember`
- Has many `SyncedSpec`
- Has many `ProjectLink`
- Has many `SyncEvent`

**Validation**:
- slug: lowercase alphanumeric with hyphens, 3-50 chars
- name: 1-100 chars

### ProjectMember

Association between users and projects with role-based access.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| projectId | UUID | FK → CloudProject | Associated project |
| userId | UUID | FK → User | Associated user |
| role | Enum | Not Null | Access level: VIEW, EDIT, ADMIN |
| invitedBy | UUID | FK → User, Nullable | User who sent invite |
| joinedAt | DateTime | Not Null | Membership start |
| lastSyncAt | DateTime | Nullable | Last sync activity |

**Constraints**:
- Unique: (projectId, userId)

**Role Permissions**:
- VIEW: Read specs, pull to local
- EDIT: VIEW + push changes, resolve conflicts
- ADMIN: EDIT + manage members, generate links, project settings

### ProjectLink

Single-use codes for connecting local projects to cloud.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| projectId | UUID | FK → CloudProject | Target project |
| code | String | Unique, Not Null | 6-char alphanumeric code |
| createdBy | UUID | FK → User | Admin who generated |
| role | Enum | Not Null | Role granted on use: VIEW, EDIT |
| usedBy | UUID | FK → User, Nullable | User who redeemed |
| usedAt | DateTime | Nullable | Redemption timestamp |
| expiresAt | DateTime | Not Null | Code expiration (24h) |
| createdAt | DateTime | Not Null | Generation timestamp |

**Validation**:
- code: 6 uppercase alphanumeric chars (A-Z, 0-9)
- Cannot be used after expiration
- Cannot be used twice

### SyncedSpec

A specification file stored in the cloud.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| projectId | UUID | FK → CloudProject | Parent project |
| path | String | Not Null | Relative path (e.g., "specs/001-feature/spec.md") |
| fileType | Enum | Not Null | SPEC, PLAN, TASKS, RESEARCH, OTHER |
| content | Text | Not Null | Current file content |
| checksum | String | Not Null | SHA-256 of content |
| lastModifiedBy | UUID | FK → User | Last modifier |
| lastModifiedAt | DateTime | Not Null | Last modification |
| isArchived | Boolean | Default: false | Soft delete flag |
| createdAt | DateTime | Not Null | Creation timestamp |

**Constraints**:
- Unique: (projectId, path) where isArchived = false

**Validation**:
- path: must match pattern `specs/[feature-name]/[file].md`
- content: max 1MB
- checksum: SHA-256 hex string (64 chars)

### SpecVersion

Historical versions of a spec file (last 30 retained).

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| specId | UUID | FK → SyncedSpec | Parent spec |
| version | Integer | Not Null | Version number (1, 2, 3...) |
| content | Text | Not Null | Content at this version |
| checksum | String | Not Null | SHA-256 of content |
| modifiedBy | UUID | FK → User | Who made this version |
| createdAt | DateTime | Not Null | Version timestamp |

**Constraints**:
- Unique: (specId, version)
- Max 30 versions per spec (oldest auto-deleted)

### ConflictRecord

Records of sync conflicts requiring resolution.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| specId | UUID | FK → SyncedSpec | Conflicting spec |
| localContent | Text | Not Null | User's local version |
| localChecksum | String | Not Null | Checksum of local |
| cloudContent | Text | Not Null | Cloud version at conflict |
| cloudChecksum | String | Not Null | Checksum of cloud |
| localUserId | UUID | FK → User | User with local changes |
| cloudUserId | UUID | FK → User | User who pushed cloud version |
| status | Enum | Not Null | PENDING, RESOLVED_LOCAL, RESOLVED_CLOUD, RESOLVED_MERGE |
| resolvedBy | UUID | FK → User, Nullable | Who resolved |
| resolvedContent | Text | Nullable | Final merged content |
| resolvedAt | DateTime | Nullable | Resolution timestamp |
| createdAt | DateTime | Not Null | Conflict detection time |

### SyncEvent

Audit log of sync operations.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| projectId | UUID | FK → CloudProject | Associated project |
| userId | UUID | FK → User | Actor |
| eventType | Enum | Not Null | PUSH, PULL, CONFLICT_DETECTED, CONFLICT_RESOLVED |
| specPath | String | Nullable | Affected spec path |
| details | JSON | Nullable | Additional event data |
| createdAt | DateTime | Not Null | Event timestamp |

## State Transitions

### ProjectMember.role

```
(invite) → VIEW ──────────────────────────────────┐
              │                                    │
              ▼ (promote)                          │
           EDIT ──────────────────────────────────┤
              │                                    │
              ▼ (promote)                          │
           ADMIN ─────────────────────────────────┘
              │                     (demote any)
              ▼
         (remove) → [deleted]
```

### ConflictRecord.status

```
[created] → PENDING ─────┬─────────────────────────────┐
                         │                             │
                         ▼ (keep local)                │
                   RESOLVED_LOCAL                      │
                         │                             │
                         ├─────────────────────────────┤
                         │                             │
                         ▼ (keep cloud)                │
                   RESOLVED_CLOUD                      │
                         │                             │
                         ├─────────────────────────────┤
                         │                             │
                         ▼ (manual merge)              │
                   RESOLVED_MERGE ─────────────────────┘
```

### SyncedSpec lifecycle

```
[push] → ACTIVE ◄──────────────────────────────────┐
            │                                       │
            ▼ (local delete + push)                 │
        ARCHIVED                                    │
            │                                       │
            ▼ (re-create same path)                 │
        [new spec created] ─────────────────────────┘
```

## Indexes

### Performance Indexes

```sql
-- User lookups
CREATE INDEX idx_user_email ON "User"(email);

-- Project member queries
CREATE INDEX idx_project_member_user ON "ProjectMember"(userId);
CREATE INDEX idx_project_member_project ON "ProjectMember"(projectId);

-- Spec queries
CREATE INDEX idx_synced_spec_project ON "SyncedSpec"(projectId) WHERE isArchived = false;
CREATE INDEX idx_synced_spec_path ON "SyncedSpec"(projectId, path) WHERE isArchived = false;

-- Version history
CREATE INDEX idx_spec_version_spec ON "SpecVersion"(specId);

-- Conflict resolution
CREATE INDEX idx_conflict_pending ON "ConflictRecord"(specId) WHERE status = 'PENDING';

-- Link redemption
CREATE INDEX idx_project_link_code ON "ProjectLink"(code) WHERE usedAt IS NULL;

-- Audit trail
CREATE INDEX idx_sync_event_project ON "SyncEvent"(projectId, createdAt DESC);
```

## Prisma Schema Extension

```prisma
// Add to existing schema.prisma

enum MemberRole {
  VIEW
  EDIT
  ADMIN
}

enum FileType {
  SPEC
  PLAN
  TASKS
  RESEARCH
  OTHER
}

enum ConflictStatus {
  PENDING
  RESOLVED_LOCAL
  RESOLVED_CLOUD
  RESOLVED_MERGE
}

enum SyncEventType {
  PUSH
  PULL
  CONFLICT_DETECTED
  CONFLICT_RESOLVED
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String
  passwordHash  String?
  avatarUrl     String?
  emailVerified Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  sessions       Session[]
  oauthAccounts  OAuthAccount[]
  memberships    ProjectMember[]
  ownedProjects  CloudProject[]   @relation("ProjectOwner")
  specVersions   SpecVersion[]
  syncEvents     SyncEvent[]
  createdLinks   ProjectLink[]    @relation("LinkCreator")
  usedLinks      ProjectLink[]    @relation("LinkUser")
  conflicts      ConflictRecord[] @relation("LocalUser")
  resolvedConflicts ConflictRecord[] @relation("Resolver")
}

model CloudProject {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  description String?
  ownerId     String
  isArchived  Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  owner    User            @relation("ProjectOwner", fields: [ownerId], references: [id])
  members  ProjectMember[]
  specs    SyncedSpec[]
  links    ProjectLink[]
  events   SyncEvent[]
}

model ProjectMember {
  id         String     @id @default(uuid())
  projectId  String
  userId     String
  role       MemberRole
  invitedBy  String?
  joinedAt   DateTime   @default(now())
  lastSyncAt DateTime?

  project User @relation(fields: [projectId], references: [id])
  user    User @relation(fields: [userId], references: [id])

  @@unique([projectId, userId])
}

model SyncedSpec {
  id             String   @id @default(uuid())
  projectId      String
  path           String
  fileType       FileType
  content        String
  checksum       String
  lastModifiedBy String
  lastModifiedAt DateTime
  isArchived     Boolean  @default(false)
  createdAt      DateTime @default(now())

  project   CloudProject     @relation(fields: [projectId], references: [id])
  modifier  User             @relation(fields: [lastModifiedBy], references: [id])
  versions  SpecVersion[]
  conflicts ConflictRecord[]

  @@unique([projectId, path])
}
```

*Note: Full Prisma schema continues in implementation phase*
