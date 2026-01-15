# Research: Detail Page Redesign

**Feature**: 013-detail-page-redesign
**Date**: 2026-01-14
**Status**: Complete

## Research Questions

### RQ1: Best practices for hover popover timing

**Decision**: Use 400ms show delay and 150ms hide delay

**Rationale**:
- 400ms show delay prevents accidental triggers when moving mouse across navigation
- 150ms hide delay allows users to move from trigger to popover content without dismissal
- These values align with common UI patterns (Radix UI defaults to 400ms/300ms)
- Shorter hide delay (150ms) feels more responsive while still preventing flicker

**Alternatives Considered**:
- Instant show (0ms): Rejected - causes flickering when scanning navigation
- Longer hide delay (300ms+): Rejected - feels sluggish when intentionally moving away
- Click-to-show: Rejected - adds friction for quick information access

### RQ2: Status dot color semantics

**Decision**: Use existing CSS variables with 3-state model

| State | Color | CSS Variable | Condition |
|-------|-------|--------------|-----------|
| Not Started | Blue (#3b82f6) | `--status-not-started` | 0% completion |
| In Progress | Yellow (#eab308) | `--status-in-progress` | 1-79% completion |
| Complete | Green (#22c55e) | `--status-complete` | 80-100% completion |

**Rationale**:
- Already defined in `globals.css` (lines 55-58)
- Matches Kanban board status indicators for visual consistency
- 3-state model is simpler than percentage-based gradients
- 80% threshold for "complete" allows for minor incomplete items

**Alternatives Considered**:
- 5-state model (0%, 1-25%, 26-50%, 51-75%, 76-100%): Rejected - too complex, hard to distinguish colors
- Percentage-based opacity: Rejected - poor accessibility, hard to read
- 100% threshold for complete: Rejected - too strict, minor items shouldn't block green status

### RQ3: Popover positioning strategy

**Decision**: Use CSS-based positioning with viewport boundary detection

**Rationale**:
- Popovers should appear to the right of navigation items by default
- When near viewport edge, reposition to left side
- Use CSS transforms for smooth positioning without layout shifts
- Leverage existing Tooltip component patterns in codebase

**Implementation Approach**:
```typescript
// Positioning logic
const getPopoverPosition = (triggerRect: DOMRect) => {
  const viewportWidth = window.innerWidth;
  const popoverWidth = 280; // Fixed width for consistency

  // Default: right side
  if (triggerRect.right + popoverWidth + 8 < viewportWidth) {
    return { side: 'right', x: triggerRect.right + 8 };
  }
  // Fallback: left side
  return { side: 'left', x: triggerRect.left - popoverWidth - 8 };
};
```

**Alternatives Considered**:
- Radix UI Popover: Rejected - adds dependency for simple use case
- Fixed position (always right): Rejected - clips on narrow viewports
- Tooltip component reuse: Partially adopted - use similar patterns but custom component for richer content

### RQ4: Accessibility requirements for hover popovers

**Decision**: Implement WCAG AA compliant hover interactions

**Requirements**:
1. **Keyboard accessible**: Popovers must be triggerable via focus (not just hover)
2. **Dismissible**: Escape key closes popover
3. **Hoverable**: Users can move mouse into popover without it closing
4. **Persistent**: Popover stays open while focused or hovered
5. **ARIA attributes**:
   - `aria-describedby` on trigger pointing to popover
   - `role="tooltip"` on popover (or `role="dialog"` if interactive)
   - `aria-hidden` when not visible

**Implementation**:
```typescript
// Accessibility pattern
<button
  aria-describedby={isOpen ? popoverId : undefined}
  onFocus={() => setIsOpen(true)}
  onBlur={() => setIsOpen(false)}
  onMouseEnter={() => showWithDelay()}
  onMouseLeave={() => hideWithDelay()}
>
  {/* trigger content */}
</button>
<div
  id={popoverId}
  role="tooltip"
  aria-hidden={!isOpen}
  onMouseEnter={() => cancelHide()}
  onMouseLeave={() => hideWithDelay()}
>
  {/* popover content */}
</div>
```

**Alternatives Considered**:
- Hover-only (no keyboard): Rejected - fails WCAG 2.1 SC 1.4.13
- Click-to-open modal: Rejected - too heavy for quick info access

### RQ5: Mobile/touch device behavior

**Decision**: Show details on tap/click instead of hover

**Rationale**:
- Touch devices don't have hover capability
- Tap to show, tap elsewhere to dismiss is intuitive
- Use `@media (hover: none)` to detect touch-primary devices

**Implementation**:
```css
/* Touch device detection */
@media (hover: none) {
  .popover-trigger {
    /* Remove hover styles, use click/tap */
  }
}
```

**Alternatives Considered**:
- Long-press to show: Rejected - not discoverable, conflicts with native behaviors
- Always show details on mobile: Rejected - clutters interface
- Hide details entirely on mobile: Rejected - removes functionality

## Existing Codebase Patterns

### Current Status Dot Usage (Kanban Board)

From `src/components/kanban-board.tsx`:
```typescript
// Status dot calculation
const getStatusColor = (feature: Feature) => {
  const completion = feature.totalTasks > 0
    ? (feature.completedTasks / feature.totalTasks) * 100
    : 0;

  if (completion === 0) return 'var(--status-not-started)';
  if (completion >= 80) return 'var(--status-complete)';
  return 'var(--status-in-progress)';
};

// Status dot rendering
<div
  className="w-2 h-2 rounded-full"
  style={{ backgroundColor: getStatusColor(feature) }}
/>
```

### Current Tooltip Component

From `src/components/tooltip.tsx`:
- Uses CSS positioning with transforms
- Supports `side` prop (top, right, bottom, left)
- Has `delay` prop for show timing
- Uses `aria-describedby` pattern

### Current NavItem Metrics Display

From `src/components/feature-detail/nav-item.tsx`:
- Shows inline `taskCount` badge (e.g., "5/10")
- Shows inline `groupCount` badge (e.g., "3 US")
- Uses conditional styling based on completion

## Design Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Show delay | 400ms | Prevents accidental triggers |
| Hide delay | 150ms | Allows hover-to-popover movement |
| Status colors | 3-state (blue/yellow/green) | Matches Kanban, already in CSS |
| Complete threshold | 80% | Practical, not perfectionist |
| Popover position | Right (with left fallback) | Natural reading flow |
| Keyboard support | Focus triggers popover | WCAG AA compliance |
| Mobile behavior | Tap to toggle | Touch-friendly alternative |

## Dependencies

No new dependencies required. Implementation uses:
- Existing CSS variables (`--status-*`)
- Existing Tooltip patterns
- Native React state management
- CSS media queries for touch detection

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Popover flicker | Low | Medium | Proper delay timing, hover bridging |
| Accessibility regression | Low | High | Keyboard testing, screen reader testing |
| Performance impact | Low | Low | CSS-only animations, no heavy JS |
| Mobile usability | Medium | Medium | Touch-specific behavior, user testing |

## Next Steps

1. Create `StatusDot` component with color calculation
2. Create `SectionPopover` component with timing logic
3. Modify `NavItem` to use StatusDot instead of inline metrics
4. Add popover triggers to navigation items
5. Test keyboard navigation and screen reader announcements
6. Test on touch devices
