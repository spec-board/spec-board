# Changelog

All notable changes to SpecBoard will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.0.0] - 2026-04-29

### Added
- **Mind Map Canvas** — Freeform brainstorming tool built with React Flow (@xyflow/react):
  - Create, edit, delete, and connect nodes on an infinite canvas
  - Double-click canvas to add nodes, drag from handles to connect
  - Color picker for node customization (6 preset colors)
  - Auto-save with 1.5s debounce to PostgreSQL
  - Separate Zustand store for mind map state
  - New route: `/projects/:name/mind-map`
  - New Prisma models: `MindMapNode`, `MindMapEdge`
  - Full CRUD API: GET/PUT `/api/projects/:name/mind-map`, POST/PATCH/DELETE for nodes and edges
- **Convert Mind Map to Features** — Bridge brainstorming and spec management:
  - Right-click context menu on nodes: "Convert to Feature", "Delete"
  - Toolbar button (Sparkles icon) for converting selected nodes
  - Single node → 1 feature in backlog
  - Multi-select group → 1 feature with child nodes as description
  - Visual badge (link icon) on converted nodes
  - Converted nodes cannot be converted again
- **CodeMirror Editor** — Inline markdown editing in feature detail:
  - Syntax highlighting with `@codemirror/lang-markdown`
  - Dark/light theme support via `@codemirror/theme-one-dark`
  - Edit/Preview toggle button in DocumentPanel
  - Debounced auto-save (1.5s) to database via extended PUT `/api/features/:id`
  - Feature API now accepts all content fields (specContent, planContent, tasksContent, etc.)
- **Impact Analysis** — Visual dependency graph in feature detail:
  - New "Impact" tab in DocumentPanel (always available)
  - React Flow graph showing pipeline status: Spec → Plan → Tasks → Analysis
  - Color-coded nodes: green (ok), yellow (warning), red (critical)
  - Constitution drift detection (feature vs current constitution version)
  - User story coverage check (stories without tasks)
  - Issue list with severity icons
  - Client-side computation — no AI or API calls needed
- **MCP Server** — Model Context Protocol server for AI coding agents:
  - 11 tools: `list_projects`, `get_project`, `get_feature`, `get_spec`, `get_plan`, `get_tasks`, `get_constitution`, `create_feature`, `update_feature_content`, `update_task_status`, `get_context`
  - Stdio-based transport via `@modelcontextprotocol/sdk`
  - Direct Prisma DB access (no HTTP overhead)
  - Run with: `pnpm mcp`
- **CLI** — Terminal interface for spec management:
  - `specboard list` — List all projects
  - `specboard get <project> [feature] [type]` — Get project, feature, or content
  - `specboard context <project> <feature>` — Structured context for AI agents
  - `specboard create <project> <name> <desc>` — Create feature in backlog
  - `specboard constitution <project>` — Get project constitution
  - Built with Commander, run with: `pnpm cli`
- **Feature List** — Simple row-based feature list replacing Kanban board:
  - Stage indicator dot with color coding
  - Stage label badge
  - Task progress percentage
  - "Add feature" button with CreateFeatureModal integration

### Changed
- **Project Focus** — Stripped to core: spec writing, mind map, AI pipeline, impact analysis
- **Settings Modal** — Rewritten from 1100 to 167 lines:
  - Removed OAuth flows (Codex PKCE, Qwen/Kimi Device Code)
  - Removed README/Changelog viewers
  - Kept: AI provider management, keyboard shortcuts, about section
- **Prisma Schema** — Cleaned up, removed 252 lines of unused models
- **AI Module** — Removed mock export from index
- **Next.js Config** — Added `turbopack: {}` for Next.js 16 compatibility, removed webpack cache hack
- **README** — Complete rewrite reflecting new project focus with 4 new screenshots

