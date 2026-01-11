# Implementation Plan: Remote Spec-Kit Drivers

**Feature Branch**: `010-remote-spec-kit-drivers`
**Created**: 2026-01-11
**Status**: Planning

## Overview

This feature enables SpecBoard to execute spec-kit operations in isolated remote environments (E2B sandbox, Daytona workspace, Docker container) for security, reproducibility, and preventing local system contamination.

## Technical Stack

### Core Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| Next.js | Web application framework | 16.x |
| TypeScript | Type-safe development | 5.x |
| React | UI components | 19.x |
| Zustand | State management | 5.x |
| Prisma | Database ORM | 5.x |

### New Dependencies

| Package | Purpose |
|---------|---------|
| `@e2b/code-interpreter` | E2B sandbox SDK |
| `dockerode` | Docker API client |
| `keytar` | OS keychain integration |
| `ws` | WebSocket for real-time streaming (already installed) |

### Driver SDKs

| Driver | SDK/API | Documentation |
|--------|---------|---------------|
| E2B | `@e2b/code-interpreter` | https://e2b.dev/docs |
| Daytona | REST API | https://daytona.io/docs |
| Docker | `dockerode` | https://github.com/apocas/dockerode |

## Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                     SpecBoard Web App                        │
├─────────────────────────────────────────────────────────────┤
│  UI Layer                                                    │
│  ├── Driver Configuration Modal                              │
│  ├── Remote Execution Status Panel                           │
│  └── Sync Progress Indicator                                 │
├─────────────────────────────────────────────────────────────┤
│  Driver Manager (src/lib/drivers/manager.ts)                 │
│  ├── Driver Registry                                         │
│  ├── Configuration Store                                     │
│  └── Active Session Manager                                  │
├─────────────────────────────────────────────────────────────┤
│  Driver Interface (src/lib/drivers/types.ts)                 │
│  ├── IRemoteDriver                                           │
│  ├── IDriverConfig                                           │
│  └── IRemoteSession                                          │
├─────────────────────────────────────────────────────────────┤
│  Driver Implementations                                      │
│  ├── E2BDriver (src/lib/drivers/e2b.ts)                     │
│  ├── DaytonaDriver (src/lib/drivers/daytona.ts)             │
│  └── DockerDriver (src/lib/drivers/docker.ts)               │
├─────────────────────────────────────────────────────────────┤
│  File Sync Service (src/lib/drivers/sync.ts)                │
│  ├── Delta-based transfer                                    │
│  ├── Exclusion patterns (.gitignore-like)                   │
│  └── Conflict detection                                      │
└─────────────────────────────────────────────────────────────┘
```

### Driver Interface

```typescript
interface IRemoteDriver {
  // Lifecycle
  connect(config: IDriverConfig): Promise<IRemoteSession>;
  disconnect(session: IRemoteSession): Promise<void>;

  // Execution
  execute(session: IRemoteSession, command: string): Promise<ExecutionResult>;
  streamOutput(session: IRemoteSession): AsyncIterable<OutputChunk>;
  cancel(session: IRemoteSession): Promise<void>;

  // File operations
  uploadFiles(session: IRemoteSession, files: FileManifest): Promise<void>;
  downloadFiles(session: IRemoteSession, paths: string[]): Promise<FileManifest>;

  // Status
  getStatus(session: IRemoteSession): Promise<SessionStatus>;
}
```

### Database Schema Extensions

```prisma
model DriverConfig {
  id          String   @id @default(cuid())
  name        String   // Profile name
  driverType  String   // 'e2b' | 'daytona' | 'docker'
  settings    Json     // Driver-specific settings
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Credentials stored in OS keychain, not database
  // keychainKey: derived from id
}

model RemoteSession {
  id           String   @id @default(cuid())
  configId     String
  status       String   // 'connecting' | 'active' | 'disconnected' | 'error'
  startedAt    DateTime @default(now())
  lastActivity DateTime @updatedAt
  metadata     Json?    // Session-specific data

  config       DriverConfig @relation(fields: [configId], references: [id])
}

