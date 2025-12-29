# Accessibility Foundation Design

> WCAG 2.2 AA compliant accessibility implementation for SpecBoard

**Date**: 2025-12-29
**Status**: Approved
**Compliance Target**: WCAG 2.2 AA

---

## Summary

This document defines the accessibility foundation for SpecBoard, covering all major components with keyboard navigation, ARIA attributes, screen reader support, and tooltip-based shortcut hints. This foundation prepares the codebase for future features (command palette, drag-and-drop) while ensuring WCAG 2.2 AA compliance.

---

## Architecture Overview

### Shared Utilities to Create

```
src/lib/
├── accessibility/
│   ├── use-focus-trap.ts      # Focus trapping for modals
│   ├── use-keyboard-nav.ts    # Keyboard navigation hooks
│   ├── use-roving-tabindex.ts # Roving tabindex for lists
│   └── announcer.ts           # Screen reader announcements
src/components/
├── tooltip.tsx                # Tooltip with shortcut hints
└── sr-only.tsx                # Screen reader only text
```

### CSS Variables to Add

```css
:root {
  /* Focus indicators */
  --focus-ring: 0 0 0 2px var(--color-info);
  --focus-ring-offset: 2px;

  /* Semantic colors */
  --color-success: #22c55e;
  --color-warning: #eab308;
  --color-error: #ef4444;
  --color-info: #3b82f6;
}
```

---

## Component Designs

### 1. Kanban Board

**File**: `src/components/kanban-board.tsx`

#### ARIA Structure

```tsx
// Column
<div
  role="list"
  aria-label={`${columnName} column, ${count} items`}
>
  {/* Cards */}
</div>

// Card
<div
  role="listitem"
  tabIndex={0}
  aria-label={`${feature.name}, Priority ${priority}, ${stage}`}
  onKeyDown={handleCardKeyDown}
  className="focus:ring-2 focus:ring-blue-500 focus:outline-none"
>
  <Tooltip content="View details [Enter]">
    <span>{feature.name}</span>
  </Tooltip>
</div>
```

#### Keyboard Shortcuts

| Key | Action | Implementation |
|-----|--------|----------------|
| `Tab` | Move to next card | Native browser behavior |
| `Enter` | Open feature detail | `onKeyDown` handler |
| `M` | Open move menu | `onKeyDown` handler |
| `←/→` | Navigate between columns | `useRovingTabindex` |
| `↑/↓` | Navigate within column | `useRovingTabindex` |

#### Implementation Tasks

- [ ] Add `role="list"` to column containers
- [ ] Add `role="listitem"` and `tabIndex={0}` to cards
- [ ] Add `aria-label` with full context to cards
- [ ] Implement `handleCardKeyDown` for Enter/M keys
- [ ] Add focus ring styles
- [ ] Create `Tooltip` component with shortcut hints
- [ ] Implement roving tabindex for arrow key navigation

---

### 2. Feature Detail Modal

**File**: `src/components/feature-detail.tsx`

#### ARIA Structure

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  onKeyDown={handleModalKeyDown}
>
  <h2 id="modal-title">{feature.name}</h2>

  <div role="tablist" aria-label="Feature details">
    {tabs.map((tab, index) => (
      <Tooltip key={tab.id} content={`${tab.name} [${index + 1}]`}>
        <button
          role="tab"
          id={`tab-${tab.id}`}
          aria-selected={activeTab === index}
          aria-controls={`panel-${tab.id}`}
          tabIndex={activeTab === index ? 0 : -1}
        >
          {tab.name}
        </button>
      </Tooltip>
    ))}
  </div>

  <div
    role="tabpanel"
    id={`panel-${activeTab}`}
    aria-labelledby={`tab-${activeTab}`}
    tabIndex={0}
  >
    {/* Tab content */}
  </div>
</div>
```

#### Keyboard Shortcuts

| Key | Action | Implementation |
|-----|--------|----------------|
| `Escape` | Close modal | `onKeyDown` handler |
| `1-6` | Switch to tab N | `onKeyDown` handler |
| `←/→` | Navigate tabs | `onKeyDown` on tablist |
| `Tab` | Navigate within content | Native behavior |

#### Implementation Tasks

- [ ] Add `role="dialog"` and `aria-modal="true"`
- [ ] Add `aria-labelledby` pointing to title
- [ ] Implement `useFocusTrap` hook
- [ ] Add `role="tablist"` and `role="tab"` to tabs
- [ ] Add `role="tabpanel"` to content area
- [ ] Implement `handleModalKeyDown` for Escape and number keys
- [ ] Add tooltips with keyboard hints to tabs
- [ ] Restore focus to trigger element on close

---

### 3. Dashboard Metrics

**File**: `src/components/dashboard-metrics.tsx`

#### ARIA Structure

```tsx
// Metric card
<article
  aria-label={`${label}: ${value}, ${trend}`}
  tabIndex={0}
  className="focus:ring-2 focus:ring-blue-500"
>
  <span className="text-2xl font-bold" aria-hidden="true">
    {value}
  </span>
  <span className="sr-only">{label}: {value}</span>
  <TrendIndicator direction={direction} value={trendValue} />
</article>

// Chart with description
<figure role="img" aria-label={chartDescription}>
  <ComposedChart aria-hidden="true">
    {/* Visual chart */}
  </ComposedChart>
  <figcaption className="sr-only">
    {detailedChartData}
  </figcaption>
</figure>