### Removed
- **Cloud Sync** (~2,500 lines) — `src/lib/services/`, `src/lib/sync/`, `src/components/cloud/`, `src/components/sync/`, cloud API routes, cloud page
- **Auth/OAuth** (~800 lines) — `src/lib/auth/`, `src/components/auth/`, auth API routes, login page, middleware
- **Remote Drivers / E2B** (~1,200 lines) — `src/lib/drivers/`, `src/components/drivers/`, driver API routes, `src/types/drivers.ts`
- **Legacy Feature Detail** (~2,500 lines) — `src/components/feature-detail/` (13 files, replaced by feature-detail-v2)
- **Legacy Parser** (~1,800 lines) — `src/lib/parser.ts`, `src/lib/parser.test.ts` (database-first, no longer used)
- **Queue/BullMQ** (~500 lines) — `src/lib/queue/`, `scripts/worker.ts`
- **AI Mock** (~500 lines) — `src/lib/ai/mock.ts`
- **Unused Components** (~1,000 lines) — `readme-viewer.tsx`, `changelog-viewer.tsx`, `project-selector.tsx`
- **Kanban Board** (961 lines) — `src/components/kanban-board.tsx` (replaced by FeatureList)
- **Prisma Models** — User, OAuthAccount, ApiToken, Session, CloudProject, SyncedSpec, ProjectMember, SyncEvent, ProjectLinkCode, SpecVersion, ConflictRecord, DriverConfig, RemoteSession, SyncManifest
- **Cloud Sync Types** — MemberRole, SyncFileType, ConflictStatus, SyncEventType, CloudProjectSummary, SyncStatus, SyncConflict, DiffResult, DiffHunk, DiffLine
- **Import/Export Routes** — `/api/import/markdown`, `/api/export/markdown`
- **Token/Watch Routes** — `/api/tokens`, `/api/watch`
- **Total removed**: ~18,000 lines (35% of codebase, 51K → 34K)

## [2.3.0] - 2026-03-23

### Added
- **Delete Confirmation Modal** - Custom modal replaces browser `confirm()` for provider deletion:
  - Backdrop blur overlay with centered dialog
  - Shows provider name and "cannot be undone" warning
  - Cancel and Remove buttons with red destructive styling
- **Optimistic UI for Provider Toggle** - Switch responds instantly:
  - Toggle updates local state immediately via `setProviders`
  - Reverts on API failure for consistency
- **Theme Dropdown** - Replaced toggle button with animated dropdown:
  - Compact trigger with chevron rotation animation
  - Dropdown with Light, Dark, System options
  - Spring-like `cubic-bezier(0.16,1,0.3,1)` entrance animation
  - Staggered item fade-in with `translateY` transitions
  - Active theme highlighted with accent background

### Changed
- **AI Provider System Simplified** - All providers now use API Key authentication:
  - Removed OAuth flows (Codex PKCE, Qwen/Kimi/iFlow Device Code) -- Codex CLI client_id only supports `localhost:1455` redirect
  - Unified `AddApiKeyProviderDialog` replaces separate OAuth/API Key dialogs
  - OpenAI added as API Key provider (`sk-...` key for GPT-4o, o3, Codex mini)
  - Model field made optional with auto-fill from preset defaults
  - Provider selection list uses single vertical column layout
  - Single "Add Provider" + "Env" action buttons replace three-button layout
- **Project Info Modal Redesign** - Constitution-first layout:
  - Constitution displayed as the primary/largest section
  - Small "View history" link replaces the old tab navigation
  - Project Description moved to bottom in compact read-only format
  - Edit button reveals textarea and "Save & Generate Constitution" action
- **Constitution Type Safety** - `principles` and `sections` fields made optional in `Constitution` type:
  - All components use optional chaining with safe defaults (`?? []`)
- **Provider Route Migration** - Moved from `/api/settings/ai/providers` to `/api/settings/ai/provider-configs`:
  - All SQL queries use `::uuid` casts for PostgreSQL compatibility
  - Sub-routes (`import-env`, `oauth`) moved to new path
- **Component Renaming** - `project-info-bubble.tsx` renamed to `project-info-panel.tsx`
- **Page Architecture** - Project page split into `page.tsx` (thin wrapper) + `project-view.tsx` (logic):
  - Direct named imports replace `dynamic()` lazy loading
- **Build System** - Switched from Turbopack to webpack for dev server to resolve persistent cache issues

### Fixed
- **Provider Toggle Slow Response** - API calls failed silently due to stale SQL; optimistic UI added
- **Build Cache Persistence** - Old compiled modules served despite source changes:
  - Renamed files to force new module paths
  - Disabled Turbopack to use webpack with `cache: false`
  - Restored missing Lucide icon imports
- **OAuth Token Exchange** - Fixed `Content-Type` to `application/x-www-form-urlencoded` (OAuth2 standard)
- **Device Code Flow** - Fixed `Content-Type` for Qwen device authorization endpoint
- **Duplicate Changelog Key** - Renamed second `[1.2.0]` entry to `[1.1.0]`

