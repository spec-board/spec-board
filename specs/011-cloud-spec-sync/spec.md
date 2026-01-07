# Feature Specification: Cloud Specification Sync

**Feature Branch**: `011-cloud-spec-sync`
**Created**: 2026-01-05
**Status**: Draft
**Input**: User description: "syncing logic, the dashboard will be deployed on cloud, so it need to store and sync specifications with many user in local."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Connect Local Project to Cloud (Priority: P1)

A user with a local spec-kit project wants to connect it to the cloud-hosted SpecBoard so they can view their specifications from anywhere and collaborate with team members.

**Why this priority**: This is the foundational capability that enables all other sync features. Without the ability to connect and upload specs to the cloud, no other sync functionality is possible.

**Independent Test**: Can be fully tested by connecting a local project folder and verifying the specs appear in the cloud dashboard within 30 seconds.

**Acceptance Scenarios**:

1. **Given** a user has a local spec-kit project with specs, **When** they connect it to SpecBoard cloud using a project link code, **Then** all existing specs are uploaded to the cloud and visible in the dashboard.

2. **Given** a user is connecting a project, **When** the connection is established, **Then** the system displays a confirmation with the number of specs synced.

3. **Given** a user has no internet connection, **When** they attempt to connect, **Then** the system displays a clear error message and allows retry when connection is restored.

---

### User Story 2 - Push and Pull Sync (Priority: P1)

A user edits spec files locally (in their IDE or text editor), then pushes changes to the cloud when ready. Team members can pull the latest changes from the cloud to their local environment.

**Why this priority**: This is the core value proposition - keeping cloud and local in sync via explicit user actions. Manual sync gives users control over when changes are shared.

**Independent Test**: Can be tested by editing a local spec.md file, clicking "Push to Cloud", and verifying the change appears in the cloud dashboard.

**Acceptance Scenarios**:

1. **Given** a connected project with local changes, **When** a user clicks "Push to Cloud", **Then** all local changes are uploaded and visible in the cloud dashboard.

2. **Given** a connected project with cloud changes from another user, **When** a user clicks "Pull from Cloud", **Then** the latest cloud version is downloaded to their local environment.

3. **Given** a connected project, **When** a user creates a new spec folder with spec.md and pushes, **Then** the new feature appears in the cloud Kanban board.

---

### User Story 3 - Multi-User Collaboration (Priority: P2)

Multiple team members can connect to the same cloud project and see each other's changes. Each user works on their own local copy, and changes from all users are visible in the shared cloud dashboard.

**Why this priority**: Collaboration is the key differentiator for cloud deployment. However, it builds on the single-user sync capability (P1 stories).

**Independent Test**: Can be tested by having two users connect to the same project, one makes a change, and the other sees it reflected in the cloud dashboard.

**Acceptance Scenarios**:

1. **Given** two users connected to the same cloud project, **When** User A updates a spec locally, **Then** User B sees the update in the cloud dashboard.

2. **Given** multiple users connected, **When** viewing the dashboard, **Then** each user can see who last modified each spec and when.

3. **Given** a team project, **When** a new team member joins, **Then** they can connect their local environment and see all existing specs.

---

### User Story 4 - Conflict Detection and Resolution (Priority: P2)

When two users edit the same spec file simultaneously, the system detects the conflict and helps users resolve it without losing anyone's work.

**Why this priority**: Conflicts are inevitable in multi-user scenarios. Handling them gracefully is essential for team adoption, but the basic sync must work first.

**Independent Test**: Can be tested by having two users edit the same file offline, then reconnecting and verifying the conflict resolution flow appears.

**Acceptance Scenarios**:

1. **Given** two users edit the same spec file, **When** both changes are synced, **Then** the system detects the conflict and notifies both users.

2. **Given** a conflict is detected, **When** a user views the conflict, **Then** they see both versions side-by-side with differences highlighted.

3. **Given** a conflict resolution screen, **When** a user chooses to keep one version or merge manually, **Then** the resolution is applied and synced to all users.

---

### User Story 5 - Offline Support with Queued Changes (Priority: P3)

Users can continue working on specs while offline. Changes are queued locally and users are notified when connectivity is restored so they can manually push.

**Why this priority**: Offline support improves user experience but is not essential for initial launch. Users can work online-only initially.

**Independent Test**: Can be tested by disconnecting internet, making local changes, reconnecting, and verifying the notification appears with pending changes count.

**Acceptance Scenarios**:

1. **Given** a user loses internet connection, **When** they continue editing specs locally, **Then** changes are queued for sync.

2. **Given** queued changes exist, **When** internet connection is restored, **Then** the user is notified of pending changes count and can manually push.

3. **Given** a user is offline, **When** they view the sync status, **Then** they see a clear indicator of offline mode and pending changes count.

---

### Edge Cases

