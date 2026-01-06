# Research: Cloud Specification Sync

**Feature**: 011-cloud-spec-sync
**Date**: 2026-01-06
**Status**: Complete

## Research Areas

### 1. Authentication Strategy

**Decision**: Better Auth with email/password + OAuth (Google, GitHub)

**Rationale**:
- Better Auth is a modern, TypeScript-first authentication library designed for Next.js
- Supports multiple providers out of the box (email/password, Google, GitHub)
- Integrates well with Prisma for session/user storage
- Provides built-in CSRF protection and secure session management
- Active maintenance and good documentation

**Alternatives Considered**:
- **NextAuth.js**: More established but transitioning to Auth.js, API changes
- **Clerk**: Excellent UX but adds external dependency and cost
- **Custom JWT**: More control but significant security implementation burden
- **Supabase Auth**: Would require Supabase ecosystem adoption

### 2. Cloud Storage for Spec Content

**Decision**: PostgreSQL with JSONB for spec content + file metadata

**Rationale**:
- SpecBoard already uses PostgreSQL via Prisma
- JSONB allows flexible storage of markdown content with metadata
- Version history can be stored as array of content snapshots
- No additional infrastructure (S3, etc.) needed for MVP
- Transactional consistency with other project data

**Alternatives Considered**:
- **S3/Cloud Storage**: Better for large files but adds complexity, overkill for <1MB markdown
- **Git-based storage**: Natural for versioning but complex conflict resolution
- **Separate document DB (MongoDB)**: Unnecessary additional database

**Storage Schema Approach**:
```
SyncedSpec {
  id, projectId, path, currentContent,
  versions: [{content, timestamp, userId}], // Last 30
  lastModifiedBy, lastModifiedAt, checksum
}
```

### 3. Sync Protocol Design

**Decision**: Manual push/pull with optimistic locking via checksums

**Rationale**:
- Manual sync gives users explicit control (per clarification)
- Checksum comparison detects conflicts before overwrite
- Simple request/response model (no WebSocket complexity for MVP)
- Offline queue stored in CLI's local SQLite database

**Sync Flow**:
1. **Push**: CLI reads local files → computes checksums → sends to API
2. **API**: Compares checksums with cloud versions → accepts or flags conflict
3. **Pull**: CLI requests cloud versions → writes to local filesystem
4. **Conflict**: Both versions preserved, user resolves in dashboard or CLI

**Alternatives Considered**:
- **CRDT-based sync**: Automatic merge but complex implementation
- **Operational Transform**: Real-time collaboration overkill for manual sync
- **Git-style three-way merge**: Complex, better suited for code than specs

### 4. Conflict Detection Algorithm

**Decision**: Content checksum + timestamp comparison

**Rationale**:
- SHA-256 checksum of file content for change detection
- Timestamp used as tiebreaker when checksums differ
- Simple and deterministic
- No need for line-by-line diff for detection (only for resolution UI)

**Conflict Scenarios**:
| Local State | Cloud State | Action |
|-------------|-------------|--------|
| Unchanged | Unchanged | No action |
| Changed | Unchanged | Push succeeds |
| Unchanged | Changed | Pull available |
| Changed | Changed (same) | No conflict (checksums match) |
| Changed | Changed (different) | CONFLICT - user resolves |

### 5. CLI Architecture

**Decision**: Node.js CLI with Commander.js + local SQLite for state

**Rationale**:
- Node.js aligns with existing TypeScript codebase
- Commander.js is mature, well-documented CLI framework
- SQLite stores connection config, offline queue, sync state
- Single binary distribution via pkg or similar

**CLI Commands**:
```bash
specboard connect <project-code>  # Link local folder to cloud project
specboard push                     # Upload local changes
specboard pull                     # Download cloud changes
specboard status                   # Show sync status
specboard disconnect               # Unlink from cloud
```

**Alternatives Considered**:
- **Go CLI**: Faster startup but different language ecosystem
- **Rust CLI**: Performance overkill, learning curve
- **Electron app**: Heavy for simple sync operations

### 6. Project Link Code System

**Decision**: 6-character alphanumeric codes, single-use, 24-hour expiry

**Rationale**:
- Short codes are easy to type/share
- Single-use prevents unauthorized access after initial connection
- 24-hour expiry limits exposure window
- Generated server-side with cryptographic randomness

**Flow**:
1. Project owner generates link code in dashboard
2. Code stored in DB with projectId, createdAt, usedAt (null)
3. CLI user runs `specboard connect ABC123`
4. API validates code, marks as used, returns project details + auth token
5. CLI stores connection in local SQLite

### 7. Access Control Implementation

**Decision**: Role-based access with three levels stored in ProjectMember

**Rationale**:
- Simple model covers common team structures
- Roles stored per-project (user can have different roles in different projects)
- Permission checks at API layer before any mutation

**Permission Matrix**:
| Action | View | Edit | Admin |
|--------|------|------|-------|
| View specs in dashboard | ✅ | ✅ | ✅ |
| Pull specs to local | ✅ | ✅ | ✅ |
| Push changes | ❌ | ✅ | ✅ |
| Resolve conflicts | ❌ | ✅ | ✅ |
| Invite members | ❌ | ❌ | ✅ |
| Remove members | ❌ | ❌ | ✅ |
| Generate link codes | ❌ | ❌ | ✅ |
| Delete project | ❌ | ❌ | ✅ (owner only) |

### 8. Diff Visualization for Conflicts

**Decision**: Use diff-match-patch library for side-by-side comparison

**Rationale**:
- Google's diff-match-patch is battle-tested
- Provides character-level diffs suitable for markdown
- Works in both browser (dashboard) and Node.js (CLI)
- Supports three-way merge if needed later

**UI Approach**:
- Side-by-side view with highlighted differences
- User can choose: Keep Local, Keep Cloud, or Manual Edit
- Manual edit opens merged view with conflict markers

## Technology Stack Summary

| Component | Technology | Version |
|-----------|------------|---------|
| Web Framework | Next.js (App Router) | 16.x |
| Authentication | Better Auth | latest |
| Database | PostgreSQL + Prisma | 5.22.x |
| CLI Framework | Commander.js | 12.x |
| CLI Local Storage | better-sqlite3 | 11.x |
| Diff Library | diff-match-patch | 1.x |
| HTTP Client (CLI) | ky | 1.x |
| File Watching | chokidar | 4.x |

## Open Questions Resolved

1. **Q: How to handle very large spec files (>1MB)?**
   A: Reject at API level with clear error. Specs should be concise; >1MB indicates misuse.

2. **Q: How to handle special characters in filenames?**
   A: URL-encode paths in API, validate against allowlist (alphanumeric, dash, underscore).

3. **Q: What happens when cloud service is unavailable?**
   A: CLI queues changes locally, retries on next push attempt, shows clear offline status.

4. **Q: How to handle folder renames?**
   A: Treat as delete + create. Old spec archived, new spec created. User warned of potential data duplication.