### Removed
- **OAuth Provider Flows** - Removed Codex PKCE, Qwen, Kimi, iFlow Device Code (incompatible with hosted web apps)
- **`AddOAuthProviderDialog`** - Replaced by unified `AddApiKeyProviderDialog`
- **`oauthOnly` Provider Flag** - All providers are now API key-based
- **Browser `confirm()` Dialog** - Replaced with custom confirmation modal
- **Cycle Theme Toggle** - Replaced with dropdown menu
- **Tab Navigation in Project Info** - Replaced with constitution-first layout
- **`dynamic()` Imports** - Removed for `ProjectInfoBubble` and `KanbanBoard`

## [2.1.0] - 2026-03-12

### Changed
- **GitHub Stars Badge** - Header displays live GitHub star count alongside repo link
- **Settings AI First** - AI Settings section moved to first position, opens by default
- **README Rewrite** - Updated to reflect v2 architecture (Supabase, mono design, MIT license)
- **Version Bump** - Package version updated to 2.1.0

## [2.0.0] - 2026-03-12

### Added
- **Supabase Cloud Database** - Migrated from local filesystem to Supabase PostgreSQL:
  - Full schema migration with all tables (projects, features, tasks, constitutions, etc.)
  - Prisma ORM with runtime `DATABASE_URL` resolution from `POSTGRES_PRISMA_URL`
  - Connection pooling via Supabase for production readiness
- **Skeleton Loading System** - Responsive loading screens for every route:
  - Reusable `Skeleton`, `ProjectListSkeleton`, `KanbanSkeleton`, `FeatureDetailSkeleton` components
  - Next.js `loading.tsx` files for `/`, `/projects/[name]`, `/features/[featureId]`, `/settings`
  - Replaces plain text "Loading..." with animated pulse placeholders
- **Code Splitting** - Dynamic imports for heavy components:
  - `KanbanBoard`, `ProjectInfoBubble`, `FeatureDetailByStage`, `ConfirmDialog` lazy-loaded
  - Skeleton fallbacks shown while chunks load
  - `ssr: false` for client-only components to reduce server bundle
- **AI Provider Guard** - Prevents broken stage transitions:
  - Client-side check in kanban `handleDrop` before queuing jobs
  - Server-side validation in `/api/stage-transition` returns 400 if no API key
  - Clean modal dialog with "Go to Settings" button instead of infinite spinner
- **GitHub Stars Badge** - Header shows live star count from GitHub API:
  - `GitHubStars` component fetches `/repos/spec-board/spec-board` with SWR
  - Displays compact star count with link to repository
- **Button Design System** - Unified CSS button classes in `globals.css`:
  - `.btn` base with `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger` variants
  - `.btn-xs`, `.btn-sm`, `.btn-md` size classes
  - `.btn-icon` for icon-only circular buttons
  - Pill-shaped (`border-radius: 9999px`) with consistent focus rings
- **SEO & Meta Tags** - Comprehensive metadata for search and social:
  - OpenGraph and Twitter card metadata
  - Keywords, authors, site name
  - Viewport with `themeColor` for light/dark modes
  - Description: "Visual Dashboard for Software Specs & Docs"

### Changed
- **Minimal Mono Design** - Complete visual overhaul:
  - Monochromatic zinc/neutral color palette (no blue, cyan, or colored accents)
  - All semantic tokens (success, error, warning, tags, phases) mapped to gray scale
  - Lowercase "specboard" wordmark with geometric SVG logo mark
  - Compact header with `gap-2` spacing between action buttons
  - Narrower `max-w-3xl` content column for focused reading
  - Feature detail screens synchronized with mono tokens throughout
- **Button Styling** - Text-only pill buttons without icons:
  - Removed icons from all text buttons (New, Create, Cancel, Delete, etc.)
  - Icon-only buttons (settings, theme, close) retain icons with circular shape
- **Default Theme** - Changed from `dark` to `system`:
  - Follows device `prefers-color-scheme` by default
  - `theme-init.js` uses `matchMedia` for flash-free system theme detection
  - Settings store defaults and fallbacks updated to `'system'`
- **Settings Page** - AI Settings moved to first position:
  - Default active section is now `'ai'` instead of `'shortcuts'`
  - Users see AI provider configuration immediately on open
- **Settings Navigation** - Back button uses `router.back()`:
  - Previously hardcoded to `/` (home page)
  - Now correctly returns to the previous page in browser history
