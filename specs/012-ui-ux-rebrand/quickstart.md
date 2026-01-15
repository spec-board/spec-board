# Quickstart: UI/UX Rebrand Validation

**Feature**: 012-ui-ux-rebrand
**Purpose**: Validate that the UI/UX rebrand achieves "simple but professional" appearance

## Prerequisites

```bash
# Ensure development server is running
pnpm dev
```

## Validation Checklist

### 1. Typography Validation

**Test**: Verify Inter font is loaded and applied

```bash
# Open browser DevTools → Elements → Computed Styles
# Check font-family on body element
```

**Expected**: `font-family: Inter, -apple-system, BlinkMacSystemFont, ...`

**Manual Check**:
- [ ] Text appears crisp and professional
- [ ] Font weights are consistent (400 for body, 500/600 for headings)
- [ ] Line heights provide comfortable reading

---

### 2. Spacing Consistency

**Test**: Verify 8pt grid alignment

**Manual Check**:
- [ ] Card padding is consistent (16px)
- [ ] Column gaps are uniform (24px)
- [ ] Section spacing is generous (32px)
- [ ] No cramped layouts on any screen

---

### 3. Color Palette

**Test**: Verify neutral palette with single accent

**Manual Check**:
- [ ] Background uses neutral grays only
- [ ] Accent color (cyan) appears only on:
  - Primary action buttons
  - Links
  - Focus rings
  - Active states
- [ ] No decorative colors or gradients
- [ ] Dark mode maintains same color discipline

---

### 4. Kanban Board (User Story 1)

**URL**: `http://localhost:3000/projects/{any-project}`

**Manual Check**:
- [ ] Column headers have clear visual hierarchy
- [ ] Feature cards are clean (no decorative shadows)
- [ ] Progress bars are visible and clear
- [ ] Spacing between cards is consistent
- [ ] Hover states are subtle (color change only)

---

### 5. Feature Detail Modal (User Story 2)

**Action**: Click any feature card to open modal

**Manual Check**:
- [ ] Typography is readable (adequate line height)
- [ ] Content sections have consistent styling
- [ ] Split-view divider is subtle
- [ ] Tab navigation is clear
- [ ] No visual clutter

---

### 6. Component Consistency (User Story 3)

**Test**: Compare components across pages

**Manual Check**:
- [ ] All primary buttons use same accent color
- [ ] All inputs have consistent focus states
- [ ] Hover transitions are uniform (150ms)
- [ ] Border radius is consistent (6px)

---

### 7. Home Page (User Story 4)

**URL**: `http://localhost:3000`

**Manual Check**:
- [ ] Project cards are clean and scannable
- [ ] Empty state (if applicable) is helpful
- [ ] "Browse" button is visible but not dominant
- [ ] Layout has generous whitespace

---

### 8. Accessibility Validation

**Test**: Run Lighthouse accessibility audit

```bash
# In Chrome DevTools → Lighthouse → Accessibility
# Run audit on each main page
```

**Expected**: 100% accessibility score

**Manual Check**:
- [ ] All interactive elements have visible focus rings
- [ ] Focus ring uses accent color with 2px offset
- [ ] Keyboard navigation works throughout
- [ ] Color contrast meets WCAG 2.2 AA (4.5:1)

---

### 9. Reduced Motion

**Test**: Enable reduced motion preference

```bash
# macOS: System Preferences → Accessibility → Display → Reduce motion
# Or in DevTools: Rendering → Emulate CSS media feature prefers-reduced-motion
```

**Manual Check**:
- [ ] Animations are disabled or minimal
- [ ] Interface remains fully functional

---

### 10. Responsive Design

**Test**: Check at various breakpoints

| Breakpoint | Width | Check |
|------------|-------|-------|
| Mobile | 320px | Layout functional |
| Tablet | 768px | Columns adjust |
| Desktop | 1280px | Full layout |
| Wide | 2560px | No stretching |

**Manual Check**:
- [ ] No horizontal scrolling on mobile
- [ ] Text remains readable at all sizes
- [ ] Touch targets are adequate (44x44px minimum)

---

## Automated Tests

```bash
# Run existing tests to ensure no regressions
pnpm test

# Run type check
pnpm tsc --noEmit

# Run linter
pnpm lint
```

**Expected**: All tests pass, no type errors, no lint errors

---

## Success Criteria Validation

| Criterion | Target | How to Validate |
|-----------|--------|-----------------|
| SC-001: Primary action identification | < 2 sec | User testing |
| SC-002: Professional rating | 90%+ | Survey |
| SC-003: Accessibility violations | 0 | Lighthouse |
| SC-004: Visual consistency | 95%+ | Component audit |
| SC-005: Task completion | No confusion | User testing |
| SC-006: Responsive appearance | All sizes | Manual testing |

---

## Common Issues & Fixes

### Font not loading
- Check `layout.tsx` for Inter import
- Verify `--font-inter` CSS variable is applied

### Inconsistent spacing
- Check for hardcoded pixel values
- Replace with spacing scale tokens

### Focus ring not visible
- Check `:focus-visible` styles in globals.css
- Verify outline-offset is set

### Dark mode issues
- Check CSS variables have dark mode variants
- Test with `prefers-color-scheme: dark`
