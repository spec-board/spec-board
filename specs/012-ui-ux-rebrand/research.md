# Research: UI/UX Rebrand - Simple but Professional

**Feature**: 012-ui-ux-rebrand
**Date**: 2026-01-12
**Source**: [spike/260112-simple-professional-interface-design.md](../../agent-includes/spikes/260112-simple-professional-interface-design.md)

## Executive Summary

The spike research confirms that SpecBoard has a **solid foundation** (accessibility, real-time updates, dark/light themes). The opportunity is **refinement, not redesign** - enhancing visual polish through typography, spacing, and component states.

---

## Design Decisions

### Decision 1: Typography - Inter Font

**Decision**: Use Inter as the primary font family

**Rationale**:
- Gold standard for dashboard UIs in 2025
- Excellent readability at small sizes (12-14px)
- Professional appearance
- Free and open-source
- Optimized for screens with variable font support

**Alternatives Considered**:
- System fonts (current) - Functional but generic, inconsistent across platforms
- SF Pro - Apple-only, licensing restrictions
- Roboto - Good but less refined than Inter for data-heavy UIs

**Implementation**:
```tsx
// layout.tsx - use next/font/google
import { Inter } from 'next/font/google'
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
```

---

### Decision 2: Spacing System - 8pt Grid

**Decision**: Standardize all spacing to 8pt (0.5rem) base unit

**Rationale**:
- Industry standard for consistent visual rhythm
- Aligns with Tailwind's default spacing scale
- Creates predictable, harmonious layouts
- Easy mental math (8, 16, 24, 32, 48px)

**Alternatives Considered**:
- 4pt grid - Too granular, leads to inconsistency
- 10pt grid - Doesn't align with Tailwind defaults
- No system (current) - Inconsistent spacing across components

**Spacing Scale**:
| Token | Value | Use Case |
|-------|-------|----------|
| space-1 | 4px | Tight gaps (icon-text) |
| space-2 | 8px | Default gap |
| space-3 | 12px | Card internal padding |
| space-4 | 16px | Section padding |
| space-6 | 24px | Column gaps |
| space-8 | 32px | Section spacing |

---

### Decision 3: Color Palette - Neutral + Single Accent

**Decision**: Neutral grays with cyan (#06b6d4) as the single accent color

**Rationale**:
- Aligns with Constitution Principle VII (minimal color palette)
- Cyan provides good contrast in both light and dark modes
- Professional, not playful
- Already used in existing codebase (`--color-neon`)

**Alternatives Considered**:
- Blue accent - Too common, less distinctive
- Green accent - Could conflict with success states
- Multiple accent colors - Violates Constitution principle

**Color Tokens**:
```css
/* Accent color - single source of truth */
--accent: oklch(0.7 0.15 195); /* Cyan-500 equivalent */
--accent-hover: oklch(0.65 0.15 195);
--accent-muted: oklch(0.7 0.08 195);
```

---

### Decision 4: Shadows - Functional Only

**Decision**: Use shadows only for elevation (modals, dropdowns), not decoration

**Rationale**:
- Constitution Principle VII: "No shadows unless functionally necessary"
- Shadows indicate interactive layers, not visual flair
- Keeps interface clean and text-focused

**Alternatives Considered**:
- Card shadows (spike recommendation) - Rejected per Constitution
- No shadows at all - Modals need elevation distinction

**Shadow Scale**:
```css
/* Only for elevated elements */
--shadow-modal: 0 20px 25px -5px rgb(0 0 0 / 0.1);
--shadow-dropdown: 0 10px 15px -3px rgb(0 0 0 / 0.1);
```

---

### Decision 5: Border Radius - Single Consistent Value

**Decision**: Use 6px (0.375rem) for all rounded elements

**Rationale**:
- Constitution Principle VII: Consistency
- Single value reduces visual noise
- 6px is subtle but noticeable
- Matches existing `rounded-md` usage

**Alternatives Considered**:
- Multiple radius values (spike recommendation) - Adds complexity
- Sharp corners (0px) - Too harsh for modern UI
- Large radius (12px+) - Too playful, not professional

---

### Decision 6: Transitions - Subtle and Consistent

**Decision**: 150ms duration with ease-out timing for all state changes

**Rationale**:
- Fast enough to feel responsive
- Slow enough to be perceived
- Consistent timing reduces cognitive load
- Ease-out feels natural (fast start, slow end)

**Alternatives Considered**:
- Varied durations (spike recommendation) - Adds complexity
- No transitions - Feels jarring
- Longer durations (300ms+) - Feels sluggish

**Implementation**:
```css
--transition-base: 150ms ease-out;
```

---

### Decision 7: Focus States - High Visibility

**Decision**: 2px solid accent color outline with 2px offset

**Rationale**:
- WCAG 2.2 AA requires visible focus indicators
- Offset prevents overlap with element borders
- Accent color maintains visual consistency

**Implementation**:
```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

---

### Decision 8: Reduced Motion Support

**Decision**: Respect `prefers-reduced-motion` media query

**Rationale**:
- Accessibility requirement
- Some users experience motion sickness
- Easy to implement with CSS

**Implementation**:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Rejected Recommendations from Spike

The following spike recommendations are **rejected** to comply with Constitution Principle VII:

| Recommendation | Reason for Rejection |
|----------------|---------------------|
| Card shadows (`shadow-sm`) | Constitution: "No shadows unless functionally necessary" |
| Card hover lift (`-translate-y-0.5`) | Decorative, not functional |
| Progress bar glow effect | Decorative, adds visual noise |
| Gradient backgrounds | Constitution: "No gradients" |
| Multiple border radius values | Constitution: "Consistency" |
| Varied animation timings | Adds complexity without benefit |

---

## Implementation Priority

Based on spec user stories and spike research:

### Phase 1: Foundation (US1 - Kanban Board)
1. Add Inter font to layout.tsx
2. Define design tokens in globals.css
3. Update kanban-board.tsx card styling
4. Update column header styling
5. Standardize spacing

### Phase 2: Modal (US2 - Feature Detail)
6. Update feature-detail.tsx typography
7. Refine split-view divider
8. Consistent content viewer styling

### Phase 3: Components (US3 - Consistency)
9. Audit and update button styles
10. Standardize input focus states
11. Consistent hover states

### Phase 4: Home (US4 - First Impression)
12. Update project card styling
13. Refine empty state
14. Polish page layout

---

## Success Metrics

From spec, validated against spike research:

| Metric | Target | Validation Method |
|--------|--------|-------------------|
| Primary action identification | < 2 seconds | User testing |
| Professional rating | 90%+ | Survey |
| Accessibility violations | 0 | Lighthouse, axe |
| Visual consistency | 95%+ | Component audit |
| Responsive appearance | All sizes | Manual testing |

---

## References

1. [Spike Research](../../agent-includes/spikes/260112-simple-professional-interface-design.md)
2. [Constitution - Principle VII](../../.specify/memory/constitution.md)
3. [Inter Font](https://rsms.me/inter/)
4. [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