- **License** - Changed from AGPL-3.0 to MIT
- **React Compiler** - Enabled `reactCompiler: true` in `next.config.ts`
- **Removed `output: "standalone"`** - Not needed for Vercel deployment

### Fixed
- **Prisma DATABASE_URL Error** - `prisma.ts` sets `process.env.DATABASE_URL` from `POSTGRES_PRISMA_URL` before client init
- **Database Column Mismatch** - Renamed snake_case columns (`feature_id`, `spec_content`, etc.) to camelCase to match Prisma schema
- **Create Feature Modal Focus** - Fixed textarea click focusing name input instead:
  - Added `htmlFor`/`id` associations to labels and inputs
  - Added cleanup for `setTimeout` in focus `useEffect`
  - Added visible `focus:ring` to distinguish active field
- **Native `alert()` Calls** - Replaced all 5 `alert()` calls with `toast.error()` from Sonner
- **Feature Detail Colors** - Replaced all colored badges, progress dots, focus rings, and animations with mono design tokens

### Removed
- Standalone Docker output configuration

## [1.2.0] - 2026-02-15

### Added
- **4-Stage Workflow** - New Kanban pipeline:
  - `backlog` → `specs` → `plan` → `tasks`
  - SPECS stage merges old Specify + Clarify stages (single modal with Q&A + User Stories)
  - PLAN stage includes checklist generation automatically
  - TASKS is final stage - analysis runs automatically on plan → tasks transition
  - API `/api/spec-workflow/checklist` for generating checklist content
  - Stage transitions auto-trigger multiple APIs:
    - backlog → specs: calls `specify` + `clarify`
    - specs → plan: calls `plan` + `checklist`
    - plan → tasks: calls `tasks` + `analyze`
  - Database migration script available at `scripts/migrate-stages.ts`

### Changed
- **Feature Stage Consolidation** - Simplified feature status model:
  - Removed duplicate `status` field from Feature model (kept only `stage`)
  - `FeatureStage` now uses Kanban-style values: `'backlog' | 'planning' | 'in_progress' | 'done'`
  - Previously used workflow-style values: `'specify' | 'plan' | 'tasks' | 'implement' | 'complete'`
  - API endpoint `/api/features/[id]/status` now updates `stage` instead of `status`
  - UI components updated to use `stage` as single source of truth
  - All tests updated to reflect new stage values

### Added
- **DateTime Formatting Utilities** - Unified datetime display with local timezone:
  - `formatRelativeTime()` - "5m ago", "2h ago", "3d ago"
  - `formatLocaleDate()` - "Feb 17, 2026"
  - `formatLocaleDateTime()` - "Feb 17, 2026, 6:33 PM"
  - `formatLocaleTime()` - "6:33 PM"
  - Automatically uses browser's local timezone (database stores UTC)
  - Use instead of inline `new Date().toLocaleString()` calls

- **AI Feature Creation** - Generate spec-kit documents automatically:
  - User enters feature name and description
  - AI generates spec.md, plan.md, and tasks.md using speckit
  - New `/api/features/ai-create` endpoint
- **Configurable AI Provider Settings** - Choose your preferred LLM:
  - Settings page with provider selection (OpenAI/Anthropic)
  - Custom base URL support for OpenAI-compatible APIs (Ollama, LM Studio, LiteLLM)
  - Separate base URLs for OpenAI and Anthropic
  - Model configuration per provider
  - API keys stored server-side for security
- **REST API Endpoints** - Complete CRUD for features:
  - `/api/features` - List, create features
  - `/api/features/[id]` - Get, update, delete feature
  - `/api/features/[id]/status` - Update feature status
  - `/api/features/ai-create` - AI-powered feature creation
  - `/api/export`, `/api/import` - Export/import project data
  - `/api/kanban`, `/api/stories`, `/api/tasks` - Kanban operations

### Changed
- **Kanban Board** - Inline "Add Feature" button in Backlog column
- **Feature Status** - New features now appear in Backlog (not In Progress)
- **Dark Mode** - Fixed white background in feature detail components
- **Settings Page** - Simplified AI settings to single form

### Fixed
- Feature not found error when clicking on kanban cards
- Dark mode showing white background in feature detail components
- API key status not showing after save
- UI shows "***" in API key field when configured

## [1.1.0] - 2026-02-15

### Added
- **Toast Notifications** - User feedback for actions:
  - Success, error, and info toast types
  - Auto-dismiss after 3 seconds
  - Positioned in bottom-right corner

