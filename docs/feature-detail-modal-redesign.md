# Design: Feature Detail Modal Redesign

**Date:** 2025-12-30
**Status:** Approved
**Author:** Brainstorm Session

---

## Summary

Redesign the Feature Detail modal from a cramped 768px tabbed modal to a full-screen two-panel layout with split-view document comparison. This addresses three key pain points:

1. **Information overload** - 10 tabs overwhelming users
2. **Space constraints** - Content feels cramped
3. **Visual hierarchy** - Hard to understand feature status at a glance

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [←] Feature Name                                        [Split] [⚙] [✕]     │
├────────────────────┬─────────────────────────────────────────────────────────┤
│                    │                                                         │
│  ┌──────────────┐  │  ┌──────────────────────┬──────────────────────┐       │
│  │ STATUS       │  │  │                      │                      │       │
│  │ ████████ 65% │  │  │   LEFT PANE          │   RIGHT PANE         │       │
│  │ Stage: Impl  │  │  │   (Primary)          │   (Split - optional) │       │
│  │ Next: T005   │  │  │                      │                      │       │
│  └──────────────┘  │  │   Markdown content   │   Markdown content   │       │
│                    │  │                      │                      │       │
│  DEFINE            │  │                      │                      │       │
│    ✓ Spec          │  │                      │                      │       │
│    ○ Research      │  └──────────────────────┴──────────────────────┘       │
│    ○ Data Model    │         ↑ Draggable vertical divider                   │
│                    │                                                         │
│  PLAN              │                                                         │
│    ✓ Plan          │                                                         │
│    ○ Contracts     │                                                         │
│                    │                                                         │
│  EXECUTE           │                                                         │
│    ◐ Tasks (3/8)   │                                                         │
│    ○ Checklists    │                                                         │
│    ○ Analysis      │                                                         │
│                    │                                                         │
└────────────────────┴─────────────────────────────────────────────────────────┘
     ~250px                              remaining width
```

### Key Layout Decisions

| Aspect | Decision |
|--------|----------|
| Layout | Full-screen takeover (like Notion) |
| Navigation | Two-panel: left sidebar + right content |
| Content | Vertical split view (side-by-side) |
| Split activation | On-demand button + drag-to-split |

---

## Components

### 1. Header Bar

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [←] Feature Name                                        [Split] [⚙] [✕]     │
└──────────────────────────────────────────────────────────────────────────────┘
```

| Element | Purpose |
|---------|---------|
| `[←]` Back button | Close modal, return to Kanban |
| Feature Name | Current feature title |
| `[Split]` | Toggle/open split view dropdown |
| `[⚙]` Settings | Modal preferences (future) |
| `[✕]` Close | Close modal |

### 2. Status Header (Left Panel Top)

```
┌─────────────────────────┐
│  Feature: Auth System   │
│                         │
│  ████████████░░░ 65%    │
│  3 of 8 tasks done      │
│                         │
│  ┌───────────────────┐  │
│  │ 🎯 NEXT ACTION    │  │
│  │ Complete T005:    │  │
│  │ Add JWT refresh   │  │
│  └───────────────────┘  │
│                         │
│  Stage: Implement       │
│  Updated: 2 hours ago   │
└─────────────────────────┘
```

**Content:**
- Feature name
- Progress bar with percentage
- Task completion count
- **Next Action box** (highlighted, actionable)
- Current stage
- Last updated timestamp

### 3. Navigation Sidebar (Left Panel)

**Grouped by workflow phase:**

```
DEFINE
  ✓ Spec
  ○ Research
  ○ Data Model

PLAN
  ✓ Plan
  ○ Contracts

EXECUTE
  ◐ Tasks (3/8)
  ○ Checklists
  ○ Analysis
```

**Status Indicators:**

| Icon | Meaning | Color |
|------|---------|-------|
| `✓` | Complete | Green |
| `◐` | In Progress | Yellow |
| `○` | Pending | Gray |
| `—` | N/A (no file) | Dimmed |

**Drag Behavior:**
- Grab handle appears on hover (left of item)
- While dragging, content area shows drop zone
- Drop creates split view with dragged item

### 4. Content Area (Right Panel)

**Single Pane Mode (default):**

