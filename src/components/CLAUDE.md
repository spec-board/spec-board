# Components Directory

## Purpose
React UI components for the SpecBoard dashboard.

## Overview
This directory contains all React components used throughout the application. Components are organized by feature area, with subdirectories for complex feature groups. All components use Tailwind CSS with CSS variables for styling and are client-side (`'use client'`) for interactivity.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `feature-detail/` | Legacy feature detail modal (deprecated) |
| `feature-detail-v2/` | **Jira-like feature detail modal** (CURRENT - use this) |
| `cloud/` | Cloud sync UI components |
| `sync/` | Sync UI components |
| `drivers/` | E2B code execution UI |

## Key Files

| File | Purpose |
|------|---------|
| `kanban-board.tsx` | 3-column Kanban board |
| `header.tsx` | App header with navigation |
| `project-list.tsx` | Project list from database |
| `recent-projects-list.tsx` | Recent projects with metadata |
| `open-project-modal.tsx` | Project search modal |
| `create-project-modal.tsx` | Create new project modal |
| `delete-project-modal.tsx` | Delete project modal |
| `spec-workflow-wizard.tsx` | AI spec workflow wizard |
| `prd-to-user-stories-modal.tsx` | PRD to user stories converter |

## Viewer Components

| Component | Purpose |
|-----------|---------|
| `markdown-renderer.tsx` | Safe markdown-to-HTML rendering |
| `readme-viewer.tsx` | Beautified README display |
| `changelog-viewer.tsx` | Version timeline |
| `spec-viewer.tsx` | Spec.md content with user stories |
| `plan-viewer.tsx` | Plan.md content |
| `task-group.tsx` | Task list grouped by user story |
| `research-viewer.tsx` | Research notes display |
| `quickstart-viewer.tsx` | Quickstart guide display |
| `data-model-viewer.tsx` | Data model documentation |
| `contracts-viewer.tsx` | API contracts display |
| `analysis-viewer.tsx` | Spec alignment analysis |
| `checklist-viewer.tsx` | Checklist items display |
| `constitution-viewer.tsx` | Project constitution display |
| `constitution-editor.tsx` | Constitution editing |

## UI Components

| Component | Purpose |
|-----------|---------|
| `theme-button.tsx` | Theme toggle button |
| `theme-toggle.tsx` | Theme switcher |
| `tooltip.tsx` | Reusable tooltip |
| `priority-badge.tsx` | Priority badge (P1/P2/P3) |
| `shortcuts-provider.tsx` | Keyboard shortcuts provider |
| `shortcut-help-overlay.tsx` | Shortcuts help modal |
| `confirm-dialog.tsx` | Confirmation dialog |
| `project-info-bubble.tsx` | Project info tooltip |

## Component Inventory

### Home Page Components
| Component | Purpose |
|-----------|---------|
| `ProjectList` | List all projects from database |
| `RecentProjectsList` | Display recent projects with metadata |
| `OpenProjectModal` | Modal for searching/opening projects |
| `CreateProjectModal` | Create new project |
| `DeleteProjectModal` | Delete project with confirmation |

### Project Page Components
| Component | Purpose |
|-----------|---------|
| `KanbanBoard` | Main feature pipeline view |
| `Header` | App header with navigation |
| `ConstitutionPanel` | Project principles display |

### Feature Detail V2 (CURRENT)
| Component | Purpose |
|-----------|---------|
| `FeatureDetailV2` | Jira-like feature modal |
| `WorkflowDiagram` | Visual workflow display |
| `SuggestedCommandCard` | AI command suggestions |

### Content Viewers
| Component | Purpose |
|-----------|---------|
| `MarkdownRenderer` | Safe HTML from markdown |
| `SpecViewer` | Spec.md with user stories |
| `PlanViewer` | Plan.md content |
| `TaskGroup` | Tasks grouped by user story |
| `ResearchViewer` | Research notes |
| `QuickstartViewer` | Quickstart guide |
| `DataModelViewer` | Data model docs |
| `ContractsViewer` | API contracts |
| `AnalysisViewer` | Spec alignment |
| `ChecklistViewer` | Checklist items |
| `ConstitutionViewer` | Constitution display |
| `ClarityHistoryPanel` | Q&A history |

### Cloud & Sync
| Component | Purpose |
|-----------|---------|
| `ActivityFeed` | Cloud activity timeline |
| `TeamMembers` | Team member management |
| `RoleSelector` | Role assignment |

### Drivers (Code Execution)
| Component | Purpose |
|-----------|---------|
| `ExecutionPanel` | Code execution UI |
| `SessionStatus` | E2B session status |

## Patterns & Conventions

- **Styling**: Tailwind CSS with `cn()` utility for conditional classes
- **CSS Variables**: Use `var(--foreground)`, `var(--border)`, etc. for theming
- **Icons**: Lucide React icons (`lucide-react`)
- **Charts**: Recharts for data visualization
- **Sanitization**: DOMPurify for markdown HTML output
- **Modals**: Use `'use client'` and proper focus management

## Dependencies

- **Internal**: `@/lib/utils`, `@/types`, `@/lib/store`, `@/lib/settings-store`
- **External**: react, lucide-react, recharts, dompurify, remark, remark-html, sonner

## Common Tasks

- **Add new component**: Create `[name].tsx` with `'use client'` directive
- **Add icon**: Import from `lucide-react`
- **Style conditionally**: Use `cn(baseClass, condition && 'conditional-class')`
- **Render markdown**: Use `MarkdownRenderer` component
- **Show toast**: Use `sonner` (toast())

## Important Notes

- **ALWAYS use FeatureDetailV2** for feature detail modals (not legacy feature-detail/)
- All components use `'use client'` for React hooks
- CSS variables enable automatic dark mode support
- `cn()` from `@/lib/utils` merges Tailwind classes safely
- Use `sonner` for toast notifications
