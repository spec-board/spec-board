# Design: Feature Details Page Redesign (v2)

**Date:** 2026-01-16
**Status:** Approved
**Author:** Brainstorming Session

---

## Summary

Redesign màn hình Feature Details theo phong cách Jira-like với focus vào:
- **Đơn giản**: Giảm cognitive load, loại bỏ visual noise
- **Tập trung**: Hierarchical view (US → Tasks) giúp thấy rõ mối quan hệ
- **Hiệu quả**: Two-panel layout tối đa hóa content space

---

## Problems Solved

| Problem | Solution |
|---------|----------|
| Quá nhiều thông tin | Hierarchical cards với collapse/expand |
| Visual design lỗi thời | Neutral/Minimal Jira-like theme |
| Navigation phức tạp | Two-panel layout với clear separation |

---

## Design Decisions

### 1. Layout: Two-Panel

```
┌────────────────────────────────┬────────────────────────────────────────┐
│     US & Tasks Panel           │         Document Panel                 │
│     (Left - 40%)               │         (Right - 60%)                  │
└────────────────────────────────┴────────────────────────────────────────┘
```

**Rationale:**
- Simpler than 3-panel, more space for content
- Clear separation between "what to do" (left) and "how to do" (right)
- Familiar pattern from Jira, Linear, etc.

### 2. US/Tasks Display: Cards with Progress Bar

```
┌──────────────────────────────────┐
│ US1: User can login with email   │
│ ████████████░░░░░░░░ 3/5         │
│                                  │
│ ☑ T001 Create login form         │
│ ☑ T002 Add validation            │
│ ☐ T003 Implement auth API        │
│ ☐ T004 Add error handling        │
│ ☐ T005 Write tests               │
└──────────────────────────────────┘
```

**Rationale:**
- Visual progress indicator helps track completion
- Card format creates clear grouping
- Checkbox inline for quick status scan

### 3. Document Selector: Dropdown

```
Document: [Spec ▼]
┌────────────────────────────────────────┐
│                                        │
│   [Document content - maximum space]   │
│                                        │
└────────────────────────────────────────┘
```

**Rationale:**
- Most compact option, maximizes content area
- Reduces visual noise compared to tab bar
- Single focus point for document selection

### 4. Task Interaction: Show Context

| Action | Behavior |
|--------|----------|
| Click task row | Scroll doc panel to relevant section, highlight |
| Click checkbox icon | Toggle task completion status |
| Click US card header | Expand/collapse task list |

**Rationale:**
- Leverages two-panel layout effectively
- Keeps cards compact (no inline expansion)
- Provides context without leaving current view

### 5. Visual Style: Neutral/Minimal (Jira-like)

| Element | Style |
|---------|-------|
| Background | White / Light gray (#f5f5f5) |
| Cards | White with subtle shadow (0 1px 3px rgba(0,0,0,0.1)) |
| Progress bar | Blue gradient (#2563eb → #3b82f6) |
| Text | Dark gray (#374151) |
| Accents | Blue (#2563eb) for interactive elements |
| Borders | Light gray (#e5e7eb) |

### 6. Responsive: Desktop-First

- **Desktop (>1024px)**: Full two-panel layout
- **Tablet (768-1024px)**: Narrower panels, same layout
- **Mobile (<768px)**: Basic view only, stacked panels (read-only acceptable)

---

## Wireframe

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Back to Board    Feature: User Authentication           [×] Close   │
├────────────────────────────────┬────────────────────────────────────────┤
│                                │  Document: [Spec ▼]                    │
│  ┌──────────────────────────┐  │  ┌────────────────────────────────────┐│
│  │ US1: User can login      │  │  │                                    ││
│  │ ████████████░░░░ 3/5     │  │  │  ## User Story 1                   ││
│  │                          │  │  │                                    ││
│  │ ☑ T001 Create login form │  │  │  As a user, I want to login with  ││
│  │ ☑ T002 Add validation    │  │  │  my email so that I can access    ││
│  │ ☐ T003 Implement API  ←──┼──┼──│  my account.                       ││
│  │ ☐ T004 Error handling    │  │  │                                    ││
│  │ ☐ T005 Write tests       │  │  │  ### Acceptance Criteria           ││
│  └──────────────────────────┘  │  │  - [ ] Valid email format          ││
│                                │  │  - [ ] Password min 8 chars        ││
│  ┌──────────────────────────┐  │  │  - [ ] Show error on failure       ││
│  │ US2: User can logout     │  │  │                                    ││
│  │ ░░░░░░░░░░░░░░░░ 0/2     │  │  └────────────────────────────────────┘│
│  │                          │  │                                        │
│  │ ☐ T006 Add logout button │  │                                        │
│  │ ☐ T007 Clear session     │  │                                        │
│  └──────────────────────────┘  │                                        │
│                                │                                        │
└────────────────────────────────┴────────────────────────────────────────┘
```

---

## Component Structure

```
FeatureDetailV2/
├── FeatureDetailModal.tsx      # Main modal container
├── UserStoryPanel.tsx          # Left panel - US cards
│   ├── UserStoryCard.tsx       # Individual US card with progress
│   └── TaskRow.tsx             # Task item with checkbox
├── DocumentPanel.tsx           # Right panel - doc viewer
│   ├── DocumentSelector.tsx    # Dropdown for doc selection
│   └── DocumentContent.tsx     # Markdown renderer
└── hooks/
    ├── useTaskContext.ts       # Handle task click → doc scroll
    └── useDocumentSync.ts      # Sync selected doc with URL
```

---

## Data Flow

```
User clicks task
    ↓
TaskRow emits onTaskClick(taskId, userStoryId)
    ↓
FeatureDetailModal updates selectedTask state
    ↓
DocumentPanel receives selectedTask
    ↓
DocumentContent scrolls to relevant section
    ↓
Highlight animation plays
```

---

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `Escape` | Close modal |
| `↑/↓` | Navigate between US cards |
| `Enter` | Expand/collapse selected US |
| `Tab` | Move focus between panels |
| `Space` | Toggle task checkbox (when focused) |

---

## Migration Notes

### From Current Design

| Current | New |
|---------|-----|
| Split view toggle | Removed - always two-panel |
| Tab bar for docs | Dropdown selector |
| Flat task list | Grouped under US cards |
| Multiple viewers | Single DocumentContent component |

### Files to Modify

- `src/components/feature-detail/` - Major refactor
- `src/components/*-viewer.tsx` - Consolidate into DocumentContent
- `src/lib/store.ts` - Update focus state for new navigation

---

## Resolved Questions

1. **Orphan tasks**: How to display tasks not linked to any US?
   - ✅ **Decision**: "Uncategorized" card at bottom
   - **Rationale**: User stories are the focus, technical tasks are secondary

2. **Empty states**: What to show when feature has no US or no tasks?
   - ✅ **Decision**: Minimal empty state ("No user stories defined. Add them to spec.md")
   - **Rationale**: Target audience is developers who know spec-kit format

3. **Progress calculation**: Should progress bar show task count or story points?
   - ✅ **Decision**: Task count (e.g., "3/5 tasks")
   - **Rationale**: KISS principle, spec-kit doesn't have story points in format

---

## Next Steps

1. [x] Create new component structure
2. [x] Implement UserStoryCard with progress bar
3. [x] Implement DocumentSelector dropdown
4. [x] Add task click → doc scroll behavior
5. [x] Update keyboard navigation
6. [x] Test with real spec-kit data
7. [ ] Polish animations and transitions
