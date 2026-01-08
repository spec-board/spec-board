# Tasks: Cloud Specification Sync

**Input**: Design documents from `/specs/011-cloud-spec-sync/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are NOT explicitly requested in the specification. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `src/` at repository root (Next.js App Router)
- **MCP package**: `packages/spec-board-mcp/src/` *(replaces CLI per clarification 2026-01-06)*

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

**Note**: CLI replaced with MCP server (`spec-board-mcp`) per clarification session 2026-01-06.

- [x] T001 Create MCP package structure at packages/spec-board-mcp/ with package.json *(was: CLI at packages/specboard-cli/)*
- [x] T002 [P] Install web app dependencies: better-auth, diff-match-patch in package.json
- [x] T003 [P] Install MCP dependencies: @modelcontextprotocol/sdk, ky in packages/spec-board-mcp/package.json *(was: CLI deps)*
- [x] T004 [P] Configure TypeScript for MCP package in packages/spec-board-mcp/tsconfig.json
- [x] T005 Add sync-related types to src/types/index.ts (MemberRole, FileType, ConflictStatus, SyncEventType enums)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

### Database Schema

- [x] T006 Add User model to prisma/schema.prisma (id, email, name, passwordHash, avatarUrl, emailVerified, timestamps)
- [x] T007 [P] Add Session model to prisma/schema.prisma (id, userId, token, expiresAt, ipAddress, userAgent)
- [x] T008 [P] Add OAuthAccount model to prisma/schema.prisma (id, userId, provider, providerAccountId, tokens)
- [x] T009 Add CloudProject model to prisma/schema.prisma (id, name, slug, description, ownerId, isArchived, timestamps)
- [x] T010 [P] Add ProjectMember model to prisma/schema.prisma (id, projectId, userId, role, invitedBy, joinedAt, lastSyncAt)
- [x] T011 [P] Add ProjectLink model to prisma/schema.prisma (id, projectId, code, createdBy, role, usedBy, usedAt, expiresAt) *(implemented as ProjectLinkCode)*
- [x] T012 Add SyncedSpec model to prisma/schema.prisma (id, projectId, path, fileType, content, checksum, lastModifiedBy, isArchived)
- [x] T013 [P] Add SpecVersion model to prisma/schema.prisma (id, specId, version, content, checksum, modifiedBy)
- [x] T014 [P] Add ConflictRecord model to prisma/schema.prisma (id, specId, localContent, cloudContent, status, resolvedBy)
- [x] T015 [P] Add SyncEvent model to prisma/schema.prisma (id, projectId, userId, eventType, specPath, details)
- [x] T016 Run prisma migrate to create database tables

### Authentication Infrastructure

- [x] T017 Configure Better Auth in src/lib/auth/config.ts (email/password + Google + GitHub providers)
- [x] T018 [P] Create auth API route handler in src/app/api/auth/[...all]/route.ts
- [x] T019 [P] Create login form component in src/components/auth/login-form.tsx
- [x] T020 [P] Create OAuth buttons component in src/components/auth/oauth-buttons.tsx
- [x] T021 Create auth middleware for API routes in src/middleware.ts

### Core Utilities

- [x] T022 [P] Create checksum utility (SHA-256) in src/lib/sync/checksum.ts
- [x] T023 [P] Create diff utility using diff-match-patch in src/lib/sync/diff.ts
- [x] T024 Create permission checker utility in src/lib/auth/permissions.ts (VIEW, EDIT, ADMIN role checks) *(implemented in src/lib/auth/session.ts)*

**Note**: API token authentication implemented in src/lib/auth/api-token.ts and src/lib/auth/session.ts for MCP server auth flow.

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Connect Local Project to Cloud (Priority: P1) MVP

**Goal**: Users can connect a local spec-kit project to the cloud using a project link code and see their specs in the dashboard.

**Independent Test**: Connect a local project folder using MCP `push_spec` tool and verify specs appear in cloud dashboard within 30 seconds.

**Note**: CLI replaced with MCP server per clarification session 2026-01-06. Tasks updated to reflect MCP architecture.

### Web App - API Endpoints

- [x] T025 [US1] Create POST /api/cloud-projects endpoint in src/app/api/cloud-projects/route.ts (create cloud project)
- [x] T026 [US1] Create GET /api/cloud-projects endpoint in src/app/api/cloud-projects/route.ts (list user's projects)
- [x] T027 [US1] Create GET /api/cloud-projects/[id] endpoint in src/app/api/cloud-projects/[id]/route.ts (get project details)
- [x] T028 [US1] Create POST /api/cloud-projects/[id]/links endpoint in src/app/api/cloud-projects/[id]/links/route.ts (generate link code)
- [x] T029 [US1] Create POST /api/cloud-projects/connect endpoint in src/app/api/cloud-projects/connect/route.ts (redeem link code)

### Web App - Services

- [x] T030 [US1] Create CloudProjectService in src/lib/services/cloud-project.ts (create, get, list, delete projects)
- [x] T031 [US1] Create ProjectLinkService in src/lib/services/project-link.ts (generate code, validate, redeem)

### Web App - Dashboard UI

- [x] T032 [P] [US1] Create cloud projects list page in src/app/cloud/page.tsx *(path adjusted from dashboard)*
- [x] T033 [P] [US1] Create new cloud project form in src/components/cloud/new-project-form.tsx
- [x] T034 [US1] Create project link code generator UI in src/components/cloud/link-code-generator.tsx

### MCP Server - Core Infrastructure *(replaces CLI)*

- [x] T035 [US1] Create MCP server entry point in packages/spec-board-mcp/src/index.ts with MCP SDK setup
- [x] T036 [US1] Create API client in packages/spec-board-mcp/src/api/client.ts (HTTP client with auth)
- [ ] T037 [US1] *(Removed - MCP uses API token from env, no local config needed)*
- [ ] T038 [US1] *(Removed - MCP is stateless, no local database needed)*

### MCP Server - Tools *(replaces CLI commands)*

- [ ] T039 [US1] *(Removed - MCP uses API token auth, no connect command needed)*
- [ ] T040 [US1] *(Removed - MCP uses API token auth, no login command needed)*
- [x] T041 [US1] Implement push_spec tool in packages/spec-board-mcp/src/tools/push-spec.ts

**Checkpoint**: User Story 1 complete - users can connect local projects to cloud

---

## Phase 4: User Story 2 - Push and Pull Sync (Priority: P1) MVP

**Goal**: Users can push local changes to cloud and pull cloud changes to local via MCP tools.

**Independent Test**: Edit a local spec.md file, use MCP `push_spec` tool, verify change appears in cloud dashboard within 10 seconds.

**Note**: CLI replaced with MCP server per clarification session 2026-01-06. Tasks updated to reflect MCP architecture.

### Web App - Sync API Endpoints

- [x] T042 [US2] Create GET /api/sync/[projectId]/status endpoint in src/app/api/sync/[projectId]/status/route.ts
- [x] T043 [US2] Create POST /api/sync/[projectId]/push endpoint in src/app/api/sync/[projectId]/push/route.ts
- [x] T044 [US2] Create GET /api/sync/[projectId]/features endpoint in src/app/api/sync/[projectId]/features/route.ts (pull specs)

### Web App - Sync Services

- [x] T045 [US2] Create SyncService in src/lib/services/sync.ts (push, pull, status operations)
- [x] T046 [US2] Create SpecVersionService in src/lib/services/spec-version.ts (create version, get history, prune old versions)

### Web App - Sync UI Components

- [x] T047 [P] [US2] Create sync status indicator in src/components/sync/sync-status.tsx
- [x] T048 [P] [US2] Create push button component in src/components/sync/push-button.tsx
- [x] T049 [P] [US2] Create pull button component in src/components/sync/pull-button.tsx

### MCP Server - Push/Pull Tools *(replaces CLI commands)*

- [x] T050 [US2] Implement push_spec tool in packages/spec-board-mcp/src/tools/push-spec.ts
- [x] T051 [US2] Implement pull_spec tool in packages/spec-board-mcp/src/tools/pull-spec.ts
- [ ] T052 [US2] *(Removed - status shown via MCP tool responses)*
- [ ] T053 [US2] *(Removed - file scanning done in push_spec tool)*

**Checkpoint**: User Stories 1 AND 2 complete - full MVP sync functionality working

---

## Phase 5: User Story 3 - Multi-User Collaboration (Priority: P2)

**Goal**: Multiple team members can connect to the same cloud project and see each other's changes.

**Independent Test**: Two users connect to same project, User A pushes a change, User B sees it in cloud dashboard.

### Web App - Member Management API

- [x] T054 [US3] Create GET /api/cloud-projects/[id]/members endpoint in src/app/api/cloud-projects/[id]/members/route.ts
- [x] T055 [US3] Create PATCH /api/cloud-projects/[id]/members/[userId] endpoint in src/app/api/cloud-projects/[id]/members/[userId]/route.ts
- [x] T056 [US3] Create DELETE /api/cloud-projects/[id]/members/[userId] endpoint in src/app/api/cloud-projects/[id]/members/[userId]/route.ts

### Web App - Member Services

- [x] T057 [US3] Create ProjectMemberService in src/lib/services/project-member.ts (list, update role, remove)

### Web App - Team UI

- [x] T058 [P] [US3] Create team members list in src/components/cloud/team-members.tsx
- [x] T059 [P] [US3] Create member role selector in src/components/cloud/role-selector.tsx
- [x] T060 [US3] Create last modified by indicator in src/components/sync/last-modified.tsx

### Web App - Activity Tracking

- [x] T061 [US3] Create SyncEventService in src/lib/services/sync-event.ts (log events, get activity)
- [x] T062 [US3] Add activity feed to project dashboard in src/components/cloud/activity-feed.tsx

**Checkpoint**: User Story 3 complete - multi-user collaboration working

---

## Phase 6: User Story 4 - Conflict Detection and Resolution (Priority: P2)

**Goal**: System detects when two users edit the same file and provides resolution interface.

**Independent Test**: Two users edit same file offline, both reconnect and push, verify conflict resolution flow appears.

### Web App - Conflict API Endpoints

- [ ] T063 [US4] Create GET /api/sync/[slug]/conflicts endpoint in src/app/api/sync/[slug]/conflicts/route.ts
- [ ] T064 [US4] Create POST /api/sync/[slug]/conflicts/[conflictId]/resolve endpoint in src/app/api/sync/[slug]/conflicts/[conflictId]/resolve/route.ts

### Web App - Conflict Services

- [ ] T065 [US4] Create ConflictService in src/lib/services/conflict.ts (detect, list, resolve conflicts)
- [ ] T066 [US4] Integrate conflict detection into SyncService push operation in src/lib/services/sync.ts

### Web App - Conflict UI

- [ ] T067 [US4] Create conflict list component in src/components/sync/conflict-list.tsx
- [ ] T068 [US4] Create conflict resolver component in src/components/sync/conflict-resolver.tsx (side-by-side diff view)
- [ ] T069 [US4] Create conflict resolution options (keep local, keep cloud, manual merge) in src/components/sync/resolution-options.tsx

### CLI - Conflict Commands

- [ ] T070 [US4] Implement conflicts list command in packages/specboard-cli/src/commands/conflicts.ts
- [ ] T071 [US4] Implement conflict resolve command in packages/specboard-cli/src/commands/conflicts.ts (interactive resolution)

**Checkpoint**: User Story 4 complete - conflict detection and resolution working

---

## Phase 7: User Story 5 - Offline Support with Queued Changes (Priority: P3)

**Goal**: Users can work offline, changes are queued, and they're notified when connectivity is restored.

**Independent Test**: Disconnect internet, make local changes, reconnect, verify notification shows pending changes count.

### CLI - Offline Queue

- [ ] T072 [US5] Create offline queue manager in packages/specboard-cli/src/lib/queue.ts (add to queue, get pending, clear)
- [ ] T073 [US5] Create connectivity checker in packages/specboard-cli/src/lib/connectivity.ts (check online status)
- [ ] T074 [US5] Integrate offline queue into push command in packages/specboard-cli/src/commands/push.ts

### CLI - Status Enhancements

- [ ] T075 [US5] Add offline mode indicator to status command in packages/specboard-cli/src/commands/status.ts
- [ ] T076 [US5] Add pending changes count to status output in packages/specboard-cli/src/commands/status.ts

### Web App - Offline Indicators

- [ ] T077 [P] [US5] Add offline status to sync-status component in src/components/sync/sync-status.tsx
- [ ] T078 [P] [US5] Add pending changes badge to dashboard in src/components/sync/pending-badge.tsx

**Checkpoint**: User Story 5 complete - offline support working

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T079 [P] Add disconnect command in packages/specboard-cli/src/commands/disconnect.ts
- [ ] T080 [P] Add logout command in packages/specboard-cli/src/commands/logout.ts
- [ ] T081 [P] Add version history API endpoint GET /api/sync/[slug]/specs/[path]/versions in src/app/api/sync/[slug]/specs/[...path]/versions/route.ts
- [ ] T082 Add input validation for all API endpoints using zod schemas
- [ ] T083 Add rate limiting middleware for sync endpoints in src/middleware.ts
- [ ] T084 Add error handling and logging across all services
- [ ] T085 Run quickstart.md validation (manual walkthrough of setup steps)
- [ ] T086 Security audit: verify path validation, SQL injection prevention, XSS protection

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 and US2 are both P1 and form the MVP
  - US3 and US4 are P2 and can proceed after MVP
  - US5 is P3 and can proceed after P2 stories
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational - Shares some infrastructure with US1 but independently testable
- **User Story 3 (P2)**: Can start after Foundational - Builds on US1/US2 member model but independently testable
- **User Story 4 (P2)**: Can start after Foundational - Requires sync infrastructure from US2 for conflict detection
- **User Story 5 (P3)**: Can start after Foundational - Enhances CLI from US1/US2 but independently testable

### Within Each User Story

- Models/Schema before services
- Services before API endpoints
- API endpoints before UI components
- Web app components can parallel with CLI commands
- Core implementation before integration

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational schema tasks marked [P] can run in parallel
- Auth components (T019, T020) can run in parallel
- Core utilities (T022, T023) can run in parallel
- Within each user story, tasks marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members after Foundational

---

## Parallel Example: Phase 2 Foundational

```bash
# Launch all schema models in parallel (after T006 User model):
Task: "Add Session model to prisma/schema.prisma"
Task: "Add OAuthAccount model to prisma/schema.prisma"

