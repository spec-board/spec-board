# Accessibility Directory

## Purpose
WCAG 2.2 AA compliant accessibility utilities.

## Overview
This directory contains accessibility utilities for keyboard navigation, focus management, and screen reader support. These utilities help ensure the application meets WCAG 2.2 AA compliance standards.

## Key Files

| File | Purpose |
|------|---------|
| `index.ts` | Re-exports all accessibility utilities |
| `use-focus-trap.ts` | Focus trapping hook for modals |
| `announcer.ts` | Screen reader announcements |

## Utilities

### Focus Trap (`use-focus-trap.ts`)

Traps keyboard focus within a container (e.g., modal dialogs).

```typescript
import { useFocusTrap } from '@/lib/accessibility';

function Modal({ isOpen, onClose }) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(modalRef, isOpen, {
    initialFocusRef: closeButtonRef,
    onEscape: onClose,
  });

  return <div ref={modalRef}>...</div>;
}
```

**Options:**
| Option | Type | Purpose |
|--------|------|---------|
| `initialFocusRef` | `RefObject` | Element to focus on open |
| `onEscape` | `() => void` | Callback when Escape pressed |
| `returnFocusOnClose` | `boolean` | Return focus to trigger element |

### Announcer (`announcer.ts`)

Announces messages to screen readers via ARIA live regions.

```typescript
import { announce } from '@/lib/accessibility';

// Polite announcement (waits for idle)
announce('Item selected', 'polite');

// Assertive announcement (interrupts)
announce('Error: Form validation failed', 'assertive');
```

**Parameters:**
| Parameter | Type | Purpose |
|-----------|------|---------|
| `message` | `string` | Text to announce |
| `priority` | `'polite' \| 'assertive'` | Announcement priority |

## Patterns & Conventions

- **Hooks**: Use `use` prefix for React hooks
- **ARIA**: Follow WAI-ARIA 1.2 patterns
- **Focus Management**: Restore focus on close
- **Live Regions**: Use appropriate politeness

## Keyboard Shortcuts

| Context | Key | Action |
|---------|-----|--------|
| Modal | `Escape` | Close modal |
| Modal | `Tab` | Cycle through focusable elements |
| Feature Detail | `1-8` | Switch tabs |
| Feature Detail | `Arrow keys` | Navigate tabs |
| Kanban | `Enter` | Open feature detail |

## Dependencies

- **Internal**: None
- **External**: react (hooks)

## Common Tasks

- **Add focus trap**: Use `useFocusTrap` hook
- **Announce change**: Call `announce()` function
- **Add keyboard shortcut**: Handle in `onKeyDown`

## Important Notes

- Focus trap prevents focus from leaving modals
- Announcer creates hidden live region in DOM
- Always restore focus when closing modals
- Test with screen readers (VoiceOver, NVDA)
