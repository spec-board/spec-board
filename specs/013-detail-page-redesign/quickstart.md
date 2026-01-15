# Quickstart: Detail Page Redesign

**Feature**: 013-detail-page-redesign
**Date**: 2026-01-14

## Overview

This feature redesigns the feature detail page navigation to match the Kanban board's visual design language. The main changes are:

1. **Status Dots**: Replace inline metrics with 8px circular status indicators (blue/yellow/green)
2. **Hover Popovers**: Hide detailed metrics by default, reveal on hover with 400ms delay
3. **Simplified Navigation**: Clean, uncluttered sidebar showing only icon, label, and status dot

## Prerequisites

- Node.js 18+ and pnpm installed
- PostgreSQL database running
- Project dependencies installed (`pnpm install`)

## Quick Start

```bash
# 1. Checkout the feature branch
git checkout 013-detail-page-redesign

# 2. Install dependencies (if not already done)
pnpm install

# 3. Start development server
pnpm dev

# 4. Open browser to test
open http://localhost:3000/projects/spec-board/features/012-ui-ux-rebrand
```

## Key Files to Modify

| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/feature-detail/status-dot.tsx` | NEW | Reusable status dot component |
| `src/components/feature-detail/section-popover.tsx` | NEW | Hover popover for detailed metrics |
| `src/components/feature-detail/nav-item.tsx` | MODIFY | Replace inline metrics with status dot |
| `src/components/feature-detail/nav-sidebar.tsx` | MODIFY | Wire up popover triggers |
| `src/components/feature-detail/types.ts` | MODIFY | Add StatusDot and Popover types |

## Implementation Steps

### Step 1: Create StatusDot Component

Create `src/components/feature-detail/status-dot.tsx`:

```typescript
'use client';

import { cn } from '@/lib/utils';

export type StatusState = 'not-started' | 'in-progress' | 'complete';

interface StatusDotProps {
  status: StatusState;
  size?: 'sm' | 'md';
  className?: string;
}

export function getStatusFromCompletion(completed: number, total: number): StatusState {
  if (total === 0 || completed === 0) return 'not-started';
  if ((completed / total) * 100 >= 80) return 'complete';
  return 'in-progress';
}

export function StatusDot({ status, size = 'md', className }: StatusDotProps) {
  const sizeClass = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  const colorVar = {
    'not-started': 'var(--status-not-started)',
    'in-progress': 'var(--status-in-progress)',
    'complete': 'var(--status-complete)',
  }[status];

  return (
    <div
      className={cn('rounded-full flex-shrink-0', sizeClass, className)}
      style={{ backgroundColor: colorVar }}
      role="img"
      aria-label={`Status: ${status.replace('-', ' ')}`}
    />
  );
}
```

### Step 2: Create SectionPopover Component

Create `src/components/feature-detail/section-popover.tsx`:

```typescript
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SectionPopoverProps {
  children: React.ReactNode;
  content: React.ReactNode;
  showDelay?: number;
  hideDelay?: number;
  side?: 'left' | 'right';
}

export function SectionPopover({
  children,
  content,
  showDelay = 400,
  hideDelay = 150,
  side = 'right',
}: SectionPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const showTimeoutRef = useRef<NodeJS.Timeout>();
  const hideTimeoutRef = useRef<NodeJS.Timeout>();
  const triggerRef = useRef<HTMLDivElement>(null);

  const clearTimeouts = useCallback(() => {
    if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
  }, []);

  const showPopover = useCallback(() => {
    clearTimeouts();
    showTimeoutRef.current = setTimeout(() => setIsOpen(true), showDelay);
  }, [clearTimeouts, showDelay]);

  const hidePopover = useCallback(() => {
    clearTimeouts();
    hideTimeoutRef.current = setTimeout(() => setIsOpen(false), hideDelay);
  }, [clearTimeouts, hideDelay]);

  const cancelHide = useCallback(() => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
  }, []);

  useEffect(() => {
    return () => clearTimeouts();
  }, [clearTimeouts]);

  return (
    <div
      ref={triggerRef}
      className="relative"
      onMouseEnter={showPopover}
      onMouseLeave={hidePopover}
      onFocus={showPopover}
      onBlur={hidePopover}
    >
      {children}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 top-0 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg p-3 min-w-[200px]',
            side === 'right' ? 'left-full ml-2' : 'right-full mr-2'
          )}
          onMouseEnter={cancelHide}
          onMouseLeave={hidePopover}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  );
}
```

### Step 3: Modify NavItem to Use StatusDot

In `src/components/feature-detail/nav-item.tsx`, replace inline metrics with StatusDot:

```typescript
// Before: Inline task count badge
{taskCount && taskCount.total > 0 && (
  <span className="text-xs px-1.5 py-0.5 rounded ...">
    {taskCount.completed}/{taskCount.total}
  </span>
)}

// After: Status dot only
{taskCount && taskCount.total > 0 && (
  <StatusDot status={getStatusFromCompletion(taskCount.completed, taskCount.total)} />
)}
```

### Step 4: Add Popover to Navigation Items

Wrap navigation items with SectionPopover to show details on hover:

```typescript
<SectionPopover
  content={
    <div className="space-y-1">
      <div className="font-medium">{label}</div>
      {taskCount && (
        <div className="text-sm text-[var(--muted-foreground)]">
          {taskCount.completed}/{taskCount.total} tasks ({Math.round((taskCount.completed / taskCount.total) * 100)}%)
        </div>
      )}
    </div>
  }
>
  <NavItem ... />
</SectionPopover>
```

## Testing Checklist

- [ ] Status dots display correct colors (blue/yellow/green)
- [ ] Popovers appear after 400ms hover delay
- [ ] Popovers disappear after 150ms when mouse leaves
- [ ] Mouse can move from trigger to popover without dismissal
- [ ] Keyboard focus triggers popover
- [ ] Escape key closes popover
- [ ] All existing keyboard shortcuts still work
- [ ] Split view functionality unchanged
- [ ] Drag-and-drop functionality unchanged
- [ ] Screen reader announces status correctly

## CSS Variables (Already Defined)

```css
/* In src/app/globals.css */
--status-not-started: #3b82f6;  /* Blue - 0% */
--status-in-progress: #eab308;  /* Yellow - 1-79% */
--status-complete: #22c55e;     /* Green - 80-100% */
```

## Accessibility Notes

1. **ARIA Labels**: StatusDot includes `aria-label` for screen readers
2. **Keyboard Support**: Popovers trigger on focus, not just hover
3. **Role Attributes**: Popover uses `role="tooltip"`
4. **Escape Handling**: Add escape key handler to close popovers

## Mobile Considerations

For touch devices, use tap-to-toggle instead of hover:

```css
@media (hover: none) {
  /* Touch device styles */
}
```

## Related Documentation

- [Feature Spec](./spec.md)
- [Research Notes](./research.md)
- [Constitution](../../.specify/memory/constitution.md)
- [Feature Detail CLAUDE.md](../../src/components/feature-detail/CLAUDE.md)
