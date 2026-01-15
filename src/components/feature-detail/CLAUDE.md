# Feature Detail Directory

## Purpose
Full-screen modal components for viewing and navigating feature details with split-view support.

## Overview
This directory contains the redesigned Feature Detail Modal - a full-screen modal with a left navigation sidebar, split-view capability, and comprehensive keyboard navigation. Components are organized by responsibility: layout (header, sidebar), content rendering (panes), and interaction (drag-to-split).

## Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `feature-detail.tsx` | Main modal component with state management | ~510 |
| `types.ts` | TypeScript types, constants, and helper functions | ~190 |
| `split-view.tsx` | Resizable split-pane container | ~160 |
| `nav-sidebar.tsx` | Left navigation with phase groupings | ~115 |
| `content-pane.tsx` | Content renderer for each section type | ~varies |
| `header-bar.tsx` | Top bar with title and action buttons | ~70 |
| `nav-item.tsx` | Individual navigation item with drag support | ~100 |
| `section-icon.tsx` | Semantic icons for each section type | ~75 |
| `status-dot.tsx` | 8px Jira-style status indicators | ~47 |
| `section-popover.tsx` | Progressive disclosure hover popovers | ~150 |
| `index.tsx` | Public export | ~5 |

## Architecture

```
FeatureDetail (modal container)
├── HeaderBar (title, split toggle, close)
├── NavSidebar
│   └── NavItem[] (grouped by phase)
│       └── SectionIcon (semantic icon per section)
└── SplitView
    ├── ContentPane (left)
    ├── Divider (resizable)
    └── ContentPane (right, optional)
```

## Section Types

Sections are grouped by workflow phase:

| Phase | Sections |
|-------|----------|
| **OVERVIEW** | Overview, Spec |
| **PLANNING** | Plan, Research, Data Model |
| **CODING** | Tasks |
| **QA** | Analysis |
| **QC** | Checklists |

## State Management

The modal manages several pieces of state:

| State | Type | Purpose |
|-------|------|---------|
| `activeSection` | `SectionId` | Currently displayed section |
| `selectedNavIndex` | `number` | Keyboard-selected nav item |
| `splitView` | `SplitViewState` | Split view configuration |
| `draggedSection` | `SectionId \| null` | Section being dragged |

### SplitViewState

```typescript
interface SplitViewState {
  isActive: boolean;
  leftPane: SectionId;
  rightPane: SectionId | null;
  splitRatio: number;      // 0.2 to 0.8
  focusedPane: 'left' | 'right';
}
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Esc` | Close split view, or close modal |
| `Ctrl+\` | Toggle split view |
| `Tab` | Switch focus between panes (in split mode) |
| `1-9` | Jump to section by number |
| `Shift+1-9` | Open section in right pane |
| `↑/↓` | Navigate sections |
| `Enter` | Open selected section |
| `Shift+Enter` | Open in split view |

## Drag and Drop

Users can drag navigation items to the content area to open them in split view:

1. `onDragStart` sets `draggedSection`
2. Content area shows drop indicator
3. `onDrop` activates split view with dragged section in right pane

## Constants

```typescript
// Split ratio bounds (split-view.tsx)
const MIN_SPLIT_RATIO = 0.2;
const MAX_SPLIT_RATIO = 0.8;
const SPLIT_RATIO_STEP = 0.05;

// Phase configuration (types.ts)
const PHASE_CONFIG: Record<WorkflowPhase, { label: string; sections: SectionId[] }>;
```

## Accessibility

- `aria-modal="true"` on dialog
- `aria-labelledby="modal-title"` references header title
- Focus trap within modal (`useFocusTrap`)
- Screen reader announcements via `announce()`
- Keyboard navigation for all interactions
- `role="separator"` on split divider with ARIA value attributes

## Patterns & Conventions

- **Memoization**: `useMemo` for section configs to prevent recalculation
- **Callbacks**: `useCallback` for all event handlers
- **Type Safety**: Explicit types on reduce callbacks (e.g., `Priority`)
- **Announcements**: Use section labels (not IDs) for screen readers
- **CSS Variables**: Theme-aware colors via `var(--foreground)`, etc.

## Dependencies

- **Internal**: `@/lib/utils`, `@/lib/accessibility`, `@/types`, viewer components
- **External**: react, lucide-react

## Common Tasks

- **Add new section**: Add to `SectionId` type, `PHASE_CONFIG`, and `buildSectionConfigs()`
- **Change split bounds**: Modify `MIN_SPLIT_RATIO`, `MAX_SPLIT_RATIO` constants
- **Add keyboard shortcut**: Add handler in `handleKeyDown` callback
- **Add status indicator**: Extend `getSectionStatus()` in types.ts

## Important Notes

- Modal uses focus trap - all focus stays within modal
- Split ratio is clamped to prevent panes from being too small
- Section visibility is determined by `show` property in config
- `buildSectionConfigs` checks `additionalFiles` for optional sections
- In split view, both left and right pane sections are highlighted in nav
- `selectedNavIndex` syncs with `activeSection` on click to prevent stale highlights

## Semantic Icons (section-icon.tsx)

Each section has a semantic icon that conveys document meaning:

| Section | Icon | Color Logic |
|---------|------|-------------|
| Overview | (none) | - |
| Spec | `FileCode` | Green if `hasSpec`, muted otherwise |
| Plan | `FileText` | Green if `hasPlan`, muted otherwise |
| Research | `BookOpen` | Green if file exists |
| Data Model | `Database` | Green if file exists |
| Tasks | `ListTodo` | Green if `hasTasks`, muted otherwise |
| Analysis | `AlertTriangle`/`CheckCircle`/`FileSearch` | Based on analysis severity |
| Checklists | `ClipboardCheck` | Green if `hasChecklists` |

Additional badges:
- **Spec**: Shows clarifications count with `MessageCircle` icon
- **Tasks**: Shows User Story count (e.g., "5 US")
- **Checklists**: Shows checklist file count (e.g., "3 checklists")

## Status Indicators (status-dot.tsx)

**Feature 013** introduced Jira-style status dots to replace verbose progress indicators.

### StatusDot Component

8px circular indicators with three states:

| State | Color | Threshold | CSS Variable |
|-------|-------|-----------|--------------|
| `not-started` | Blue | 0% | `--status-not-started` |
| `in-progress` | Yellow | 1-79% | `--status-in-progress` |
| `complete` | Green | 80-100% | `--status-complete` |

**Usage:**
```typescript
import { StatusDot, getStatusFromCompletion } from './status-dot';

