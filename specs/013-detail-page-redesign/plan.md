# Implementation Plan: Detail Page Redesign

**Branch**: `013-detail-page-redesign` | **Date**: 2026-01-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/013-detail-page-redesign/spec.md`

## Summary

Redesign the feature detail page navigation to match the Kanban board's visual design language. Replace progress bars and inline metrics with Jira-style status dots (8px circles: blue/yellow/green). Hide detailed metrics by default and reveal them via hover popovers with 400ms show delay. Maintain all existing functionality (split view, drag-and-drop, keyboard navigation).

## Technical Context

**Language/Version**: TypeScript 5.9.x (strict mode)
**Primary Dependencies**: Next.js 16.x, React 19.x, Tailwind CSS 4.x, Lucide React
**Storage**: N/A (UI-only changes, no database modifications)
**Testing**: Vitest for unit tests, manual testing for UI interactions
**Target Platform**: Web (desktop-first, responsive)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Smooth hover interactions (<16ms frame time), no layout shifts
**Constraints**: WCAG AA accessibility compliance, existing keyboard shortcuts must work
**Scale/Scope**: ~10 component files to modify in `src/components/feature-detail/`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Visualization | ✅ PASS | UI-only changes, no modification to spec files |
| II. Type Safety (NON-NEGOTIABLE) | ✅ PASS | All new components will use strict TypeScript |
| III. Security First | ✅ PASS | No new user inputs or filesystem operations |
| IV. Accessibility | ✅ PASS | ARIA labels on popovers, keyboard navigation preserved |
| V. Clean URL Architecture | ✅ PASS | No URL changes |
| VI. Component Simplicity | ✅ PASS | New StatusDot and SectionPopover follow single responsibility |
| VII. Visual Identity | ✅ PASS | Minimal color palette (3 status colors), text-centric, no decorative elements |

**Gate Result**: ✅ ALL GATES PASS - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/013-detail-page-redesign/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (N/A - UI-only feature)
├── quickstart.md        # Phase 1 output
├── checklists/          # Quality checklists
│   └── requirements.md  # Spec quality checklist (complete)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── globals.css                    # Status color CSS variables (already defined)
└── components/
    └── feature-detail/
        ├── nav-sidebar.tsx            # MODIFY: Replace inline metrics with status dots
        ├── nav-item.tsx               # MODIFY: Simplify to icon + label + status dot
        ├── types.ts                   # MODIFY: Add StatusDot types
        ├── status-dot.tsx             # NEW: Reusable status dot component
        ├── section-popover.tsx        # NEW: Hover popover for detailed metrics
        ├── feature-detail.tsx         # MODIFY: Wire up popover state
        └── index.tsx                  # Export new components
```

**Structure Decision**: This is a frontend-only feature modifying existing components in `src/components/feature-detail/`. No new directories needed. Two new components (`status-dot.tsx`, `section-popover.tsx`) follow the existing flat structure pattern.

## Complexity Tracking

> No violations - all changes align with constitution principles.