# After T009 CloudProject model, launch in parallel:
Task: "Add ProjectMember model to prisma/schema.prisma"
Task: "Add ProjectLink model to prisma/schema.prisma"

# After T012 SyncedSpec model, launch in parallel:
Task: "Add SpecVersion model to prisma/schema.prisma"
Task: "Add ConflictRecord model to prisma/schema.prisma"
Task: "Add SyncEvent model to prisma/schema.prisma"
```

## Parallel Example: User Story 1

```bash
# Launch web app UI components in parallel:
Task: "Create cloud projects list page in src/app/(dashboard)/cloud/page.tsx"
Task: "Create new cloud project form in src/components/cloud/new-project-form.tsx"

# Launch CLI infrastructure in parallel with web app:
Task: "Create API client in packages/specboard-cli/src/lib/api-client.ts"
Task: "Create local config manager in packages/specboard-cli/src/lib/config.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Connect)
4. Complete Phase 4: User Story 2 (Push/Pull)
5. **STOP and VALIDATE**: Test full sync workflow independently
6. Deploy/demo if ready - this is the MVP!

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 + 2 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 3 → Test multi-user → Deploy/Demo
4. Add User Story 4 → Test conflict resolution → Deploy/Demo
5. Add User Story 5 → Test offline support → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (web app)
   - Developer B: User Story 1 (CLI)
   - Developer C: User Story 2 (after US1 APIs ready)
3. Stories complete and integrate independently

---

## Summary

| Phase | Tasks | Parallel Tasks |
|-------|-------|----------------|
| Phase 1: Setup | 5 | 3 |
| Phase 2: Foundational | 19 | 12 |
| Phase 3: US1 Connect | 17 | 4 |
| Phase 4: US2 Push/Pull | 12 | 3 |
| Phase 5: US3 Multi-User | 9 | 2 |
| Phase 6: US4 Conflicts | 9 | 0 |
| Phase 7: US5 Offline | 7 | 2 |
| Phase 8: Polish | 8 | 3 |
| **Total** | **86** | **29** |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- MVP = User Stories 1 + 2 (Connect + Push/Pull Sync)