// Calculate status from completion percentage
const status = getStatusFromCompletion(completed, total);

// Render status dot
<StatusDot status={status} size="sm" />
```

**Props:**
- `status`: `'not-started' | 'in-progress' | 'complete'`
- `size`: `'sm' | 'md'` (default: `'md'`)
- `className`: Optional additional classes

**Helper Function:**
```typescript
getStatusFromCompletion(completed: number, total: number): StatusState
```
- Returns `'not-started'` if 0% complete
- Returns `'in-progress'` if 1-79% complete
- Returns `'complete'` if 80-100% complete (80% threshold encourages finishing)

**Accessibility:**
- `role="img"` for screen reader recognition
- `aria-label` announces status (e.g., "Status: in progress")

### Phase Header Status Dots

Phase headers in NavSidebar show aggregate completion status:

```typescript
// Calculate phase completion
const phaseCompletion = getPhaseStatus(phaseSteps);
const phaseStatus = getStatusFromCompletion(
  phaseCompletion.completed,
  phaseCompletion.total
);

// Render with status dot
<StatusDot status={phaseStatus} size="sm" />
<span>{config.label}</span>
```

## Progressive Disclosure (section-popover.tsx)

**Feature 013** introduced hover popovers to hide detailed metrics by default.

### SectionPopover Component

Hover-triggered popover with dual-timeout pattern for progressive disclosure.

**Design Decisions:**
- **400ms show delay**: Prevents accidental triggers during navigation (desktop only)
- **150ms hide delay**: Allows mouse to move from trigger to popover (desktop only)
- **Touch devices**: Tap-to-toggle behavior without delays
- **Escape key**: Closes popover for keyboard users

**Usage:**
```typescript
import { SectionPopover } from './section-popover';

<SectionPopover
  content={
    <div>
      <div>Completed: {completed}/{total}</div>
      <div>Progress: {percentage}%</div>
    </div>
  }
  showDelay={400}
  hideDelay={150}
  side="right"
>
  <NavItem {...props} />
</SectionPopover>
```

**Props:**
- `children`: Trigger element (nav item, button, etc.)
- `content`: Popover content (React node)
- `showDelay`: Milliseconds before showing (default: 400)
- `hideDelay`: Milliseconds before hiding (default: 150)
- `side`: `'left' | 'right'` (default: `'right'`)
- `disabled`: Disable popover functionality

**Behavior:**

**Desktop (hover):**
1. Mouse enters trigger → start 400ms timer
2. Timer completes → show popover
3. Mouse leaves trigger → start 150ms timer
4. Mouse enters popover → cancel hide timer (allows interaction)
5. Mouse leaves popover → start 150ms timer
6. Timer completes → hide popover

**Mobile (touch):**
1. Tap trigger → show popover immediately (no delay)
2. Tap trigger again → hide popover
3. Tap outside → hide popover
4. Escape key → hide popover

**Touch Detection:**
```typescript
// Detects touch capability on mount
const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
```

**Accessibility:**
- `role="tooltip"` on popover content
- Keyboard focus triggers popover (desktop)
- Escape key closes popover
- Click outside closes popover (mobile)

### Integration with NavSidebar

Popovers wrap navigation items that have progress information:

```typescript
<SectionPopover
  content={
    <div className="text-xs">
      <div className="font-semibold mb-1">Progress</div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-[var(--secondary)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-success)]"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-[10px] font-mono">{percentage}%</span>
      </div>
      <div className="text-[10px] text-[var(--muted-foreground)] mt-1">
        {completed} of {total} completed
      </div>
    </div>
  }
>
  <NavItem {...props} />
</SectionPopover>
```