// Live region for updates
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {announcements}
</div>
```

#### Color + Icon Pairing

| Status | Color | Icon | Accessible Label |
|--------|-------|------|------------------|
| On Track | Green | CheckCircle | "On Track" |
| At Risk | Yellow | AlertTriangle | "At Risk" |
| Blocked | Red | XCircle | "Blocked" |
| In Progress | Blue | Clock | "In Progress" |

#### Implementation Tasks

- [ ] Add `aria-label` to metric cards with full context
- [ ] Add `tabIndex={0}` to make cards focusable
- [ ] Create `sr-only` class for screen reader text
- [ ] Add `role="img"` and `aria-label` to charts
- [ ] Add `figcaption` with data summary for charts
- [ ] Implement status icons alongside colors
- [ ] Create live region for dynamic updates

---

### 4. Project Selector

**File**: `src/components/project-selector.tsx`

#### ARIA Structure

```tsx
// Recent projects
<section aria-labelledby="recent-heading">
  <h2 id="recent-heading">Recent Projects</h2>
  <ul role="listbox" aria-label="Recent projects">
    {recentProjects.map((project, index) => (
      <li
        role="option"
        aria-selected={selectedIndex === index}
        tabIndex={selectedIndex === index ? 0 : -1}
      >
        {project.name}
      </li>
    ))}
  </ul>
</section>

// File browser tree
<div
  role="tree"
  aria-label="Project browser"
  onKeyDown={handleTreeKeyDown}
>
  {items.map((item) => (
    <div
      role="treeitem"
      aria-expanded={item.isFolder ? item.isExpanded : undefined}
      aria-selected={item.isSelected}
      aria-level={item.depth}
      tabIndex={item.isFocused ? 0 : -1}
    >
      <Tooltip content={item.isFolder ? "Expand [→]" : "Select [Enter]"}>
        <span>{item.name}</span>
      </Tooltip>
    </div>
  ))}
</div>
```

#### Keyboard Shortcuts

| Key | Action | Context |
|-----|--------|---------|
| `↑/↓` | Navigate items | Tree/list navigation |
| `←` | Collapse / Go to parent | On folder |
| `→` | Expand folder | On folder |
| `Enter` | Select project | On item |
| `Home/End` | Jump to first/last | Tree navigation |

#### Implementation Tasks

- [ ] Add `role="listbox"` and `role="option"` to recent projects
- [ ] Add `role="tree"` and `role="treeitem"` to file browser
- [ ] Add `aria-expanded` to folders
- [ ] Add `aria-level` for tree depth
- [ ] Implement `handleTreeKeyDown` for arrow keys
- [ ] Add tooltips with action hints
- [ ] Implement roving tabindex

---

## Shared Components

### Tooltip Component

```tsx
// src/components/tooltip.tsx
interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, side = 'top' }: TooltipProps) {
  return (
    <div className="relative group">
      {children}
      <div
        role="tooltip"
        className={cn(
          "absolute hidden group-hover:block group-focus-within:block",
          "px-2 py-1 text-xs bg-gray-900 text-white rounded",
          "whitespace-nowrap z-50",
          // Position based on side
        )}
      >
        {content}
      </div>
    </div>
  );
}
```

### Screen Reader Only Component

```tsx
// src/components/sr-only.tsx
export function SrOnly({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}

// Add to globals.css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### Focus Trap Hook

```tsx
// src/lib/accessibility/use-focus-trap.ts
export function useFocusTrap(ref: RefObject<HTMLElement>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !ref.current) return;

    const focusableElements = ref.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Store previous focus
    const previousFocus = document.activeElement as HTMLElement;

    // Focus first element
    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [ref, isActive]);
}
```

### Announcer Utility

```tsx
// src/lib/accessibility/announcer.ts
let announcer: HTMLElement | null = null;

export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    document.body.appendChild(announcer);
  }

  announcer.textContent = message;
}
```

---

## Implementation Order

### Phase 1: Foundation (Do First)

1. **CSS Updates** (`globals.css`)
   - Add `.sr-only` class
   - Add focus ring CSS variables
   - Add semantic color variables

2. **Shared Components**
   - Create `Tooltip` component
   - Create `SrOnly` component

3. **Shared Hooks**
   - Create `useFocusTrap` hook
   - Create `announce` utility

### Phase 2: Component Updates

4. **Kanban Board** - Highest user interaction
   - ARIA roles and labels
   - Keyboard navigation
   - Tooltip hints

5. **Feature Detail Modal** - Critical for content access
   - Focus trapping
   - Tab navigation
   - Escape to close

6. **Dashboard Metrics** - Important for overview
   - Semantic markup
   - Chart accessibility
   - Status indicators

7. **Project Selector** - Entry point
   - Tree navigation
   - Listbox for recent projects

### Phase 3: Testing & Refinement

8. **Accessibility Testing**
   - Keyboard-only navigation test
   - Screen reader testing (VoiceOver/NVDA)
   - Focus order verification
   - Color contrast check

---

## Testing Checklist

- [ ] All interactive elements focusable via keyboard
- [ ] Focus order follows visual order
- [ ] Focus indicators visible in dark theme
- [ ] Screen reader announces all state changes
- [ ] Color is not the only indicator of state
- [ ] Touch targets minimum 44x44px
- [ ] Tooltips appear on focus (not just hover)
- [ ] Modal traps focus correctly
- [ ] Escape closes modals/dropdowns
- [ ] Arrow keys navigate lists/trees

---

## Future Considerations

This foundation prepares for:

1. **Command Palette** (Phase 2) - Will use same keyboard patterns
2. **Drag-and-Drop** (Phase 3) - Will need "Move to" dropdown as alternative
3. **Toast Notifications** - Will use announcer utility

---

## References

- [WCAG 2.2 Success Criterion 2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN ARIA Roles](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles)
