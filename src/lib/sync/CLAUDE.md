# Sync Utilities

## Purpose
Utilities for cloud sync conflict detection and resolution. Provides checksum generation for change detection and diff/merge algorithms for conflict resolution.

## Overview
This directory contains two core utilities for the cloud sync feature (Feature 011): `checksum.ts` for content hashing and conflict detection, and `diff.ts` for generating diffs, applying patches, and performing three-way merges.

## Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `checksum.ts` | SHA-256 checksum generation and verification | ~37 |
| `diff.ts` | Diff generation, patch application, 3-way merge | ~186 |

## Checksum Utilities (checksum.ts)

Uses SHA-256 for content hashing to detect changes and conflicts.

### Functions

| Function | Purpose | Returns |
|----------|---------|---------|
| `generateChecksum(content)` | Generate SHA-256 hash of content | Hex string (64 chars) |
| `verifyChecksum(content, expected)` | Verify content matches checksum | boolean |
| `contentsMatch(content1, content2)` | Compare two contents by checksum | boolean |

### Usage Examples

```typescript
import { generateChecksum, verifyChecksum, contentsMatch } from '@/lib/sync/checksum';

// Generate checksum for spec content
const checksum = generateChecksum(specContent);
// => "a3f5b8c2d1e4f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1"

// Verify content hasn't changed
const isValid = verifyChecksum(specContent, storedChecksum);
// => true if content matches

// Check if local and cloud versions are identical
const isSame = contentsMatch(localContent, cloudContent);
// => true if checksums match
```

### Use Cases

1. **Conflict Detection**: Compare checksums to detect if local and cloud versions differ
2. **Change Tracking**: Store checksums in database to track modifications
3. **Integrity Verification**: Verify downloaded content matches expected checksum

## Diff Utilities (diff.ts)

Uses `diff-match-patch` library for text diffing, patching, and merging.

### Functions

| Function | Purpose | Returns |
|----------|---------|---------|
| `generateDiff(oldText, newText)` | Generate diff between two texts | DiffResult |
| `applyPatch(text, patchText)` | Apply patch to text | { text, success } |
| `threeWayMerge(base, local, cloud)` | 3-way merge with conflict detection | { merged, hasConflicts } |
| `getDiffSummary(oldText, newText)` | Human-readable change summary | string |

### Types

```typescript
interface DiffResult {
  patches: string;        // Patch text (can be stored/transmitted)
  hunks: DiffHunk[];     // Display-friendly diff hunks
}

interface DiffHunk {
  oldStart: number;      // Starting line in old text
  oldLines: number;      // Number of lines in old text
  newStart: number;      // Starting line in new text
  newLines: number;      // Number of lines in new text
  lines: DiffLine[];     // Individual line changes
}

interface DiffLine {
  type: 'context' | 'add' | 'remove';
  content: string;
  oldLineNumber?: number;  // For context/remove lines
  newLineNumber?: number;  // For context/add lines
}
```

### Usage Examples

#### Generate Diff
```typescript
import { generateDiff } from '@/lib/sync/diff';

const oldSpec = "# Feature\n\nOld description";
const newSpec = "# Feature\n\nNew description\n\nAdded section";

const diff = generateDiff(oldSpec, newSpec);
// diff.patches: Patch text for storage
// diff.hunks: Array of hunks for UI display
```

#### Apply Patch
```typescript
import { applyPatch } from '@/lib/sync/diff';

const { text, success } = applyPatch(originalText, patchText);
if (success) {
  console.log('Patch applied successfully');
} else {
  console.log('Patch failed - conflicts detected');
}
```

#### Three-Way Merge
```typescript
import { threeWayMerge } from '@/lib/sync/diff';

// base: Common ancestor (last synced version)
// local: User's local changes
// cloud: Changes from cloud (other users)
const { merged, hasConflicts } = threeWayMerge(base, local, cloud);

if (!hasConflicts) {
  // Auto-merge successful
  await saveSpec(merged);
} else {
  // Show conflict resolution UI
  showConflictDialog(base, local, cloud, merged);
}
```

#### Get Summary
```typescript
import { getDiffSummary } from '@/lib/sync/diff';

const summary = getDiffSummary(oldText, newText);
// => "+5 lines, -2 lines"
// => "No changes"
```

## Conflict Resolution Flow

```
┌─────────────────────────────────────────────────────────┐
│ User pushes local changes to cloud                      │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│ Server compares checksums                               │
│ - Local checksum vs Cloud checksum                      │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌───────────────┐         ┌─────────────────┐
│ No Conflict   │         │ Conflict!       │
│ (same hash)   │         │ (diff hash)     │
└───────┬───────┘         └────────┬────────┘
        │                          │
        ▼                          ▼
┌───────────────┐         ┌─────────────────┐
│ Accept push   │         │ Try 3-way merge │
└───────────────┘         └────────┬────────┘
                                   │
                     ┌─────────────┴─────────────┐
                     │                           │
                     ▼                           ▼
              ┌──────────────┐         ┌────────────────┐
              │ Auto-merged  │         │ Manual resolve │
              │ (no conflict)│         │ (has conflict) │
              └──────────────┘         └────────────────┘
```

## Integration with Cloud Sync

### Push Operation (T020)
1. Read local spec files
2. Generate checksums for each file
3. Send to API: `POST /api/sync/{projectId}/push`
4. Server compares checksums with cloud version
5. If conflict detected, return conflict record

### Pull Operation (T021)
1. Fetch cloud specs: `GET /api/sync/{projectId}/features`
2. Compare checksums with local files
3. If different, download new content
4. Write to local filesystem

### Conflict Resolution (T023)
1. Detect conflict via checksum mismatch
2. Fetch base version (last synced)
3. Attempt three-way merge
4. If auto-merge fails, show conflict UI with diff hunks
5. User resolves manually
6. Push resolved version

## Patterns & Conventions

- **Checksums**: Always use SHA-256 (64-char hex strings)
- **Diff Format**: Store patches as text (can be transmitted/stored)
- **Line Endings**: Normalize to `\n` before diffing
- **Semantic Cleanup**: Use `diff_cleanupSemantic()` for readable diffs
- **Error Handling**: Check `success` flag on patch application

## Dependencies

- **crypto**: Node.js built-in for SHA-256 hashing
- **diff-match-patch**: Google's diff/patch/merge library
- **@/types**: TypeScript type definitions

## Common Tasks

- **Add checksum to sync**: Call `generateChecksum()` before upload
- **Verify download**: Call `verifyChecksum()` after download
- **Show diff in UI**: Use `generateDiff()` and render `hunks`
- **Auto-merge**: Use `threeWayMerge()` with base/local/cloud
- **Display summary**: Use `getDiffSummary()` for change counts

## Important Notes

- Checksums are deterministic (same content = same hash)
- Three-way merge requires common ancestor (base version)
- Patch application may fail if content has changed significantly
- Diff hunks are optimized for UI display (line-by-line)
- All functions are synchronous (no async operations)