model SyncManifest {
  id          String   @id @default(cuid())
  sessionId   String
  localPath   String
  remotePath  String
  checksum    String
  syncedAt    DateTime @default(now())
  direction   String   // 'upload' | 'download'

  session     RemoteSession @relation(fields: [sessionId], references: [id])
}
```

## Project Structure

```
src/
├── lib/
│   └── drivers/
│       ├── types.ts           # Interfaces and types
│       ├── manager.ts         # Driver manager singleton
│       ├── e2b.ts             # E2B driver implementation
│       ├── daytona.ts         # Daytona driver implementation
│       ├── docker.ts          # Docker driver implementation
│       ├── sync.ts            # File synchronization service
│       ├── keychain.ts        # OS keychain integration
│       └── index.ts           # Public exports
├── app/
│   ├── api/
│   │   └── drivers/
│   │       ├── route.ts           # List/create driver configs
│   │       ├── [id]/
│   │       │   └── route.ts       # Get/update/delete config
│   │       ├── connect/
│   │       │   └── route.ts       # Connect to driver
│   │       ├── execute/
│   │       │   └── route.ts       # Execute command
│   │       ├── sync/
│   │       │   └── route.ts       # File sync operations
│   │       └── status/
│   │           └── route.ts       # Session status (SSE)
│   └── settings/
│       └── drivers/
│           └── page.tsx           # Driver configuration UI
├── components/
│   └── drivers/
│       ├── driver-config-modal.tsx    # Configuration form
│       ├── driver-selector.tsx        # Driver dropdown
│       ├── execution-panel.tsx        # Output streaming
│       ├── sync-progress.tsx          # Sync status
│       └── session-status.tsx         # Connection status
└── types/
    └── drivers.ts                     # Driver-related types
```

## Implementation Phases

### Phase 1: Setup (Shared Infrastructure)
- Install dependencies
- Create driver types and interfaces
- Set up database schema

### Phase 2: Foundational (Blocking Prerequisites)
- Implement driver manager
- Implement keychain integration
- Create base driver class
- Set up file sync service

### Phase 3: User Story 1 - Execute in Remote Sandbox (P1) MVP
- Implement E2B driver
- Implement Docker driver
- Create execution API endpoints
- Build output streaming

### Phase 4: User Story 2 - Configure and Switch Drivers (P2)
- Create driver configuration API
- Build configuration UI
- Implement profile switching

### Phase 5: User Story 3 - File Synchronization (P2)
- Implement bidirectional sync
- Add exclusion patterns
- Handle sync conflicts

### Phase 6: User Story 4 - Monitor Execution Status (P3)
- Add status API endpoint
- Build status UI components
- Implement cancellation

### Phase 7: Polish & Cross-Cutting
- Error handling improvements
- Documentation
- Performance optimization

## Security Considerations

1. **Credential Storage**: All credentials stored in OS keychain (keytar), never in database
2. **Path Validation**: Reuse existing `path-utils.ts` for file sync operations
3. **Input Validation**: Validate all driver configurations before saving
4. **Session Isolation**: Each remote session is isolated; cleanup on disconnect
5. **Network Security**: Use HTTPS for all remote API calls

## Success Metrics

| Metric | Target |
|--------|--------|
| Remote execution latency | < 30 seconds |
| File sync (< 1000 files) | < 60 seconds |
| Output streaming latency | < 2 seconds |
| Connection success rate | > 95% |
| Resource cleanup time | < 60 seconds |

## Dependencies on Other Features

- **Feature 011 (Cloud Sync)**: May share file sync utilities
- **Existing Infrastructure**: Uses existing auth, path validation, SSE patterns

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| E2B API changes | Pin SDK version, monitor changelog |
| Docker not installed | Graceful error with installation instructions |
| Network interruptions | Checkpoint progress, auto-reconnect |
| Credential leakage | OS keychain only, never log credentials |
