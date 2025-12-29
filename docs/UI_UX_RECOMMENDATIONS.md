# UI/UX Recommendations for SpecBoard

> Deep research findings on best practices for dashboard and Kanban board design

## Executive Summary

Based on comprehensive research of modern dashboard design principles, Linear app patterns, and accessibility best practices, this document provides actionable recommendations to enhance SpecBoard's user experience.

---

## 1. Current State Analysis

### Strengths
- **Dark theme** with CSS variables for consistent theming
- **Clean Kanban layout** with 3 columns (Backlog, In Progress, Done)
- **Tabbed modal interface** for feature details
- **Real-time updates** via SSE
- **Recharts integration** for data visualization
- **New split-view home page** with recent projects and quick access ✅
- **Path-based URL routing** for easy sharing ✅
- **Recent projects with full context** (stats, completion %, stage breakdown) ✅
- **Streamlined project search** with autocomplete modal ✅

### Areas for Improvement
- No drag-and-drop functionality for task management
- Dashboard metrics could benefit from better visual hierarchy
- Missing micro-interactions and feedback patterns
- Command palette (`Cmd+K`) not yet implemented

---

## 2. Dashboard Design Principles (2025 Best Practices)

### 2.1 Visual Hierarchy

**Recommendation**: Implement a clear information hierarchy

```
Priority Order:
1. Critical metrics (task completion %, blockers)
2. Active work (In Progress column)
3. Upcoming work (Backlog)
4. Historical data (Done, charts)
```

**Implementation**:
- Use larger font sizes and bolder weights for primary metrics
- Apply subtle background colors to highlight active sections
- Reduce visual weight of completed/historical items

### 2.2 Cognitive Load Reduction

**Current Issue**: All information presented with equal weight

**Recommendations**:
1. **Progressive disclosure**: Show summary first, details on demand
2. **Smart defaults**: Pre-filter to show "My Tasks" or "This Sprint"
3. **Contextual actions**: Show relevant actions based on current view
4. **Chunked information**: Group related metrics together

### 2.3 Data Visualization

**Current**: Basic bar/line chart with Recharts

**Recommendations**:
1. **Sparklines** for quick trend indicators in metric cards
2. **Progress rings** for completion percentages (more scannable than bars)
3. **Color coding** with semantic meaning:
   - Green: On track / Complete
   - Yellow: At risk / Needs attention
   - Red: Blocked / Overdue
   - Blue: In progress / Active

---

## 3. Kanban Board Best Practices

### 3.1 Card Design

**Recommendations**:

```tsx
// Ideal card information hierarchy
<KanbanCard>
  <CardHeader>
    <TaskId />           {/* T001 - subtle, monospace */}
    <PriorityBadge />    {/* P1/P2/P3 - color coded */}
  </CardHeader>
  <CardTitle />          {/* Primary focus - larger text */}
  <CardMeta>
    <UserStoryTag />     {/* [US1] - clickable filter */}
    <ProgressIndicator /> {/* Subtask completion */}
  </CardMeta>
</KanbanCard>
```

**Visual Enhancements**:
- Subtle left border color indicating priority
- Hover state with slight elevation (shadow)
- Skeleton loading states for async content

### 3.2 Column Design

**Recommendations**:
1. **Column headers** with count badges: `In Progress (5)`
2. **WIP limits** visual indicator (e.g., column turns yellow when at limit)
3. **Empty state** messaging: "No tasks in backlog" with action prompt
4. **Collapse/expand** for columns with many items

### 3.3 Drag and Drop Implementation

**If implementing drag-and-drop**:

```tsx
// Required accessibility features
interface DragDropAccessibility {
  // Keyboard alternatives
  keyboardShortcuts: {
    'Space/Enter': 'Pick up item',
    'Arrow keys': 'Move item',
    'Escape': 'Cancel drag',
  },

  // ARIA attributes
  ariaAttributes: {
    'aria-grabbed': 'true/false',
    'aria-dropeffect': 'move',
    'role': 'listitem',
  },

  // Alternative methods
  alternatives: [
    'Move to column dropdown',
    'Keyboard shortcuts',
    'Context menu actions',
  ]
}
```

---

## 4. Accessibility Requirements (WCAG 2.2)

### 4.1 Dragging Movements (Success Criterion 2.5.7)

**Requirement**: Any drag operation must have a single-pointer alternative

**Implementation for SpecBoard**:

1. **Move Menu**: Add dropdown on each card
   ```tsx
   <DropdownMenu>
     <DropdownMenuItem>Move to Backlog</DropdownMenuItem>
     <DropdownMenuItem>Move to In Progress</DropdownMenuItem>
     <DropdownMenuItem>Move to Done</DropdownMenuItem>
   </DropdownMenu>
   ```

2. **Keyboard Navigation**:
   - `Tab` to navigate between cards
   - `Enter` to open card actions
   - `Arrow keys` to move within column
   - `M` + `1/2/3` to move to column

3. **ARIA Labels**:
   ```tsx
   <div
     role="listitem"
     aria-label="Task T001: Implement login, Priority 1, In Progress"
     tabIndex={0}
   >
   ```

### 4.2 Keyboard Navigation

**Required keyboard support**:

| Key | Action |
|-----|--------|
| `Tab` | Move focus between interactive elements |
| `Enter/Space` | Activate focused element |
| `Escape` | Close modal/dropdown |
| `Arrow Up/Down` | Navigate within lists |
| `Arrow Left/Right` | Navigate between columns |

### 4.3 Screen Reader Support

**Recommendations**:
1. Announce column changes: "Task moved to In Progress"
2. Provide context: "3 of 5 tasks complete in this feature"
3. Label all interactive elements
4. Use semantic HTML (`<main>`, `<nav>`, `<section>`)

