# Sync Components Directory

## Purpose
React components for cloud sync operations including push/pull buttons, conflict resolution, and sync status indicators.

## Overview
This directory contains UI components for managing cloud sync operations. Components handle pushing local changes to cloud, pulling cloud changes to local, resolving merge conflicts with 3-way diff viewer, and displaying sync status with pending changes indicators.

## Key Files

| File | Purpose |
|------|---------|
| `sync-status.tsx` | Sync status indicator with last sync time |
| `push-button.tsx` | Button to push local changes to cloud |
| `pull-button.tsx` | Button to pull cloud changes to local |
| `conflict-list.tsx` | List of pending conflicts |
| `conflict-resolver.tsx` | 3-way merge conflict resolution UI |
| `resolution-options.tsx` | Conflict resolution strategy selector |
| `pending-badge.tsx` | Badge showing pending changes count |
| `last-modified.tsx` | Display last modified timestamp |

## Patterns & Conventions

- **Client Components**: All components use `'use client'` directive
- **Real-Time Updates**: Poll for sync status changes
- **Optimistic Updates**: UI updates immediately, reverts on error
- **Loading States**: Show spinners during sync operations
- **Error Handling**: Display error messages with retry options
- **Diff Visualization**: Color-coded additions/deletions
- **Tailwind Styling**: Use `cn()` utility for conditional classes

## Dependencies

- **Internal**: `@/lib/utils`, `@/lib/sync`, `@/types`, API routes
- **External**: `react`, `lucide-react`, `diff-match-patch`, `clsx`

## Common Tasks

### Add New Sync Status Indicator

1. Update `sync-status.tsx` to add new status type
2. Add icon and color for new status
3. Update status polling logic
4. Add tooltip with status details

### Customize Conflict Resolution UI

1. Edit `conflict-resolver.tsx` to modify diff display
2. Update `resolution-options.tsx` for new resolution strategies
3. Add custom merge logic if needed
4. Update conflict resolution API calls

### Add Sync Operation

1. Create new button component (similar to `push-button.tsx`)
2. Add API endpoint for operation
3. Update sync status after operation
4. Add loading and error states

## Component Details

### sync-status.tsx
- Displays current sync status
- Shows last push/pull timestamps
- Indicates pending changes count
- Shows conflict count if any
- Color-coded status indicators
- Polls `/api/sync/:projectId/status`

### push-button.tsx
- Button to push local changes
- Shows pending changes count
- Disabled if no changes
- Loading state during push
- Success/error notifications
- Calls `/api/sync/:projectId/push`

### pull-button.tsx
- Button to pull cloud changes
- Shows available updates count
- Disabled if up-to-date
- Loading state during pull
- Conflict detection
- Calls `/api/sync/:projectId/pull`

### conflict-list.tsx
- Lists all pending conflicts
- Shows feature and file type
- Displays conflict creation time
- Click to open resolver
- Filters by status (pending/resolved)
- Uses `/api/sync/:projectId/conflicts`

### conflict-resolver.tsx
- 3-way merge diff viewer
- Shows local, cloud, and base versions
- Color-coded additions (green) and deletions (red)
- Line-by-line comparison
- Resolution strategy selector
- Manual merge editor
- Calls `/api/sync/:projectId/conflicts/:id/resolve`

### resolution-options.tsx
- Radio buttons for resolution strategies
- Three options: Keep Local, Keep Cloud, Manual Merge
- Shows strategy descriptions
- Disables manual merge if not applicable
- Updates parent component on selection

### pending-badge.tsx
- Badge showing pending changes count
- Color-coded by severity (yellow/red)
- Tooltip with change details
- Animated pulse for new changes
- Hides when count is zero

### last-modified.tsx
- Displays last modified timestamp
- Relative time (e.g., "2 hours ago")
- Tooltip with absolute timestamp
- Updates every minute
- Shows "Never" if no timestamp

## Conflict Resolution Flow

1. User clicks "Pull" button
2. System detects conflicts
3. Conflict list displays pending conflicts
4. User clicks conflict to open resolver
5. Resolver shows 3-way diff (local, cloud, base)
6. User selects resolution strategy:
   - **Keep Local**: Use local version
   - **Keep Cloud**: Use cloud version
   - **Manual Merge**: Edit merged content
7. User confirms resolution
8. System applies resolution and updates cloud
9. Conflict marked as resolved

## Important Notes

- **Conflict Detection**: Uses SHA-256 checksums to detect conflicts
- **3-Way Merge**: Shows base version for context
- **Manual Merge**: Allows custom resolution with editor
- **Atomic Operations**: Push/pull operations are atomic
- **Rollback Support**: Can revert to previous versions
- **Real-Time Polling**: Status updates every 30 seconds
- **Optimistic Updates**: UI updates before server confirmation
- **Error Recovery**: Components revert state on errors
- **Accessibility**: Keyboard navigation and screen reader support
