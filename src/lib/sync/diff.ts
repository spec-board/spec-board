/**
 * Diff utility for sync conflict resolution (T023)
 * Uses diff-match-patch for text diffing and patching
 */

import DiffMatchPatch from 'diff-match-patch';
import type { DiffResult, DiffHunk, DiffLine } from '@/types';

const dmp = new DiffMatchPatch();

/**
 * Generate a diff between two text contents
 * @param oldText - Original text
 * @param newText - Modified text
 * @returns Diff result with patches and hunks for display
 */
export function generateDiff(oldText: string, newText: string): DiffResult {
  // Generate diffs
  const diffs = dmp.diff_main(oldText, newText);
  dmp.diff_cleanupSemantic(diffs);

  // Generate patches
  const patches = dmp.patch_make(oldText, diffs);
  const patchText = dmp.patch_toText(patches);

  // Convert to hunks for display
  const hunks = convertToHunks(oldText, newText, diffs);

  return {
    patches: patchText,
    hunks,
  };
}

/**
 * Apply a patch to text content
 * @param text - Original text
 * @param patchText - Patch text from generateDiff
 * @returns Patched text and success status
 */
export function applyPatch(text: string, patchText: string): { text: string; success: boolean } {
  const patches = dmp.patch_fromText(patchText);
  const [patchedText, results] = dmp.patch_apply(patches, text);

  // Check if all patches applied successfully
  const success = results.every(result => result);

  return { text: patchedText, success };
}

/**
 * Merge two versions of text using three-way merge
 * @param base - Common ancestor text
 * @param local - Local version
 * @param cloud - Cloud version
 * @returns Merged text or null if conflict cannot be auto-resolved
 */
export function threeWayMerge(
  base: string,
  local: string,
  cloud: string
): { merged: string; hasConflicts: boolean } {
  // Generate patches from base to each version
  const localPatches = dmp.patch_make(base, local);
  const cloudPatches = dmp.patch_make(base, cloud);

  // Try to apply local patches first
  const [afterLocal] = dmp.patch_apply(localPatches, base);

  // Then try to apply cloud patches
  const [merged, results] = dmp.patch_apply(cloudPatches, afterLocal);

  // Check if all patches applied cleanly
  const hasConflicts = !results.every(result => result);

  return { merged, hasConflicts };
}

/**
 * Convert diff-match-patch diffs to display-friendly hunks
 */
function convertToHunks(
  oldText: string,
  newText: string,
  diffs: [number, string][]
): DiffHunk[] {
  const hunks: DiffHunk[] = [];
  const lines: DiffLine[] = [];

  let oldLineNum = 1;
  let newLineNum = 1;

  for (const [operation, text] of diffs) {
    const textLines = text.split('\n');

    for (let i = 0; i < textLines.length; i++) {
      const content = textLines[i];
      const isLastLine = i === textLines.length - 1 && !text.endsWith('\n');

      if (operation === 0) {
        // Context (unchanged)
        lines.push({
          type: 'context',
          content,
          oldLineNumber: oldLineNum,
          newLineNumber: newLineNum,
        });
        if (!isLastLine || text.endsWith('\n')) {
          oldLineNum++;
          newLineNum++;
        }
      } else if (operation === -1) {
        // Deletion
        lines.push({
          type: 'remove',
          content,
          oldLineNumber: oldLineNum,
        });
        if (!isLastLine || text.endsWith('\n')) {
          oldLineNum++;
        }
      } else if (operation === 1) {
        // Addition
        lines.push({
          type: 'add',
          content,
          newLineNumber: newLineNum,
        });
        if (!isLastLine || text.endsWith('\n')) {
          newLineNum++;
        }
      }
    }
  }

  // Group lines into hunks (simplified: one hunk for now)
  if (lines.length > 0) {
    hunks.push({
      oldStart: 1,
      oldLines: oldText.split('\n').length,
      newStart: 1,
      newLines: newText.split('\n').length,
      lines,
    });
  }

  return hunks;
}

/**
 * Get a human-readable summary of changes
 * @param oldText - Original text
 * @param newText - Modified text
 * @returns Summary string
 */
export function getDiffSummary(oldText: string, newText: string): string {
  const diffs = dmp.diff_main(oldText, newText);
  dmp.diff_cleanupSemantic(diffs);

  let additions = 0;
  let deletions = 0;

  for (const [operation, text] of diffs) {
    const lineCount = text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
    if (operation === 1) {
      additions += lineCount || 1;
    } else if (operation === -1) {
      deletions += lineCount || 1;
    }
  }

  if (additions === 0 && deletions === 0) {
    return 'No changes';
  }

  const parts: string[] = [];
  if (additions > 0) {
    parts.push(`+${additions} line${additions === 1 ? '' : 's'}`);
  }
  if (deletions > 0) {
    parts.push(`-${deletions} line${deletions === 1 ? '' : 's'}`);
  }

  return parts.join(', ');
}