### Changed
- **Database Schema** - Added Feature and Task models for better data management
- **UI/UX Rebrand (Feature 012)** - Complete visual redesign for "simple but professional" appearance:
  - Design token system with CSS custom properties for theme-awareness
  - 8pt spacing grid (--space-1 through --space-12) for consistent layout
  - rem-based typography scale (--text-xs through --text-3xl) for accessibility
  - Single accent color (cyan) with WCAG 2.2 AA contrast compliance
  - 4-column Kanban system (Backlog → Planning → In Progress → Done)
  - Standardized component styling (buttons, inputs, cards, modals)
  - Dark mode parity with all CSS variables having light/dark variants
  - Reduced motion support respecting user preferences
  - Responsive design tested at 320px, 768px, 1280px, 2560px breakpoints
  - 150ms ease-out transitions for all interactive elements
  - All 253 unit tests passing with updated Kanban logic
- **Detail Page Redesign (Feature 013)** - Visual consistency and progressive disclosure:
  - Phase header aggregate status dots showing completion at a glance
  - 8px Jira-style status indicators (blue/yellow/green) matching Kanban board
  - Progressive disclosure with hover popovers (400ms show delay, 150ms hide delay)
  - Mobile-responsive touch behavior with tap-to-toggle popovers
  - Simplified navigation sidebar with status dots replacing verbose progress text
  - Accessibility improvements with ARIA labels and keyboard support
- **Cloud Specification Sync (Feature 011)** - Complete cloud sync infrastructure:
  - OAuth authentication with Google and GitHub
  - Team collaboration with role-based access (VIEW, EDIT, ADMIN)
  - Conflict detection and resolution with 3-way merge
  - Version history (last 30 versions retained per spec file)
  - Activity audit trail for tracking changes
  - Project link codes for easy team member invitations
- **MCP Server (specboard-mcp)** - Model Context Protocol server for AI assistants:
  - `pull_spec` tool - Download specs from cloud to local
  - `push_spec` tool - Upload local specs to cloud
  - API token authentication
  - Support for Claude Code, Cursor, GitHub Copilot, and other MCP-compatible assistants
- **API Token Management** - Generate and manage API tokens for programmatic access
- **Comprehensive Documentation** - Complete API docs, developer guide, and codebase index
- **Interactive Checklist Toggle** - Click or keyboard to toggle checklist items:
  - Optimistic UI updates with per-item rollback on failure
  - Keyboard accessibility (Tab, Space, Enter) with ARIA attributes
  - Loading indicators during save operations
  - 300ms debouncing to prevent rapid API calls
  - New `/api/checklist` PATCH endpoint for toggling items
  - 26 unit tests for checklist utilities
- **SpecBoard Logo & Favicon** - Custom branding assets
- **Codebase Documentation** - CLAUDE.md files for all major directories

### Changed
- **API Route Improvements** - Checklist endpoint uses async `fs/promises`
- **Cross-Platform Path Validation** - Uses `path.extname()` and `path.sep`
- **TypeScript Types** - Proper React type imports, cross-platform timer types

### Fixed
- Rollback logic now only reverts specific failed item, not entire document
- KeyboardEvent type import issue in checklist viewer
- NodeJS.Timeout type compatibility for client components

## [1.1.0] - 2026-01-02

### Added
- **Settings Page Redesign** - Complete overhaul of the settings page:
  - Two-column layout with sidebar navigation
  - Keyboard shortcuts toggle to enable/disable all shortcuts
  - About section with README and Changelog tabs
  - Version info and GitHub links in footer
- **Beautified README Viewer** - Custom React components replace ASCII diagrams:
  - `FeaturesGrid` - 6 feature cards with icons in responsive grid
  - `HowItWorksFlow` - 3-step flow diagram with arrows
  - `TechStackDisplay` - Frontend/Backend tech cards
  - `EnhancedMarkdownRenderer` detects ASCII patterns and renders styled components
- **Changelog Viewer** - Version timeline with visual enhancements:
  - Color-coded badges for change types (Added=green, Fixed=yellow, Changed=blue)
  - Collapsible version cards with timeline dots
- **AGPL-3.0 + Commercial Licensing** - Dual-license model:
  - Available under AGPL-3.0 for open source use
  - Commercial license available for proprietary use
- **Contributor License Agreement (CLA)** - New `CLA.md` file:
  - Grant of copyright and patent licenses
  - Dual-licensing acknowledgment
  - Future license change agreement
