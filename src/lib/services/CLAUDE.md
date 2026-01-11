# Services Directory

## Purpose
Business logic services for cloud sync operations including project management, conflict resolution, and sync coordination.

## Overview
This directory contains service layer code that handles cloud sync operations. Services encapsulate business logic for managing cloud projects, syncing specs, resolving conflicts, and tracking sync events. Each service corresponds to a database model and provides CRUD operations plus domain-specific logic.

## Key Files

| File | Purpose |
|------|---------|
| `cloud-project.ts` | Cloud project CRUD and management |
| `sync.ts` | Core sync operations (push, pull, diff) |
| `conflict.ts` | Conflict detection and resolution |
| `project-member.ts` | Team member management with roles |
| `project-link.ts` | Link code generation for connecting projects |
| `spec-version.ts` | Version history tracking |
| `sync-event.ts` | Audit log for sync operations |

## Patterns & Conventions

- **Service Pattern**: Each service exports functions for domain operations
- **Prisma Integration**: All services use Prisma client for database access
- **Error Handling**: Services throw errors with descriptive messages
- **Transaction Support**: Complex operations use Prisma transactions
- **Checksum Validation**: SHA-256 checksums for conflict detection
- **Role-Based Access**: Services check user permissions before operations

## Dependencies

- **Internal**: `@/lib/prisma`, `@/lib/sync`, `@/types`
- **External**: `@prisma/client`, `crypto` (for checksums)

## Common Tasks

### Create Cloud Project

```typescript
import { createCloudProject } from '@/lib/services/cloud-project';

const project = await createCloudProject({
  name: 'My Project',
  slug: 'my-project',
  description: 'Project description',
  ownerId: userId,
});
```

### Push Local Changes to Cloud

```typescript
import { pushToCloud } from '@/lib/services/sync';

const result = await pushToCloud({
  cloudProjectId: 'project-id',
  userId: 'user-id',
  features: [
    {
      featureId: '001-feature',
      featureName: 'Feature Name',
      files: [
        { type: 'spec', content: '# Spec content' },
        { type: 'plan', content: '# Plan content' },
      ],
    },
  ],
});
```

### Detect and Resolve Conflicts

```typescript
import { detectConflicts, resolveConflict } from '@/lib/services/conflict';

// Detect conflicts
const conflicts = await detectConflicts(cloudProjectId, localSpecs);

// Resolve conflict
await resolveConflict({
  conflictId: 'conflict-id',
  resolution: 'RESOLVED_LOCAL', // or 'RESOLVED_CLOUD', 'RESOLVED_MERGED'
  resolvedBy: userId,
  mergedContent: '# Merged content', // if RESOLVED_MERGED
});
```

### Manage Team Members

```typescript
import { addMember, updateMemberRole, removeMember } from '@/lib/services/project-member';

// Add member
await addMember({
  cloudProjectId: 'project-id',
  userId: 'user-id',
  role: 'EDIT', // 'VIEW', 'EDIT', or 'ADMIN'
});

// Update role
await updateMemberRole('member-id', 'ADMIN');

// Remove member
await removeMember('member-id');
```

### Generate Link Code

```typescript
import { generateLinkCode, connectWithLinkCode } from '@/lib/services/project-link';

// Generate code (expires in 1 hour)
const code = await generateLinkCode('cloud-project-id');

// Connect local project with code
await connectWithLinkCode({
  code: 'ABC123',
  localProjectId: 'local-project-id',
});
```

## Service Responsibilities

### cloud-project.ts
- Create, read, update, delete cloud projects
- List user's projects with role information
- Validate project ownership and permissions

### sync.ts
- Push local changes to cloud
- Pull cloud changes to local
- Calculate diffs between local and cloud
- Handle sync conflicts
- Track sync events

### conflict.ts
- Detect conflicts during sync
- Store conflict records
- Provide conflict resolution options
- Apply resolved changes
- Track resolution history

### project-member.ts
- Add/remove team members
- Update member roles (VIEW, EDIT, ADMIN)
- Check member permissions
- List project members

### project-link.ts
- Generate 6-character link codes
- Validate and consume link codes
- Connect local projects to cloud
- Handle code expiration (1 hour)

### spec-version.ts
- Track version history for specs
- Store checksums for each version
- Enable rollback to previous versions
- Support conflict resolution

### sync-event.ts
- Log all sync operations
- Track push/pull events
- Record conflict detection
- Audit trail for compliance

## Important Notes

- **Transactions**: Use Prisma transactions for multi-step operations
- **Checksums**: Always calculate SHA-256 checksums for conflict detection
- **Permissions**: Check user role before allowing operations
- **Link Codes**: Expire after 1 hour, single-use only
- **Conflict Resolution**: Requires user decision (local, cloud, or merged)
- **Audit Trail**: All sync operations logged to `sync_events` table
- **Error Handling**: Services throw descriptive errors for client handling
