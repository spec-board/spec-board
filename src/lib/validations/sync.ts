/**
 * Zod validation schemas for sync API endpoints (T082)
 */

import { z } from 'zod';

// ============================================
// Common Schemas
// ============================================

/** UUID validation */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/** Pagination query params */
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

/** Member role enum */
export const memberRoleSchema = z.enum(['VIEW', 'EDIT', 'ADMIN']);

/** File type enum */
export const fileTypeSchema = z.enum(['spec', 'plan', 'tasks']);

/** Conflict resolution status */
export const conflictStatusSchema = z.enum([
  'PENDING',
  'RESOLVED_LOCAL',
  'RESOLVED_CLOUD',
  'RESOLVED_MERGED',
]);

// ============================================
// Cloud Project Schemas
// ============================================

/** Create cloud project request */
export const createCloudProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be 100 characters or less')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
    .nullable(),
});

/** Update cloud project request */
export const updateCloudProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be 100 characters or less')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
    .nullable(),
});

// ============================================
// Sync Push Schemas
// ============================================

/** Single spec file in push request */
export const specFileSchema = z.object({
  type: fileTypeSchema,
  content: z.string().max(500000, 'File content exceeds maximum size (500KB)'),
  lastModified: z.string().datetime().optional(),
});

/** Single feature spec in push request */
export const cloudSpecSchema = z.object({
  featureId: z
    .string()
    .min(1, 'Feature ID is required')
    .max(100, 'Feature ID must be 100 characters or less')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Feature ID must be alphanumeric with dashes/underscores'),
  featureName: z
    .string()
    .min(1, 'Feature name is required')
    .max(200, 'Feature name must be 200 characters or less'),
  files: z.array(specFileSchema).min(1, 'At least one file is required'),
});

/** Push specs request body */
export const pushSpecsSchema = z.object({
  specs: z
    .array(cloudSpecSchema)
    .min(1, 'At least one spec is required')
    .max(50, 'Maximum 50 specs per push'),
});

// ============================================
// Member Management Schemas
// ============================================

/** Update member role request */
export const updateMemberRoleSchema = z.object({
  role: memberRoleSchema,
});

// ============================================
// Conflict Resolution Schemas
// ============================================

/** Resolve conflict request */
export const resolveConflictSchema = z.object({
  resolution: z.enum(['LOCAL', 'CLOUD', 'MERGED']),
  mergedContent: z
    .string()
    .max(500000, 'Merged content exceeds maximum size (500KB)')
    .optional(),
}).refine(
  (data) => {
    // mergedContent is required only for MERGED resolution
    if (data.resolution === 'MERGED' && !data.mergedContent) {
      return false;
    }
    return true;
  },
  {
    message: 'Merged content is required when resolution is MERGED',
    path: ['mergedContent'],
  }
);

// ============================================
// Link Code Schemas
// ============================================

/** Generate link code request */
export const generateLinkCodeSchema = z.object({
  role: memberRoleSchema.default('EDIT'),
  expiresInHours: z.coerce.number().int().min(1).max(168).default(24), // 1 hour to 7 days
});

/** Connect with link code request */
export const connectWithLinkCodeSchema = z.object({
  code: z
    .string()
    .min(1, 'Link code is required')
    .transform((val) => val.toUpperCase().trim())
    .pipe(
      z.string()
        .length(6, 'Link code must be exactly 6 characters')
        .regex(/^[A-Z0-9]+$/, 'Link code must be alphanumeric')
    ),
});

// ============================================
// Type Exports
// ============================================

export type CreateCloudProjectInput = z.infer<typeof createCloudProjectSchema>;
export type UpdateCloudProjectInput = z.infer<typeof updateCloudProjectSchema>;
export type PushSpecsInput = z.infer<typeof pushSpecsSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type ResolveConflictInput = z.infer<typeof resolveConflictSchema>;
export type GenerateLinkCodeInput = z.infer<typeof generateLinkCodeSchema>;
export type ConnectWithLinkCodeInput = z.infer<typeof connectWithLinkCodeSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