---

## 5. Linear App Design Patterns

### 5.1 Key Patterns to Adopt

1. **Command Palette** (`Cmd+K`)
   - Quick navigation to any feature/task
   - Search across all content
   - Execute common actions

2. **Keyboard-First Design**
   - Every action accessible via keyboard
   - Visible keyboard shortcuts in menus
   - Focus indicators that are clear but not intrusive

3. **Minimal Chrome**
   - Reduce visual noise
   - Hide secondary actions until hover/focus
   - Use whitespace effectively

4. **Instant Feedback**
   - Optimistic updates (show change immediately)
   - Subtle loading indicators
   - Success/error toasts

### 5.2 Animation Principles

```css
/* Recommended animation values */
:root {
  --transition-fast: 150ms ease-out;
  --transition-normal: 200ms ease-out;
  --transition-slow: 300ms ease-out;
}

/* Use for: */
/* fast: hover states, focus rings */
/* normal: dropdowns, tooltips */
/* slow: modals, page transitions */
```

---

## 6. Specific Component Recommendations

### 6.1 Feature Detail Modal

**Current**: Tabbed interface with Overview, Spec, Plan, Tasks, etc.

**Recommendations**:

1. **Sticky header** with feature title and quick actions
2. **Tab status indicators** (dot for unread/updated content)
3. **Breadcrumb navigation** within modal
4. **Keyboard shortcuts** for tab switching (`1-6` keys)
5. **Split view option** for comparing spec vs implementation

### 6.2 Dashboard Metrics Panel

**Current**: StatBadge components with Recharts

**Recommendations**:

1. **Metric cards with trends**:
   ```tsx
   <MetricCard>
     <MetricValue>85%</MetricValue>
     <MetricLabel>Completion Rate</MetricLabel>
     <TrendIndicator direction="up" value="+5%" />
     <Sparkline data={weeklyData} />
   </MetricCard>
   ```

2. **Interactive filters**:
   - Time range selector (This week, This month, All time)
   - Feature filter
   - Priority filter

3. **Drill-down capability**:
   - Click metric to see detailed breakdown
   - Link to relevant filtered view

### 6.3 Project Selector

**Current**: Split-view home page with recent projects list and search modal ✅

**Implemented**:

1. ✅ **Recent projects** prominently displayed (left panel with full metadata)
2. ✅ **Search** with path autocomplete modal (`Cmd+K` style)
3. ✅ **Project health indicators** (completion %, feature count, stage breakdown)
4. ✅ **Default to home directory** for quick navigation

**Future Enhancements**:
- **Favorites/pinned** projects (not yet implemented)

---

## 7. Implementation Priority

### Phase 1: Quick Wins (High Impact, Low Effort)
- [ ] Add keyboard shortcuts for common actions
- [x] Improve focus indicators ✅
- [x] Add ARIA labels to interactive elements ✅
- [ ] Implement "Move to" dropdown on Kanban cards
- [x] Add loading states and skeleton screens ✅

### Phase 2: Core Improvements
- [x] Implement command palette (`Cmd+K`) → Implemented as Open Project modal ✅
- [ ] Add metric card trends and sparklines
- [x] Improve modal navigation with keyboard ✅
- [ ] Add column WIP limit indicators
- [ ] Implement toast notifications for actions

### Phase 3: Advanced Features
- [ ] Drag-and-drop with full accessibility support
- [ ] Split view for feature comparison
- [x] Advanced filtering and search → Path autocomplete with preview ✅
- [ ] Customizable dashboard layout
- [ ] Keyboard shortcut customization

### Completed (New Features)
- [x] Split-view home page with recent projects list ✅
- [x] Path-based URL routing for shareable links ✅
- [x] Recent projects with rich metadata (stats, completion %, stages) ✅
- [x] Default to home directory in project search ✅
- [x] HTML validation fixes (nested button issue) ✅

---

## 8. Technical Implementation Notes

### 8.1 Recommended Libraries

| Purpose | Library | Rationale |
|---------|---------|-----------|
| Drag & Drop | `@dnd-kit/core` | Best accessibility support |
| Command Palette | `cmdk` | Linear-style, accessible |
| Animations | `framer-motion` | Smooth, performant |
| Toast Notifications | `sonner` | Minimal, accessible |
| Keyboard Shortcuts | `react-hotkeys-hook` | Simple, effective |

### 8.2 CSS Variables to Add

```css
:root {
  /* Semantic colors */
  --color-success: #22c55e;
  --color-warning: #eab308;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  /* Priority colors */
  --priority-p1: #ef4444;
  --priority-p2: #f97316;
  --priority-p3: #6b7280;

  /* Animation */
  --transition-fast: 150ms ease-out;
  --transition-normal: 200ms ease-out;

  /* Focus */
  --focus-ring: 0 0 0 2px var(--color-info);
}
```

### 8.3 Accessibility Testing Checklist

- [ ] All interactive elements focusable via keyboard
- [ ] Focus order follows visual order
- [ ] Focus indicators visible in all themes
- [ ] Screen reader announces all state changes
- [ ] Color is not the only indicator of state
- [ ] Touch targets minimum 44x44px
- [ ] Drag operations have keyboard alternatives

---

## 9. References

1. UXPin - Dashboard Design Principles 2025
2. Linear App - Design System Patterns
3. WCAG 2.2 - Success Criterion 2.5.7 (Dragging Movements)
4. AccessibilitySpark - Drag and Drop Accessibility Guide
5. Smashing Magazine - Drag and Drop UX Guidelines

---

*Generated: 2025-12-29*
*Updated: 2025-12-29 - Added implemented features from UI rebranding*
*Research conducted using deep-research mode*
