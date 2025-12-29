# Accessibility Documentation

SpecBoard is built with WCAG 2.2 AA compliance in mind. This document covers the accessibility features, utilities, and best practices used throughout the application.

## Overview

| Feature | Implementation |
|---------|----------------|
| Keyboard Navigation | Full keyboard support for all interactive elements |
| Screen Reader Support | ARIA roles, labels, and live regions |
| Focus Management | Visible focus indicators, focus trapping in modals |
| Color Contrast | Meets WCAG AA contrast ratios |

---

## Accessibility Utilities

Located in `src/lib/accessibility/`

### useFocusTrap Hook

Traps focus within a container element, essential for modals and dialogs.

```typescript
import { useFocusTrap } from '@/lib/accessibility';

function Modal({ isOpen, onClose }) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(modalRef, isOpen, {
    initialFocusRef: closeButtonRef,
    returnFocusOnDeactivate: true,
  });

  return (
    <div ref={modalRef} role="dialog" aria-modal="true">
      <button ref={closeButtonRef} onClick={onClose}>
        Close
      </button>
      {/* Modal content */}
    </div>
  );
}
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `containerRef` | `RefObject<HTMLElement>` | Ref to the container element |
| `isActive` | `boolean` | Whether the focus trap is active |
| `options.initialFocusRef` | `RefObject<HTMLElement>` | Element to focus on activation |
| `options.returnFocusOnDeactivate` | `boolean` | Return focus to previous element (default: true) |

**Behavior:**
- Traps Tab and Shift+Tab within the container
- Focuses the first focusable element or `initialFocusRef` on activation
- Returns focus to the previously focused element on deactivation
- Filters out hidden elements from the focus order

---

### announce Function

Announces messages to screen readers via ARIA live regions.

```typescript
import { announce } from '@/lib/accessibility';

// Polite announcement (waits for user to finish)
announce('Item selected');

// Assertive announcement (interrupts immediately)
announce('Error: Form submission failed', 'assertive');
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `message` | `string` | - | Message to announce |
| `priority` | `'polite' \| 'assertive'` | `'polite'` | Announcement priority |

**Priority Guidelines:**
- `polite`: Use for status updates, confirmations, navigation changes
- `assertive`: Use for errors, warnings, time-sensitive information

---

### clearAnnouncements Function

Clears all pending announcements.

```typescript
import { clearAnnouncements } from '@/lib/accessibility';

// Clear announcements when component unmounts
useEffect(() => {
  return () => clearAnnouncements();
}, []);
```

---

## Tooltip Component

Located in `src/components/tooltip.tsx`

Accessible tooltip with keyboard shortcut hints.

```typescript
import { Tooltip } from '@/components/tooltip';

<Tooltip content="Save [Ctrl+S]" side="top">
  <button>Save</button>
</Tooltip>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string` | - | Tooltip text |
| `children` | `ReactNode` | - | Trigger element |
| `side` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | Position |
| `delay` | `number` | `300` | Show delay in ms |
| `disabled` | `boolean` | `false` | Disable tooltip |

**Features:**
- Shows on hover and focus (keyboard accessible)
- Includes arrow indicator
- Supports keyboard shortcut formatting

---

## CSS Utilities

Located in `src/app/globals.css`

### Screen Reader Only

Hide content visually but keep it accessible to screen readers:

```html
<span class="sr-only">Additional context for screen readers</span>
```

### Focus Ring

Consistent focus indicator for interactive elements:

```html
<button class="focus-ring">Click me</button>
```

### Skip Link

Allow keyboard users to skip navigation:

```html
<a href="#main-content" class="skip-link">Skip to main content</a>
```

---

## Component Accessibility Patterns

### Kanban Board (`kanban-board.tsx`)

| Feature | Implementation |
|---------|----------------|
| Structure | `role="region"` with `aria-label` |
| Columns | `role="list"` with `aria-labelledby` |
| Cards | `role="listitem"` with descriptive `aria-label` |
| Keyboard | Tab to navigate, Enter to open details |

### Feature Modal (`feature-detail.tsx`)

| Feature | Implementation |
|---------|----------------|
| Dialog | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| Focus | Focus trapped within modal |
| Tabs | `role="tablist"`, `role="tab"`, `role="tabpanel"` |
| Keyboard | Escape to close, 1-8 for tabs, Arrow keys for navigation |

### Dashboard Metrics (`dashboard-metrics.tsx`)

| Feature | Implementation |
|---------|----------------|
| Structure | `<section>` with `aria-label` |
| Stats | `<article>` elements with `aria-label` |
| Chart | `<figure>` with `role="img"` and `<figcaption>` |
| Live | `aria-live="polite"` for dynamic updates |

### Project Selector (`project-selector.tsx`)

| Feature | Implementation |
|---------|----------------|
| Structure | `role="region"` with `aria-label` |
| Directory List | `role="tree"` with `role="treeitem"` |
| Recent Projects | `role="listbox"` with `role="option"` |
| Keyboard | Arrow keys to navigate, Enter to select |
| Status | `role="status"` for loading, `role="alert"` for errors |

---

## Keyboard Shortcuts

### Global

| Key | Action |
|-----|--------|
| `Tab` | Navigate between interactive elements |
| `Shift+Tab` | Navigate backwards |
| `Enter` / `Space` | Activate focused element |
| `Escape` | Close modal/dialog |

### Feature Modal

| Key | Action |
|-----|--------|
| `1-8` | Switch to tab by number |
| `←` / `→` | Navigate between tabs |
| `Escape` | Close modal |

### Project Selector

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate directory list |
| `Enter` | Open selected directory |
| `Home` | Jump to first item |
| `End` | Jump to last item |

---

## Testing Accessibility

### Manual Testing

1. **Keyboard Navigation**: Tab through all interactive elements
2. **Screen Reader**: Test with VoiceOver (Mac) or NVDA (Windows)
3. **Focus Visibility**: Ensure focus indicators are visible
4. **Color Contrast**: Use browser dev tools to check contrast

### Automated Testing

```bash
# Install axe-core for automated accessibility testing
pnpm add -D @axe-core/react

# Run accessibility audit in browser console
axe.run().then(results => console.log(results));
```

### Recommended Tools

- **axe DevTools**: Browser extension for accessibility auditing
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Built-in Chrome accessibility audit
- **VoiceOver**: macOS built-in screen reader
- **NVDA**: Free Windows screen reader

---

## Best Practices

### Do's

- ✅ Use semantic HTML elements (`<button>`, `<nav>`, `<main>`)
- ✅ Provide text alternatives for images (`alt` attribute)
- ✅ Use ARIA roles only when semantic HTML isn't sufficient
- ✅ Ensure all interactive elements are keyboard accessible
- ✅ Provide visible focus indicators
- ✅ Use `aria-live` for dynamic content updates
- ✅ Test with actual screen readers

### Don'ts

- ❌ Don't use `div` or `span` for interactive elements
- ❌ Don't rely on color alone to convey information
- ❌ Don't remove focus outlines without providing alternatives
- ❌ Don't use `aria-hidden="true"` on focusable elements
- ❌ Don't auto-play media without user control
- ❌ Don't use placeholder text as labels

---

## Resources

- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
