# Quickstart: Cloud Specification Sync

**Feature**: 011-cloud-spec-sync
**Date**: 2026-01-06

## Overview

This guide walks you through setting up cloud sync for your spec-kit project, enabling multi-user collaboration.

## Prerequisites

- Node.js 18+ installed
- A spec-kit project with specs in `specs/` directory
- Internet connection

## Setup Steps

### 1. Install the SpecBoard CLI

```bash
npm install -g @specboard/cli
```

Verify installation:
```bash
specboard --version
```

### 2. Create a SpecBoard Account

**Option A: Via Browser**
1. Visit https://specboard.app
2. Click "Sign Up"
3. Choose email/password or OAuth (Google/GitHub)

**Option B: Via CLI**
```bash
specboard login
# Opens browser for authentication
```

### 3. Create a Cloud Project

**Via Dashboard**:
1. Log in to https://specboard.app
2. Click "New Project"
3. Enter project name
4. Copy the generated link code

**Via CLI** (if already logged in):
```bash
specboard projects create "My Project"
# Outputs: Project created. Link code: ABC123
```

### 4. Connect Your Local Project

Navigate to your spec-kit project directory:

```bash
cd /path/to/my-project
specboard connect ABC123
```

Expected output:
```
✓ Connected to project "My Project" (my-project)
  Role: ADMIN
  Specs found: 5

Run 'specboard push' to upload your local specs.
```

### 5. Push Your Specs to Cloud

```bash
specboard push
```

Expected output:
```
Pushing to "My Project"...

  ↑ specs/001-feature/spec.md (new)
  ↑ specs/001-feature/plan.md (new)
  ↑ specs/002-another/spec.md (new)

✓ Pushed 3 files
```

### 6. View in Dashboard

1. Visit https://specboard.app
2. Click on your project
3. See your specs in the Kanban board

## Inviting Team Members

### Generate a Link Code

**Via Dashboard**:
1. Open your project
2. Click "Settings" → "Team"
3. Click "Generate Link Code"
4. Choose role (View or Edit)
5. Share the code with your teammate

**Via CLI**:
```bash
specboard links create --role edit
# Outputs: Link code: XYZ789 (expires in 24h)
```

### Team Member Joins

Your teammate runs:
```bash
cd /path/to/their-local-copy
specboard connect XYZ789
```

## Daily Workflow

### Check Status

```bash
specboard status
```

Shows:
- Local changes not yet pushed
- Cloud changes not yet pulled
- Any pending conflicts

### Push Your Changes

After editing specs locally:
```bash
specboard push
```

### Pull Team Changes

To get changes from teammates:
```bash
specboard pull
```

### Resolve Conflicts

If two people edit the same file:

```bash
specboard conflicts
# Lists pending conflicts

specboard conflicts resolve 1
# Interactive resolution
```

## Offline Work

The CLI queues changes when offline:

1. Edit specs while offline
2. When back online, run `specboard status` to see queued changes
3. Run `specboard push` to sync

## Troubleshooting

### "Not connected to a project"

Run `specboard connect <code>` first, or check if `.specboard/` directory exists.

### "Permission denied"

Your role may be VIEW-only. Ask a project admin to upgrade your role.

### "Conflict detected"

Two people edited the same file. Run `specboard conflicts` to resolve.

### "Network error"

Check internet connection. The CLI will queue changes for later sync.

## File Structure

After connecting, the CLI creates:

```
my-project/
├── specs/
│   └── ... (your spec files)
└── .specboard/
    ├── config.json    # Connection settings
    └── sync.db        # Local sync state
```

## Next Steps

- Read the [API documentation](./contracts/api.md) for integration
- Read the [CLI reference](./contracts/cli.md) for all commands
- Set up CI/CD with `SPECBOARD_TOKEN` environment variable