- What happens when a user's local spec folder is moved or renamed?
- How does the system handle very large spec files (>1MB)?
- What happens when a user revokes access to a shared project?
- How does the system handle simultaneous edits to the same line by multiple users?
- What happens when the cloud service is temporarily unavailable?
- How does the system handle specs with special characters or unicode in filenames?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to connect a local spec-kit project folder to a cloud project using a unique project link code.
- **FR-002**: System MUST upload all existing spec files (spec.md, plan.md, tasks.md) from a connected local project to the cloud.
- **FR-003**: System MUST provide a "Push to Cloud" button that uploads local changes to the cloud.
- **FR-003a**: System MUST provide a "Pull from Cloud" button that downloads cloud changes to local.
- **FR-004**: System MUST support multiple users connecting to the same cloud project simultaneously.
- **FR-005**: System MUST track and display the last modifier and modification time for each spec.
- **FR-006**: System MUST detect when two users have edited the same file and flag it as a conflict.
- **FR-007**: System MUST provide a conflict resolution interface showing both versions with differences highlighted.
- **FR-008**: System MUST queue local changes when offline and notify user when connectivity is restored with pending changes count.
- **FR-009**: System MUST display clear sync status indicators (synced, syncing, offline, conflict).
- **FR-010**: System MUST preserve the folder structure of spec-kit projects (specs/feature-name/spec.md pattern).
- **FR-011**: System MUST handle file deletions by archiving (not permanently deleting) specs in the cloud.
- **FR-012**: System MUST validate that uploaded content matches expected spec-kit file formats.
- **FR-013**: System MUST provide three access levels for team members: View (read-only access to specs), Edit (can modify specs), and Admin (can invite/remove members and manage project settings).
- **FR-014**: System MUST support user authentication via email/password accounts and OAuth providers (Google, GitHub).

### Key Entities

- **CloudProject**: Represents a spec-kit project stored in the cloud. Contains project metadata, owner information, and references to all synced specs.

- **SyncedSpec**: A specification file (spec.md, plan.md, or tasks.md) stored in the cloud. Includes content, version history (last 30 versions retained), last modifier, and sync timestamps.

- **ProjectMember**: A user who has access to a cloud project. Includes their role, connection status, and last sync time.

- **SyncEvent**: A record of a sync operation (upload, download, conflict). Used for audit trail and conflict detection.

- **ConflictRecord**: When two versions of a spec conflict, this stores both versions and resolution status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can connect a local project and see all specs in the cloud dashboard within 30 seconds.
- **SC-002**: Push operation completes and changes appear in cloud dashboard within 10 seconds.
- **SC-003**: System supports at least 10 concurrent users per project without performance degradation.
- **SC-004**: 95% of sync operations complete successfully on first attempt.
- **SC-005**: Users can resolve conflicts within 2 minutes using the provided interface.
- **SC-006**: User is notified of pending changes within 5 seconds of connectivity restoration.
- **SC-007**: Users report the sync status is always accurate and easy to understand (target: 90% satisfaction in usability testing).

## Clarifications

### Session 2026-01-05

- Q: What is the sync direction model? → A: Manual bidirectional - local-to-cloud via push button, cloud-to-local via pull button.
- Q: How do users authenticate to the cloud service? → A: Both email/password accounts AND OAuth providers (Google, GitHub).
- Q: How many versions to retain per file? → A: Keep last 30 versions per file (balanced storage and recovery).
- Q: How does offline behavior work with manual sync? → A: Fully manual - queue changes offline, notify user when online, user manually pushes.

### Session 2026-01-06

- Q: How do users sync local files with cloud (local agent architecture)? → A: Via MCP server (`spec-board-mcp`) that works with all AI coding assistants (Claude Code, GitHub Copilot, Cursor, Gemini CLI, Codex CLI, Windsurf, Kilo Code, Amp).
- Q: What sync tools does the MCP server provide? → A: Two tools - `pull_spec` (download newest specs from cloud) and `push_spec` (upload local specs to cloud).
- Q: How do users authenticate the MCP server? → A: Users login to spec-board web dashboard to generate an API token, then configure the MCP server with that token.

## Assumptions

- Users configure the `spec-board-mcp` MCP server in their AI coding assistant (Claude Code, GitHub Copilot, Cursor, Gemini CLI, Codex CLI, Windsurf, Kilo Code, Amp). The MCP server provides `pull_spec` and `push_spec` tools for sync operations.
- Authentication uses API tokens generated from the spec-board web dashboard. Users must have a spec-board account and be logged in to generate tokens.
- The MCP server runs locally and has filesystem access to read/write spec files. It communicates with the spec-board cloud API over HTTPS.
- The spec-kit folder structure follows the standard pattern: `specs/{feature-name}/{spec.md|plan.md|tasks.md}`.
- Users have reliable internet connectivity for initial setup (offline mode is for temporary disconnections, not primary use case).
- Project link codes are single-use and expire after 24 hours for security.
- The cloud storage has sufficient capacity for typical spec-kit projects (estimated <100MB per project).
