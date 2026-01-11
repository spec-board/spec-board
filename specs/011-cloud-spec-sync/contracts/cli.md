# CLI Contract: SpecBoard CLI

**Feature**: 011-cloud-spec-sync
**Date**: 2026-01-06
**Version**: 1.0.0

## Installation

```bash
npm install -g @specboard/cli
# or
pnpm add -g @specboard/cli
```

## Commands

### specboard connect

Connect a local spec-kit project to a cloud project.

**Usage**:
```bash
specboard connect <code>
```

**Arguments**:
- `code`: 6-character project link code (e.g., ABC123)

**Options**:
- `--dir <path>`: Project directory (default: current directory)

**Example**:
```bash
cd my-project
specboard connect ABC123
```

**Output**:
```
✓ Connected to project "My Project" (my-project)
  Role: EDIT
  Specs found: 5

Run 'specboard push' to upload your local specs.
```

**Exit Codes**:
- 0: Success
- 1: Invalid or expired code
- 2: Already connected to a project
- 3: Network error

---

### specboard disconnect

Disconnect from the cloud project.

**Usage**:
```bash
specboard disconnect
```

**Options**:
- `--force`: Skip confirmation prompt

**Output**:
```
? Disconnect from "My Project"? (y/N) y
✓ Disconnected from cloud project
  Local files unchanged
```

---

### specboard status

Show sync status for the connected project.

**Usage**:
```bash
specboard status
```

**Options**:
- `--json`: Output as JSON

**Output**:
```
Project: My Project (my-project)
Role: EDIT
Last sync: 2026-01-05 10:00:00

Local changes (not pushed):
  M specs/001-feature/spec.md
  A specs/003-new/spec.md

Cloud changes (not pulled):
  M specs/002-other/plan.md

Conflicts: 0
```

**JSON Output**:
```json
{
  "project": {
    "name": "My Project",
    "slug": "my-project"
  },
  "role": "EDIT",
  "lastSyncAt": "2026-01-05T10:00:00Z",
  "localChanges": [
    {"path": "specs/001-feature/spec.md", "status": "modified"},
    {"path": "specs/003-new/spec.md", "status": "added"}
  ],
  "cloudChanges": [
    {"path": "specs/002-other/plan.md", "status": "modified"}
  ],
  "conflicts": []
}
```

---

### specboard push

Push local changes to the cloud.

**Usage**:
```bash
specboard push
```

**Options**:
- `--dry-run`: Show what would be pushed without pushing
- `--force`: Push even if there are conflicts (creates new conflicts)

**Output**:
```
Pushing to "My Project"...

  ↑ specs/001-feature/spec.md (modified)
  ↑ specs/003-new/spec.md (new)

✓ Pushed 2 files
```

**With Conflicts**:
```
Pushing to "My Project"...

  ↑ specs/001-feature/spec.md (modified)
  ⚠ specs/002-conflict/spec.md (conflict detected)

✓ Pushed 1 file
✗ 1 conflict detected

Run 'specboard conflicts' to view and resolve conflicts.
```

**Exit Codes**:
- 0: Success (all files pushed)
- 1: Partial success (some conflicts)
- 2: Permission denied (VIEW role)
- 3: Network error

---

### specboard pull

Pull cloud changes to local.

**Usage**:
```bash
specboard pull
```

**Options**:
- `--dry-run`: Show what would be pulled without pulling
- `--force`: Overwrite local changes (dangerous)

**Output**:
```
Pulling from "My Project"...

  ↓ specs/002-other/plan.md (modified)
  ↓ specs/004-new/spec.md (new)

✓ Pulled 2 files
```

**With Local Changes**:
```
Pulling from "My Project"...

⚠ You have local changes that would be overwritten:
  specs/002-other/plan.md

Push your changes first, or use --force to overwrite.
```

---

### specboard conflicts

List and resolve conflicts.

**Usage**:
```bash
specboard conflicts [action]
```

**Actions**:
- (none): List pending conflicts
- `resolve <id>`: Resolve a specific conflict

**List Output**:
```
Pending conflicts:

  #1 specs/002-conflict/spec.md
     Local: Modified by you at 2026-01-05 09:00
     Cloud: Modified by Jane at 2026-01-05 10:00

Run 'specboard conflicts resolve 1' to resolve.
```

**Resolve Interactive**:
```bash
specboard conflicts resolve 1
```

```
Conflict: specs/002-conflict/spec.md

Choose resolution:
  [L] Keep local version
  [C] Keep cloud version
  [M] Manual merge (opens editor)
  [D] Show diff

> L

✓ Resolved conflict - kept local version
  Pushing resolution to cloud...
✓ Done
```

---

### specboard login

Authenticate with SpecBoard cloud (alternative to connect).

**Usage**:
```bash
specboard login
```

**Options**:
- `--token <token>`: Use API token instead of browser auth

**Output**:
```
Opening browser for authentication...

✓ Logged in as john@example.com
```

---

### specboard logout

Log out from SpecBoard cloud.

**Usage**:
```bash
specboard logout
```

---

## Configuration

### Local Config File

Location: `<project>/.specboard/config.json`

```json
{
  "projectId": "uuid",
  "projectSlug": "my-project",
  "apiUrl": "https://specboard.app/api"
}
```

### Global Config File

Location: `~/.specboard/config.json`

```json
{
  "apiUrl": "https://specboard.app/api",
  "sessionToken": "encrypted_token"
}
```

### Local Database

Location: `<project>/.specboard/sync.db` (SQLite)

Tables:
- `sync_state`: Last known state of each file
- `offline_queue`: Changes queued while offline
- `conflicts`: Local conflict records

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SPECBOARD_API_URL` | API base URL | https://specboard.app/api |
| `SPECBOARD_TOKEN` | API token (for CI/CD) | - |
| `SPECBOARD_DEBUG` | Enable debug logging | false |

---

## Exit Codes Summary

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Partial success / conflicts |
| 2 | Permission denied |
| 3 | Network error |
| 4 | Not connected to project |
| 5 | Invalid arguments |
| 6 | File system error |
