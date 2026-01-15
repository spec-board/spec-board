# Implementation Tasks: UI/UX Rebrand - Simple but Professional

**Feature Branch**: `012-ui-ux-rebrand`
**Created**: 2026-01-12
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Research**: [research.md](./research.md)

---

## Phase 1: Foundation Setup

### Design Tokens & Typography

- [ ] T001 [US1] Add Inter font import via next/font/google in `src/app/layout.tsx`
- [ ] T002 [US1] Define `--font-inter` CSS variable and apply to body in `src/app/globals.css`
- [ ] T003 [US1] Add typography scale CSS variables (text-xs through text-2xl) in `src/app/globals.css`
- [ ] T004 [US1] Add line-height tokens (leading-tight, leading-normal, leading-relaxed) in `src/app/globals.css`

### Spacing System

- [ ] T005 [US1] Define 8pt spacing scale CSS variables (space-1 through space-12) in `src/app/globals.css`
- [ ] T006 [US1] Document spacing usage guidelines in code comments

### Color Refinements

- [ ] T007 [US1] Add `--accent` color token using cyan (#06b6d4 / oklch) in `src/app/globals.css`
- [ ] T008 [US1] Add `--accent-hover` and `--accent-muted` variants in `src/app/globals.css`
- [ ] T009 [US1] Add `--card-hover` and `--border-hover` tokens for interactive states in `src/app/globals.css`

### Transitions & Focus States

- [ ] T010 [US3] Define `--transition-base` (150ms ease-out) CSS variable in `src/app/globals.css`
- [ ] T011 [US3] Add global `:focus-visible` styles with 2px accent outline and 2px offset in `src/app/globals.css`
- [ ] T012 [US3] Add `@media (prefers-reduced-motion: reduce)` styles in `src/app/globals.css`

### Border Radius

- [ ] T013 [US3] Define `--radius` token (6px / 0.375rem) for consistent border radius in `src/app/globals.css`

---

## Phase 2: Kanban Board (US1 - Clean Visual Hierarchy)

### Column Headers

- [ ] T014 [US1] Update column header padding to use spacing tokens in `src/components/kanban-board.tsx`
- [ ] T015 [US1] Apply `font-semibold`, `uppercase`, `tracking-wide` to column header text in `src/components/kanban-board.tsx`
- [ ] T016 [US1] Style feature count badge with background and rounded-full in `src/components/kanban-board.tsx`

### Feature Cards

- [ ] T017 [US1] Update card padding to use `--space-4` (16px) in `src/components/kanban-board.tsx`
- [ ] T018 [US1] Apply consistent `rounded-md` (6px) border radius to cards in `src/components/kanban-board.tsx`
- [ ] T019 [US1] Add hover state with `--card-hover` background color in `src/components/kanban-board.tsx`
- [ ] T020 [US1] Ensure card transitions use `--transition-base` timing in `src/components/kanban-board.tsx`

### Progress Bars

- [ ] T021 [US1] Increase progress bar height from h-1 to h-1.5 for better visibility in `src/components/kanban-board.tsx`
- [ ] T022 [US1] Update progress bar transition to 300ms ease-out in `src/components/kanban-board.tsx`

### Column Layout

- [ ] T023 [US1] Update column gaps to use `--space-6` (24px) in `src/components/kanban-board.tsx`
- [ ] T024 [US1] Update card gaps to use `--space-3` (12px) in `src/components/kanban-board.tsx`

---

## Phase 3: Feature Detail Modal (US2 - Professional Modal)

### Modal Container

- [ ] T025 [US2] Apply Inter font and typography scale to modal content in `src/components/feature-detail/feature-detail.tsx`
- [ ] T026 [US2] Update modal padding to use spacing tokens in `src/components/feature-detail/feature-detail.tsx`

### Content Typography - Core Viewers

- [ ] T027 [US2] Set comfortable line-height (1.5-1.75) for spec content in `src/components/spec-viewer.tsx`
- [ ] T028 [US2] Apply typography scale to headings in spec content in `src/components/spec-viewer.tsx`
- [ ] T029 [US2] Update plan viewer typography for consistency in `src/components/plan-viewer.tsx`
- [ ] T030 [US2] Update tasks viewer typography for consistency in `src/components/tasks-viewer.tsx`

### Content Typography - Additional Viewers

- [ ] T031 [P] [US2] Update research viewer typography and spacing in `src/components/research-viewer.tsx`
- [ ] T032 [P] [US2] Update quickstart viewer typography and spacing in `src/components/quickstart-viewer.tsx`
- [ ] T033 [P] [US2] Update data-model viewer typography and spacing in `src/components/data-model-viewer.tsx`
- [ ] T034 [P] [US2] Update contracts viewer typography and spacing in `src/components/contracts-viewer.tsx`
- [ ] T035 [P] [US2] Update checklist viewer typography and spacing in `src/components/checklist-viewer.tsx`
- [ ] T036 [P] [US2] Update analysis viewer typography and spacing in `src/components/analysis-viewer.tsx`
- [ ] T037 [P] [US2] Update constitution viewer typography and spacing in `src/components/constitution-viewer.tsx`
- [ ] T038 [P] [US2] Update changelog viewer typography and spacing in `src/components/changelog-viewer.tsx`
- [ ] T039 [P] [US2] Update readme viewer typography and spacing in `src/components/readme-viewer.tsx`

### Split View

- [ ] T040 [US2] Style split-view divider to be subtle (1px, muted color) in `src/components/feature-detail/split-view.tsx`
- [ ] T041 [US2] Ensure equal visual weight for both panes in `src/components/feature-detail/split-view.tsx`

### Section Navigation

- [ ] T042 [US2] Update section nav item padding and spacing in `src/components/feature-detail/section-nav.tsx`
- [ ] T043 [US2] Apply consistent hover states to nav items in `src/components/feature-detail/section-nav.tsx`
- [ ] T044 [US2] Style active section indicator with accent color in `src/components/feature-detail/section-nav.tsx`

### Supporting Components

- [ ] T045 [P] [US2] Update code-block styling for consistent typography in `src/components/code-block.tsx`
- [ ] T046 [P] [US2] Update markdown-renderer base styles in `src/components/markdown-renderer.tsx`
- [ ] T047 [P] [US2] Update priority-badge styling for consistency in `src/components/priority-badge.tsx`
- [ ] T048 [P] [US2] Update contract-metadata-header styling in `src/components/contract-metadata-header.tsx`
- [ ] T049 [P] [US2] Update contract-section-nav styling in `src/components/contract-section-nav.tsx`

---

## Phase 4: Component Consistency (US3 - Unified Styling)

### Buttons

- [ ] T050 [US3] Audit all primary buttons for consistent accent color usage across components
- [ ] T051 [US3] Ensure all buttons use consistent padding (space-2 vertical, space-4 horizontal)
- [ ] T052 [US3] Apply consistent border-radius (6px) to all buttons
- [ ] T053 [US3] Verify hover states use `--accent-hover` for primary buttons

### Inputs & Form Elements

- [ ] T054 [US3] Update input focus states to use accent color outline in `src/app/globals.css`
- [ ] T055 [US3] Ensure consistent input padding and border-radius

### Interactive Elements

- [ ] T056 [US3] Verify all hover transitions use 150ms ease-out timing
- [ ] T057 [US3] Ensure all clickable elements have visible focus rings
- [ ] T058 [US3] Test keyboard navigation focus visibility across all interactive elements

### Modals & Dialogs

- [ ] T059 [P] [US3] Update open-project-modal styling for consistency in `src/components/open-project-modal.tsx`
- [ ] T060 [P] [US3] Update analysis-save-modal styling for consistency in `src/components/analysis-save-modal.tsx`
- [ ] T061 [P] [US3] Update project-selector styling for consistency in `src/components/project-selector.tsx`

### Panels & Info Components

- [ ] T062 [P] [US3] Update constitution-panel styling in `src/components/constitution-panel.tsx`
- [ ] T063 [P] [US3] Update clarity-history styling in `src/components/clarity-history.tsx`
- [ ] T064 [P] [US3] Update project-info-bubble styling in `src/components/project-info-bubble.tsx`

---

## Phase 5: Home Page (US4 - Refined First Impression)

### Project Cards

- [ ] T065 [US4] Update project card padding to use spacing tokens in `src/components/project-card.tsx`
- [ ] T066 [US4] Apply consistent typography scale to project names in `src/components/project-card.tsx`
- [ ] T067 [US4] Style project metadata (last opened, progress) with muted text in `src/components/project-card.tsx`
- [ ] T068 [US4] Add hover state with subtle background change in `src/components/project-card.tsx`

### Page Layout

- [ ] T069 [US4] Update home page section spacing to use `--space-8` (32px) in `src/app/page.tsx`
- [ ] T070 [US4] Ensure generous whitespace around content areas in `src/app/page.tsx`

### Empty State

- [ ] T071 [US4] Style empty state message with helpful, balanced typography in `src/app/page.tsx`

### Browse Action

- [ ] T072 [US4] Style "Browse" button as secondary action (visible but not dominant) in `src/app/page.tsx`

### Recent Projects List

- [ ] T073 [P] [US4] Update recent-projects-list styling for consistency in `src/components/recent-projects-list.tsx`

---

## Phase 6: Dark Mode Parity

- [ ] T074 Verify all new CSS variables have dark mode variants in `src/app/globals.css`
- [ ] T075 Test accent color contrast in dark mode (WCAG AA compliance)
- [ ] T076 Verify hover states work correctly in dark mode
- [ ] T077 Test focus ring visibility in dark mode

---

## Phase 7: Accessibility & Polish

### Accessibility Validation

- [ ] T078 Run Lighthouse accessibility audit on home page
- [ ] T079 Run Lighthouse accessibility audit on project board page
- [ ] T080 Run Lighthouse accessibility audit on feature detail modal
- [ ] T081 Fix any accessibility violations found (target: 0 violations)

### Contrast Validation

- [ ] T082 Verify all text meets WCAG 2.2 AA contrast (4.5:1 for normal, 3:1 for large)
- [ ] T083 Verify focus rings have sufficient contrast against backgrounds

### Reduced Motion

- [ ] T084 Test interface with `prefers-reduced-motion: reduce` enabled
- [ ] T085 Verify all animations respect reduced motion preference

### Responsive Testing

- [ ] T086 Test layout at 320px width (mobile)
- [ ] T087 Test layout at 768px width (tablet)
- [ ] T088 Test layout at 1280px width (desktop)
- [ ] T089 Test layout at 2560px width (wide)
- [ ] T090 Verify no horizontal scrolling on mobile
- [ ] T091 Verify touch targets are minimum 44x44px

---

## Phase 8: Final Validation

### Visual Consistency Audit

- [ ] T092 Compare button styling across all pages for consistency
- [ ] T093 Compare card styling across all pages for consistency
- [ ] T094 Compare spacing and typography across all pages for consistency

### Automated Tests

- [ ] T095 Run `pnpm test` to ensure no regressions
- [ ] T096 Run `pnpm tsc --noEmit` to verify no type errors
- [ ] T097 Run `pnpm lint` to verify no lint errors

### Manual Testing

- [ ] T098 Complete quickstart.md validation checklist
- [ ] T099 Verify primary action identification < 2 seconds on each screen

---

## Summary

| Phase | Tasks | Focus Area |
|-------|-------|------------|
| 1 | T001-T013 | Foundation (tokens, typography, spacing) |
| 2 | T014-T024 | Kanban Board (US1) |
| 3 | T025-T049 | Feature Detail Modal (US2) - All viewers & supporting components |
| 4 | T050-T064 | Component Consistency (US3) - Buttons, inputs, modals, panels |
| 5 | T065-T073 | Home Page (US4) |
| 6 | T074-T077 | Dark Mode Parity |
| 7 | T078-T091 | Accessibility & Polish |
| 8 | T092-T099 | Final Validation |

**Total Tasks**: 99
**Estimated Effort**: 12-16 hours (visual refinement, not structural changes)

---

## Parallel Execution Opportunities

The following tasks are marked with `[P]` and can be executed in parallel within their phase:

### Phase 3 (US2) - Viewer Components (T031-T039, T045-T049)
All viewer components can be updated in parallel as they are independent files.

### Phase 4 (US3) - Modals & Panels (T059-T064)
Modal and panel components can be updated in parallel.

### Phase 5 (US4) - Recent Projects (T073)
Can run in parallel with other US4 tasks.

---

## Dependencies

```
Phase 1 (Foundation) ──┬──> Phase 2 (US1 - Kanban)
                       ├──> Phase 3 (US2 - Modal)
                       ├──> Phase 4 (US3 - Components)
                       └──> Phase 5 (US4 - Home)
                                    │
                                    v
                            Phase 6 (Dark Mode)
                                    │
                                    v
                            Phase 7 (Accessibility)
                                    │
                                    v
                            Phase 8 (Validation)
```

**Note**: Phases 2-5 can be executed in parallel after Phase 1 is complete, as they target different user stories and components.