```
┌─────────────────────────────────────────────────────────────────┐
│  📄 spec.md                                    [Split] [↗ Open] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  # Authentication System Specification                          │
│                                                                 │
│  ## Overview                                                    │
│  This feature implements JWT-based authentication...            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Split Pane Mode (vertical/side-by-side):**

```
┌────────────────────────────────────┬────────────────────────────────────┐
│  📄 spec.md              [✕ Close] │  📄 plan.md              [✕ Close] │
├────────────────────────────────────┼────────────────────────────────────┤
│                                    │                                    │
│  # Authentication System           │  # Implementation Plan             │
│                                    │                                    │
│  ## Overview                       │  ## Phase 1: Core Auth             │
│  This feature implements           │  1. Set up JWT middleware          │
│  JWT-based authentication...       │  2. Create login endpoint          │
│                                    │                                    │
└────────────────────────────────────┴────────────────────────────────────┘
                    ↑ Draggable vertical divider (50/50 default)
```

**Pane Interactions:**
- Click nav item → Opens in left pane (or focused pane)
- Drag nav item to content → Opens in right pane
- Click `[Split]` button → Dropdown to select second document
- Drag divider → Resize panes horizontally
- Click `[✕]` on pane → Closes pane, returns to single view
- Each pane scrolls independently

---

## Data Flow

```
User clicks feature card
        ↓
Modal opens (full-screen)
        ↓
Load feature data (existing)
        ↓
Render Status Header + Navigation
        ↓
Default: Show Overview in content pane
        ↓
User clicks nav item → Load content in left pane
        ↓
User drags nav item → Open split view, load in right pane
        ↓
User closes modal → Return to Kanban
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Esc` | Close modal / Close split pane |
| `1-9` | Jump to nav item by position |
| `↑/↓` | Navigate between nav items |
| `Enter` | Open selected nav item in main (left) pane |
| `Shift+Enter` | Open selected nav item in split (right) pane |
| `Ctrl+\` | Toggle split view on/off |
| `Ctrl+E` | Open file in external editor |
| `Tab` | Switch focus between panes |

---

## Responsive Behavior

| Viewport | Behavior |
|----------|----------|
| Desktop (>1024px) | Full two-panel layout with split support |
| Tablet (768-1024px) | Collapsible left panel (hamburger toggle) |
| Mobile (<768px) | Bottom sheet with swipe navigation between sections |

---

## Animation & Transitions

| Transition | Animation |
|------------|-----------|
| Modal open | Fade in + scale from center |
| Split pane open | Slide in from right (300ms) |
| Split pane close | Slide out to right (200ms) |
| Nav item hover | Subtle background highlight |
| Drag indicator | Pulsing drop zone border |

---

## State Management

```typescript
interface FeatureDetailState {
  // Current feature
  feature: Feature;

  // Navigation
  activeSection: SectionId;
  focusedPane: 'left' | 'right';

  // Split view
  isSplitView: boolean;
  leftPaneContent: SectionId;
  rightPaneContent: SectionId | null;
  splitRatio: number; // 0.5 = 50/50

  // UI state
  isLeftPanelCollapsed: boolean; // for tablet
}
```

---

## File Structure (Proposed)

```
src/components/
├── feature-detail/
│   ├── index.tsx              # Main component (re-export)
│   ├── feature-detail.tsx     # Container component
│   ├── header-bar.tsx         # Top header with actions
│   ├── status-header.tsx      # Progress + next action
│   ├── nav-sidebar.tsx        # Left navigation panel
│   ├── content-pane.tsx       # Single content pane
│   ├── split-view.tsx         # Split view container
│   ├── nav-item.tsx           # Draggable nav item
│   └── types.ts               # Local types
```

---

## Migration Strategy

1. **Phase 1:** Create new component structure alongside existing
2. **Phase 2:** Implement full-screen layout + status header
3. **Phase 3:** Add grouped navigation sidebar
4. **Phase 4:** Implement split view with drag-to-split
5. **Phase 5:** Add keyboard shortcuts + responsive behavior
6. **Phase 6:** Replace old modal, remove deprecated code

---

## Open Questions

1. Should split view state persist per-feature or reset on close?
2. Do we need a "maximize pane" option for temporary full-width viewing?
3. Should the Overview section be removed (redundant with status header)?

---

## References

- Current implementation: `src/components/feature-detail.tsx`
- Design inspiration: Notion page view, Linear detail panel, VS Code split editors
