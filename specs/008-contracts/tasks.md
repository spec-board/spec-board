# Tasks: Enhanced Contracts Viewer

**Input**: Design documents from `/specs/008-contracts/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: Not explicitly requested - test tasks omitted.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root (Next.js App Router)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and add shared types

- [x] T001 Install prism-react-renderer dependency via `pnpm add prism-react-renderer`
- [x] T002 [P] Add ContractMetadata interface to src/types/index.ts
- [x] T003 [P] Add ContractSection interface to src/types/index.ts
- [x] T004 [P] Add CodeBlock interface to src/types/index.ts
- [x] T005 [P] Add ParsedContract interface to src/types/index.ts
- [x] T006 [P] Add ContractType type to src/types/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utilities that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Create contract-parser.ts file at src/lib/markdown/contract-parser.ts with parseContractMetadata function
- [x] T008 Add parseContractSections function to src/lib/markdown/contract-parser.ts
- [x] T009 Add inferContractType function to src/lib/markdown/contract-parser.ts
- [x] T010 Add copyToClipboard utility function to src/lib/utils.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - View Contract Files with Syntax Highlighting (Priority: P1) 🎯 MVP

**Goal**: Display TypeScript/code blocks with proper syntax highlighting using prism-react-renderer

**Independent Test**: Open a feature with contracts, verify code blocks display with syntax highlighting (keywords, types, strings in different colors). Test in both light and dark modes.

### Implementation for User Story 1

- [x] T011 [US1] Create CodeBlock component at src/components/code-block.tsx with prism-react-renderer integration
- [x] T012 [US1] Add theme detection logic to CodeBlock (vsLight for light mode, vsDark for dark mode)
- [x] T013 [US1] Integrate CodeBlock into contracts-viewer.tsx replacing raw code block rendering
- [x] T014 [US1] Add language detection from fenced code block syntax in contract-parser.ts
- [x] T015 [US1] Handle edge case: contracts without code blocks (display markdown normally)
- [x] T016 [US1] Handle edge case: malformed code blocks (display as plain text)

**Checkpoint**: Code blocks now display with syntax highlighting in both themes

---

## Phase 4: User Story 2 - Parse and Display Contract Metadata (Priority: P1)

**Goal**: Extract and display contract metadata (feature, date, type, endpoint) in a structured header

**Independent Test**: View a contract with YAML-style metadata, verify metadata fields appear in structured header above content. Verify type badge displays correctly.

### Implementation for User Story 2

- [x] T017 [US2] Create ContractMetadataHeader component at src/components/contract-metadata-header.tsx
- [x] T018 [US2] Add contract type badge rendering (API, Component, Unknown) to ContractMetadataHeader
- [x] T019 [US2] Integrate ContractMetadataHeader into contracts-viewer.tsx
- [x] T020 [US2] Handle missing optional metadata fields gracefully (only show present fields)
- [x] T021 [US2] Add endpoint/location display prominently in metadata header

**Checkpoint**: Contract metadata displays in structured header with type badges

---

## Phase 5: User Story 3 - Navigate Contract Sections (Priority: P2)

**Goal**: Provide section navigation for contracts with multiple H2/H3 sections

**Independent Test**: Open a contract with multiple sections, verify mini table of contents appears. Click section links and verify view scrolls to that section.

### Implementation for User Story 3

- [x] T022 [US3] Create ContractSectionNav component at src/components/contract-section-nav.tsx
- [x] T023 [US3] Add scroll-to-section functionality using anchor IDs
- [x] T024 [US3] Integrate ContractSectionNav into contracts-viewer.tsx
- [x] T025 [US3] Hide section navigation when fewer than 3 sections
- [x] T026 [US3] Add anchor IDs to rendered section headings in contract content

**Checkpoint**: Section navigation works for long contracts

---

## Phase 6: User Story 4 - Copy Code Snippets (Priority: P2)

**Goal**: One-click copy functionality for code blocks with visual feedback

**Independent Test**: Hover over a code block, verify copy button appears. Click copy, verify "Copied!" confirmation displays and code is in clipboard.

### Implementation for User Story 4

- [x] T027 [US4] Add copy button to CodeBlock component (appears on hover)
- [x] T028 [US4] Implement copy state management (idle → copying → copied → idle after 2s)
- [x] T029 [US4] Add "Copied!" visual confirmation with 2-second timeout
- [x] T030 [US4] Add aria-label for copy button accessibility ("Copy code to clipboard")
- [x] T031 [US4] Add aria-live="polite" region for copy confirmation announcement

**Checkpoint**: Copy functionality works with visual and accessible feedback

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final integration and accessibility improvements

- [x] T032 [P] Verify DOMPurify sanitization is applied to all rendered contract content
- [x] T033 [P] Add aria-expanded attribute to expand/collapse toggle in contracts-viewer.tsx
- [x] T034 [P] Ensure keyboard navigation works for copy button (Enter/Space activation)
- [x] T035 Run quickstart.md verification checklist
- [x] T036 Verify existing expand/collapse behavior is preserved

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 and US2 are both P1 and can proceed in parallel
  - US3 and US4 are both P2 and can proceed in parallel (after P1 if desired)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 3 (P2)**: Can start after Foundational - Independent of US1/US2
- **User Story 4 (P2)**: Can start after Foundational - Builds on CodeBlock from US1

### Within Each User Story

- Core component creation before integration
- Edge case handling after main implementation
- Accessibility after functionality

### Parallel Opportunities

**Phase 1 (Setup)**:
```bash
# All type additions can run in parallel:
Task: T002 "Add ContractMetadata interface"
Task: T003 "Add ContractSection interface"
Task: T004 "Add CodeBlock interface"
Task: T005 "Add ParsedContract interface"
Task: T006 "Add ContractType type"
```

**Phase 3-4 (P1 Stories)**:
```bash
# US1 and US2 can run in parallel after Foundational:
Task: T011-T016 "User Story 1 - Syntax Highlighting"
Task: T017-T021 "User Story 2 - Metadata Display"
```

**Phase 5-6 (P2 Stories)**:
```bash
# US3 and US4 can run in parallel:
Task: T022-T026 "User Story 3 - Section Navigation"
Task: T027-T031 "User Story 4 - Copy Functionality"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup (install dependency, add types)
2. Complete Phase 2: Foundational (parser utilities)
3. Complete Phase 3: User Story 1 (syntax highlighting)
4. Complete Phase 4: User Story 2 (metadata display)
5. **STOP and VALIDATE**: Test syntax highlighting and metadata independently
6. Deploy/demo if ready - contracts are now readable with highlighting and metadata

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Syntax Highlighting) → Test → Deploy (MVP!)
3. Add US2 (Metadata Display) → Test → Deploy
4. Add US3 (Section Navigation) → Test → Deploy
5. Add US4 (Copy Functionality) → Test → Deploy
6. Polish phase → Final release

### Suggested MVP Scope

**MVP = Phase 1 + Phase 2 + Phase 3 (User Story 1)**

This delivers:
- Syntax-highlighted code blocks
- Theme-aware highlighting (light/dark)
- Immediate readability improvement

Total MVP tasks: 16 tasks (T001-T016)

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 36 |
| **Setup Tasks** | 6 |
| **Foundational Tasks** | 4 |
| **User Story 1 Tasks** | 6 |
| **User Story 2 Tasks** | 5 |
| **User Story 3 Tasks** | 5 |
| **User Story 4 Tasks** | 5 |
| **Polish Tasks** | 5 |
| **Parallel Opportunities** | 12 tasks marked [P] or parallelizable within phases |
| **MVP Scope** | 16 tasks (Phases 1-3) |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Key files: `src/components/code-block.tsx`, `src/lib/markdown/contract-parser.ts`, `src/components/contracts-viewer.tsx`
