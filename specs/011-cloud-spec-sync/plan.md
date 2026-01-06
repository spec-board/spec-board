# Implementation Plan: Cloud Specification Sync

**Branch**: `011-cloud-spec-sync` | **Date**: 2026-01-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-cloud-spec-sync/spec.md`

## Summary

Enable SpecBoard to be deployed on the cloud with multi-user collaboration. Users connect local spec-kit projects to the cloud via a sync agent/CLI, manually push local changes to cloud storage, and pull cloud changes to their local environment. The system supports multiple users per project with View/Edit/Admin access levels, conflict detection and resolution, and offline change queuing.

**Key architectural change**: This feature extends the current filesystem-only model to include cloud storage as a secondary source of truth, while maintaining the spec-driven philosophy where local files remain the primary editing interface.

## Technical Context

**Language/Version**: TypeScript 5.9.x (strict mode)
**Primary Dependencies**: Next.js 16.x (App Router), React 19.x, Prisma 5.22.x, Zustand 5.x, Better Auth (for OAuth)
**Storage**: PostgreSQL (existing) + cloud file storage for spec content
**Testing**: Vitest (existing), Playwright for E2E
**Target Platform**: Cloud deployment (Vercel/Netlify) + Local sync agent (Node.js CLI)
**Project Type**: Web application with companion CLI tool
**Performance Goals**: Push/pull operations complete within 10 seconds, 10 concurrent users per project
**Constraints**: Manual sync (no auto-sync), 30 version history per file, <100MB per project
**Scale/Scope**: Initial target: 100 projects, 1000 users

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Visualization | ⚠️ REQUIRES JUSTIFICATION | Constitution states "Database stores project metadata only; spec content is always read from filesystem". Cloud sync stores spec content in cloud. **Justification**: Cloud becomes secondary source; local filesystem remains primary editing interface. Cloud storage enables collaboration without changing the spec-driven workflow. |
| II. Type Safety | ✅ PASS | All new code will use TypeScript strict mode, explicit types, interfaces for entities |
| III. Security First | ✅ PASS | OAuth + email auth, access levels (View/Edit/Admin), path validation, input sanitization |
| IV. Accessibility | ✅ PASS | Sync status indicators will have ARIA labels, keyboard navigation for conflict resolution |
| V. Clean URL Architecture | ✅ PASS | Cloud projects use existing slug system, no filesystem paths exposed |
| VI. Component Simplicity | ✅ PASS | New components follow single responsibility (SyncStatus, ConflictResolver, etc.) |
| VII. Visual Identity | ✅ PASS | Sync UI follows minimal design: text-based status, neutral colors, no decorative elements |

## Project Structure

### Documentation (this feature)

```text
specs/011-cloud-spec-sync/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── api/
│   │   ├── auth/              # Authentication endpoints (Better Auth)
│   │   ├── sync/              # Sync API endpoints
│   │   │   ├── push/          # POST - upload local changes
│   │   │   ├── pull/          # GET - download cloud changes
│   │   │   ├── status/        # GET - sync status
│   │   │   └── conflicts/     # GET/POST - conflict management
│   │   ├── projects/
│   │   │   ├── [slug]/
│   │   │   │   ├── members/   # Team member management
│   │   │   │   └── link/      # Project link code generation
│   │   │   └── cloud/         # Cloud project operations
│   │   └── users/             # User management
│   └── (dashboard)/           # Existing dashboard routes
├── components/
│   ├── sync/
│   │   ├── sync-status.tsx    # Sync status indicator
│   │   ├── push-button.tsx    # Push to cloud button
│   │   ├── pull-button.tsx    # Pull from cloud button
│   │   └── conflict-resolver.tsx  # Conflict resolution UI
│   └── auth/
│       ├── login-form.tsx     # Email/password login
│       └── oauth-buttons.tsx  # Google/GitHub OAuth
├── lib/
│   ├── auth/                  # Authentication utilities
│   ├── sync/                  # Sync logic
│   │   ├── diff.ts            # File diff utilities
│   │   ├── conflict.ts        # Conflict detection
│   │   └── version.ts         # Version management
│   └── cloud-storage/         # Cloud storage abstraction
└── types/
    └── index.ts               # Extended with sync types

# Companion CLI (separate package or monorepo)
packages/
└── specboard-cli/
    ├── src/
    │   ├── commands/
    │   │   ├── connect.ts     # Connect local project to cloud
    │   │   ├── push.ts        # Push local changes
    │   │   ├── pull.ts        # Pull cloud changes
    │   │   └── status.ts      # Show sync status
    │   ├── lib/
    │   │   ├── watcher.ts     # File system watcher
    │   │   ├── queue.ts       # Offline change queue
    │   │   └── api-client.ts  # Cloud API client
    │   └── index.ts
    └── package.json
```

**Structure Decision**: Web application with companion CLI. The CLI handles local filesystem operations (watching, reading, writing) while the web app provides the cloud dashboard and API. This separation respects browser security constraints (no direct filesystem access) while enabling the push/pull workflow.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Cloud stores spec content (Principle I) | Multi-user collaboration requires shared storage | Filesystem-only approach cannot support remote collaboration |
| Companion CLI package | Browser cannot access local filesystem | Web-only approach would require manual file upload/download |
| Version history (30 versions) | Conflict resolution and recovery | No history would lose user work on conflicts |
