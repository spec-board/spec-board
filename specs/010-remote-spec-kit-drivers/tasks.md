# Tasks: Remote Spec-Kit Drivers

**Input**: Design documents from `/specs/010-remote-spec-kit-drivers/`
**Prerequisites**: plan.md, spec.md

**Tests**: Tests are NOT explicitly requested in the specification. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `src/` at repository root (Next.js App Router)
- **Drivers**: `src/lib/drivers/` for driver implementations
- **API**: `src/app/api/drivers/` for API routes
- **Components**: `src/components/drivers/` for UI components

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency installation

- [ ] T001 Install driver dependencies: @e2b/code-interpreter, keytar in package.json
- [ ] T002 [P] Add driver-related types to src/types/drivers.ts (DriverType, DriverConfig, RemoteSession, ExecutionResult, etc.)
- [ ] T003 [P] Create driver interface definitions in src/lib/drivers/types.ts (IRemoteDriver, IDriverConfig, IRemoteSession)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

### Database Schema

- [ ] T004 Add DriverConfig model to prisma/schema.prisma (id, name, driverType, settings, isDefault, timestamps)
- [ ] T005 [P] Add RemoteSession model to prisma/schema.prisma (id, configId, status, startedAt, lastActivity, metadata)
- [ ] T006 [P] Add SyncManifest model to prisma/schema.prisma (id, sessionId, localPath, remotePath, checksum, syncedAt, direction)
- [ ] T007 Run prisma migrate to create database tables

### Core Infrastructure

- [ ] T008 Create keychain integration utility in src/lib/drivers/keychain.ts (store, retrieve, delete credentials)
- [ ] T009 [P] Create base driver class in src/lib/drivers/base.ts (common functionality for all drivers)
- [ ] T010 [P] Create driver manager singleton in src/lib/drivers/manager.ts (registry, active sessions, config store)
- [ ] T011 Create driver exports in src/lib/drivers/index.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Execute Spec-Kit in Remote Sandbox (Priority: P1) MVP

**Goal**: Users can execute spec-kit commands in isolated remote environments (E2B) and receive output in real-time.

**Independent Test**: Configure E2B driver, execute a simple command (e.g., `echo "hello"`), verify output streams back to the UI within 30 seconds.

### Driver Implementations

- [ ] T012 [US1] Implement E2B driver in src/lib/drivers/e2b.ts (connect, execute, streamOutput, disconnect)

> **Future Feature**: Docker and Daytona drivers will be implemented in a future iteration
> - Docker driver in src/lib/drivers/docker.ts
> - Daytona driver in src/lib/drivers/daytona.ts

### API Endpoints

- [ ] T015 [US1] Create POST /api/drivers/connect endpoint in src/app/api/drivers/connect/route.ts (establish remote session)
- [ ] T016 [US1] Create POST /api/drivers/execute endpoint in src/app/api/drivers/execute/route.ts (run command in session)
- [ ] T017 [US1] Create GET /api/drivers/status endpoint in src/app/api/drivers/status/route.ts (SSE for output streaming)
- [ ] T018 [US1] Create POST /api/drivers/disconnect endpoint in src/app/api/drivers/disconnect/route.ts (cleanup session)

### UI Components

- [ ] T019 [US1] Create execution panel component in src/components/drivers/execution-panel.tsx (command input, output display)
- [ ] T020 [P] [US1] Create session status indicator in src/components/drivers/session-status.tsx (connected/disconnected/error)

**Checkpoint**: At this point, User Story 1 should be fully functional - users can execute commands in remote sandboxes

---

## Phase 4: User Story 2 - Configure and Switch Between Drivers (Priority: P2)

**Goal**: Users can create, save, and switch between multiple driver configurations (profiles).

**Independent Test**: Create an E2B driver profile, verify the configuration saves and subsequent operations use the selected driver.

### API Endpoints

- [ ] T021 [US2] Create GET/POST /api/drivers endpoint in src/app/api/drivers/route.ts (list and create driver configs)
- [ ] T022 [US2] Create GET/PUT/DELETE /api/drivers/[id] endpoint in src/app/api/drivers/[id]/route.ts (manage single config)
- [ ] T023 [US2] Create POST /api/drivers/[id]/activate endpoint in src/app/api/drivers/[id]/activate/route.ts (set as active driver)

### Services

- [ ] T024 [US2] Create DriverConfigService in src/lib/services/driver-config.ts (CRUD operations, validation, default management)

### UI Components

- [ ] T025 [US2] Create driver configuration modal in src/components/drivers/driver-config-modal.tsx (form for all driver types)
- [ ] T026 [P] [US2] Create driver selector dropdown in src/components/drivers/driver-selector.tsx (switch between profiles)
- [ ] T027 [US2] Create driver settings page in src/app/settings/drivers/page.tsx (list, add, edit, delete configs)

**Checkpoint**: At this point, User Story 2 should be fully functional - users can manage multiple driver configurations

---

## Phase 5: User Story 3 - File Synchronization Between Local and Remote (Priority: P2)

**Goal**: Project files are automatically synchronized to remote environments before execution and results synced back after completion.

