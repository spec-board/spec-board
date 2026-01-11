/**
 * Checksum utility for sync conflict detection (T022)
 * Uses SHA-256 for content hashing
 */

import { createHash } from 'crypto';

/**
 * Generate SHA-256 checksum for content
 * @param content - String content to hash
 * @returns Hex-encoded SHA-256 hash
 */
export function generateChecksum(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Verify content matches expected checksum
 * @param content - Content to verify
 * @param expectedChecksum - Expected SHA-256 hash
 * @returns True if checksums match
 */
export function verifyChecksum(content: string, expectedChecksum: string): boolean {
  const actualChecksum = generateChecksum(content);
  return actualChecksum === expectedChecksum;
}

/**
 * Check if two contents are identical by comparing checksums
 * @param content1 - First content
 * @param content2 - Second content
 * @returns True if contents are identical
 */
export function contentsMatch(content1: string, content2: string): boolean {
  return generateChecksum(content1) === generateChecksum(content2);
}
