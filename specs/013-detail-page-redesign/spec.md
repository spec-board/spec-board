# Feature Specification: Detail Page Redesign

**Feature Branch**: `013-detail-page-redesign`
**Created**: 2026-01-13
**Status**: Draft
**Input**: User description: "redesign the detail page to new design (like kanband board) also. such as http://localhost:3002/projects/spec-board/features/012-ui-ux-rebrand"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visual Consistency with Kanban Board (Priority: P1)

As a developer navigating between the Kanban board and feature detail pages, I want both views to use the same visual design language (status dots, colors, spacing) so that the application feels cohesive and professional.

**Why this priority**: This is the core requirement - achieving visual consistency across the application. Without this, the redesign fails its primary objective.

**Independent Test**: Can be fully tested by opening a feature from the Kanban board and verifying that status indicators, colors, and visual hierarchy match the board design. Delivers immediate value by creating a unified user experience.

**Acceptance Scenarios**:

1. **Given** I'm viewing the Kanban board with status dots (blue/yellow/green), **When** I click to open a feature detail page, **Then** the detail page uses the same status dot colors and styling
2. **Given** I'm viewing a feature's navigation sidebar, **When** I look at section status indicators, **Then** I see status dots (8px circles) instead of progress bars
3. **Given** I'm viewing phase headers in the sidebar, **When** I check their status indicators, **Then** they show aggregate status dots matching the Kanban board style

---

### User Story 2 - Progressive Disclosure for Section Details (Priority: P2)

As a developer reviewing feature documentation, I want detailed metrics (task counts, percentages) to be hidden by default and revealed on hover, so that I can focus on the content without visual clutter.

**Why this priority**: Reduces cognitive load and makes the interface cleaner. This is secondary to visual consistency but critical for the simplified design goal.

**Independent Test**: Can be tested by hovering over navigation items and verifying that popovers appear with detailed information. Delivers value by decluttering the interface while keeping information accessible.

**Acceptance Scenarios**:

1. **Given** I'm viewing the feature detail sidebar, **When** I hover over a section navigation item, **Then** a popover appears after 400ms showing detailed metrics (completion %, task counts)
2. **Given** the popover is visible, **When** I move my mouse away, **Then** the popover disappears after 150ms delay
3. **Given** I'm viewing the sidebar, **When** I look at navigation items without hovering, **Then** I only see section icon, name, and status dot (no inline metrics)

---

### User Story 3 - Simplified Navigation Sidebar (Priority: P3)

As a developer working through feature sections, I want a clean, uncluttered navigation sidebar that shows only essential information, so that I can quickly scan and navigate without distraction.

**Why this priority**: Completes the visual simplification. Less critical than P1/P2 but important for the overall clean aesthetic.

**Independent Test**: Can be tested by examining the sidebar layout and verifying that only icon, label, and status dot are visible. Delivers value by reducing visual noise.

**Acceptance Scenarios**:

1. **Given** I'm viewing the navigation sidebar, **When** I scan the section list, **Then** each item shows only: icon (left), section name (center), status dot (right, 8px)
2. **Given** I'm viewing phase headers, **When** I look at their layout, **Then** they show phase name and aggregate status dot without inline progress bars
3. **Given** I'm viewing the Tasks section, **When** I check the navigation item, **Then** task counts are hidden (revealed only on hover)

---

### Edge Cases

- What happens when a section has no content (0% complete)? → Show blue status dot
- What happens when hovering quickly between multiple navigation items? → Popover delays prevent flickering
- What happens when the popover would extend beyond viewport edges? → Popover repositions to stay visible
- How does the system handle sections with no status data? → Show neutral/gray status dot
- What happens on mobile devices without hover capability? → Show details on tap/click instead

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST replace all progress bars in the detail page navigation with 8px circular status dots
- **FR-002**: System MUST use CSS variables for status colors: `--status-not-started` (blue), `--status-in-progress` (yellow), `--status-complete` (green)
- **FR-003**: System MUST hide detailed metrics (task counts, percentages, user story counts) from navigation items by default
- **FR-004**: System MUST reveal detailed metrics in a popover on hover with 400ms show delay and 150ms hide delay
- **FR-005**: System MUST maintain all existing functionality: split view, drag-and-drop, keyboard navigation shortcuts
- **FR-006**: System MUST calculate and display aggregate status dots for phase headers based on contained sections
- **FR-007**: System MUST ensure popovers don't disappear when moving mouse from trigger to popover content
- **FR-008**: System MUST maintain WCAG AA accessibility compliance with proper ARIA labels and keyboard navigation
- **FR-009**: System MUST apply status dot styling consistently across all navigation items and phase headers
- **FR-010**: System MUST support responsive design with appropriate behavior for desktop, tablet, and mobile viewports

### Key Entities *(include if feature involves data)*

- **SectionConfig**: Represents a navigable section with id, label, phase, status, and optional metrics (task counts, group counts)
- **StatusDot**: Visual indicator showing completion state (not-started/in-progress/complete) using color-coded 8px circles
- **SectionPopover**: Hover-triggered component displaying detailed section metrics (completion %, task counts, last modified)
- **PhaseHeader**: Navigation group header showing phase name and aggregate status of contained sections

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Detail page navigation uses status dots matching Kanban board design (verified by visual inspection)
- **SC-002**: No inline metrics visible in navigation items by default (verified by DOM inspection)
- **SC-003**: Popovers appear on hover within 400ms and display complete section metrics (verified by interaction testing)
- **SC-004**: All existing keyboard shortcuts continue to work without regression (verified by keyboard navigation testing)
- **SC-005**: Split view, drag-and-drop, and all interactive features function identically to current implementation (verified by functional testing)
- **SC-006**: Page maintains WCAG AA compliance with proper screen reader announcements (verified by accessibility audit)
- **SC-007**: Design feels visually cohesive with Kanban board when navigating between views (verified by user testing)
- **SC-008**: Popover hover behavior is smooth without flickering or premature dismissal (verified by interaction testing)