**Independent Test**: Modify a local file, trigger sync, verify the change appears in the remote environment. Make a change remotely, verify it syncs back to local.

### Sync Service

- [ ] T028 [US3] Create file sync service in src/lib/drivers/sync.ts (upload, download, delta detection)
- [ ] T029 [P] [US3] Create sync manifest tracker in src/lib/drivers/sync-manifest.ts (track synced files, checksums)
- [ ] T030 [US3] Create exclusion pattern handler in src/lib/drivers/sync-exclude.ts (parse .gitignore-like patterns)

### API Endpoints

- [ ] T031 [US3] Create POST /api/drivers/sync/upload endpoint in src/app/api/drivers/sync/upload/route.ts (sync local to remote)
- [ ] T032 [P] [US3] Create POST /api/drivers/sync/download endpoint in src/app/api/drivers/sync/download/route.ts (sync remote to local)
- [ ] T033 [US3] Create GET /api/drivers/sync/status endpoint in src/app/api/drivers/sync/status/route.ts (sync progress SSE)

### UI Components

- [ ] T034 [US3] Create sync progress indicator in src/components/drivers/sync-progress.tsx (upload/download progress)
- [ ] T035 [P] [US3] Create sync conflict dialog in src/components/drivers/sync-conflict-dialog.tsx (resolve local vs remote conflicts)

**Checkpoint**: At this point, User Story 3 should be fully functional - files sync bidirectionally

---

## Phase 6: User Story 4 - Monitor Remote Execution Status (Priority: P3)

**Goal**: Users can monitor long-running operations, see resource usage, and cancel operations if needed.

**Independent Test**: Start a long-running command, verify status updates display in real-time, cancel the operation, verify it stops and resources are released.

### Monitoring Service

- [ ] T036 [US4] Add resource monitoring to driver implementations in src/lib/drivers/base.ts (CPU, memory, elapsed time)
- [ ] T037 [US4] Implement cancellation support in E2B driver (Docker/Daytona: future feature)

### API Endpoints

- [ ] T038 [US4] Create POST /api/drivers/cancel endpoint in src/app/api/drivers/cancel/route.ts (cancel running operation)
- [ ] T039 [P] [US4] Create GET /api/drivers/resources endpoint in src/app/api/drivers/resources/route.ts (resource usage SSE)

### UI Components

- [ ] T040 [US4] Create operation monitor panel in src/components/drivers/operation-monitor.tsx (status, elapsed time, resources)
- [ ] T041 [P] [US4] Add cancel button to execution panel in src/components/drivers/execution-panel.tsx

**Checkpoint**: At this point, User Story 4 should be fully functional - users can monitor and cancel operations

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T042 [P] Add error handling and retry logic to all drivers in src/lib/drivers/
- [ ] T043 [P] Add connection recovery for network interruptions in src/lib/drivers/base.ts
- [ ] T044 [P] Create CLAUDE.md documentation for drivers module in src/lib/drivers/CLAUDE.md
- [ ] T045 Add driver feature to settings navigation in src/app/settings/page.tsx
- [ ] T046 Run quickstart.md validation scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 (P1): Can start after Foundational
  - US2 (P2): Can start after Foundational (independent of US1)
  - US3 (P2): Can start after Foundational (independent of US1, US2)
  - US4 (P3): Depends on US1 (needs execution infrastructure)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: No dependencies on other stories - MVP
- **User Story 2 (P2)**: No dependencies on other stories
- **User Story 3 (P2)**: No dependencies on other stories
- **User Story 4 (P3)**: Depends on US1 (execution infrastructure must exist)

### Within Each User Story

- Driver implementations before API endpoints
- API endpoints before UI components
- Core functionality before enhancements

### Parallel Opportunities

**Phase 1 (Setup)**:
```
T002 (types) || T003 (interfaces)
```

**Phase 2 (Foundational)**:
```
T005 (RemoteSession model) || T006 (SyncManifest model)
T009 (base driver) || T010 (manager)
```

**Phase 3 (US1)**:
```
T012 (E2B) || T013 (Docker) || T014 (Daytona)
T019 (execution panel) || T020 (session status)
```

**Phase 4 (US2)**:
```
T025 (config modal) || T026 (selector)
```

**Phase 5 (US3)**:
```
T028 (sync service) || T029 (manifest) || T030 (exclude)
T031 (upload) || T032 (download)
T034 (progress) || T035 (conflict dialog)
```

**Phase 6 (US4)**:
```
T038 (cancel) || T039 (resources)
T040 (monitor) || T041 (cancel button)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test remote execution independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (Configuration)
4. Add User Story 3 → Test independently → Deploy/Demo (File Sync)
5. Add User Story 4 → Test independently → Deploy/Demo (Monitoring)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Execution)
   - Developer B: User Story 2 (Configuration)
   - Developer C: User Story 3 (File Sync)
3. User Story 4 starts after US1 completes
4. Stories integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Credentials MUST be stored in OS keychain (keytar), never in database
- Reuse existing path-utils.ts for file sync path validation