- **Pull Request Template** - `.github/PULL_REQUEST_TEMPLATE.md`:
  - CLA confirmation checkboxes
  - Change type selection
  - Testing checklist
- **App Info API** - `/api/app-info` endpoint:
  - Returns version, readme, changelog content
  - Used by Settings page for dynamic content

### Changed
- **Settings About Tab** - Merged Overview into README tab:
  - Version, License, GitHub links shown in compact header bar
  - Full README content displayed below
  - Removed scroll limits for full content display
- **Kanban Board Restructure** - Updated column layout:
  - Added Planning column
  - Removed Review column
  - Unified color scheme
- **Project Info Display** - Replaced Constitution/Clarity panels with single bubble button
- **Header Simplification** - Replaced Live/Share/Refresh buttons with Settings icon

### Fixed
- PR template URLs (added missing `/` in paths)
- README documentation links converted to absolute GitHub URLs

## [0.3.0] - 2024-12-30

### Added
- **Feature Detail Modal Redesign** - Full-screen modal with enhanced navigation:
  - Split-view support with drag-to-split and resizable divider
  - Left navigation sidebar grouped by workflow phase
  - Status header with progress bar and "Next Action" display
  - Comprehensive keyboard shortcuts (1-9 for sections, Ctrl+\ for split, Tab to switch panes)
  - Drag navigation items to content area to open in split view
  - Memoized section configs for performance optimization
  - Full accessibility support with focus trap and screen reader announcements
- **Database Slug Routing** - Clean, shareable URLs using database slugs:
  - New `/api/projects/register` endpoint for auto-registration
  - Generates URL-safe slugs from folder names (e.g., `my-todolist`)
  - Handles slug conflicts with numeric suffixes (`my-todolist-2`)
  - Returns existing project if path already registered
- **Analysis Viewer Tab** - View spec alignment tracking data:
  - Displays analysis.json and analysis.md from feature's analysis/ directory
  - Shows spec alignment score and requirement status
- **Checklist Viewer Tab** - Display checklist files from feature directories
- **Docker Support** - Full containerization for production deployment:
  - Multi-stage Dockerfile with pnpm and Prisma support
  - `docker-compose.yml` for full stack (app + PostgreSQL)
  - `docker-compose.db.yml` for database-only (use with PM2)
  - `docker-entrypoint.sh` for automatic database migrations
- **PM2 Process Manager** - `ecosystem.config.cjs` with:
  - Production and development environment configs
  - Log file management
  - Graceful shutdown handling
  - Memory limit auto-restart
- **New Home Page UI** - Split view layout with recent projects and "Open Project" button
- **Recent Projects List** - Track recently opened projects with full context:
  - Project name and path
  - Last opened timestamp with relative time formatting
  - Feature count and completion percentage
  - Stage breakdown (specifying, planning, implementing, complete)
  - Auto-generated summary from constitution.md
  - Cached slug for faster navigation
- **Open Project Modal** - Streamlined project search experience:
  - Searchbox with path autocomplete
  - Keyboard navigation (↑↓ navigate, Tab accept, Esc close)
  - Spec-kit project detection with visual badge
  - Preview card showing project stats before opening
- **Share Button** - Copy project URL to clipboard from header

### Changed
- **URL Structure** - Projects now use clean slugs instead of encoded paths:
  - Old: `/projects/%2FUsers%2Fpaul%2Fmy-project`
  - New: `/projects/my-project`
- Home page auto-registers projects via `/api/projects/register` before navigation
- All project pages lookup filesystem path from database using slug
- Recent projects stored in localStorage with rich metadata including slug
- Next.js config updated with `output: "standalone"` for Docker

### Fixed
- HTML validation error: nested `<button>` elements in recent projects list
- URL double encoding issue (`%252F`) with filesystem paths

## [0.2.0] - 2024-12-28

### Added
- Path input with autocomplete suggestions in ProjectSelector
- Dynamic port configuration with dotenv-cli

## [0.1.1] - 2024-12-27

### Added
- WCAG 2.2 AA accessibility support
- Focus trapping for modals
- Screen reader announcements
- Keyboard navigation throughout

## [0.1.0] - 2024-12-26

### Added
- Initial release
- Kanban board with 3 columns (Backlog, In Progress, Done)
- Project registration with URL slugs
- Real-time file watching with SSE
- Feature detail modal with tabs
- Dashboard metrics panel
- Constitution and clarity history panels
