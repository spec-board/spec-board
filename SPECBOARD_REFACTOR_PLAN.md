# SpecBoard Refactor Plan

> Converting from filesystem-based to database-driven task management

---

## 1. Architecture

### 1.1 Current Architecture Analysis

**Current State:**
- `Project` model stores: `id`, `name` (slug), `displayName`, `filePath`
- Spec content is parsed from markdown files (spec.md, plan.md, tasks.md) using `parser.ts`
- Real-time updates via SSE + chokidar file watching
- Zustand store for client state

**Pain Points:**
- No offline support
- Limited collaboration (no real multi-user)
- Parser must run on every request
- No proper CRUD for features/tasks

### 1.2 Proposed Database Schema

```prisma
// NEW: Feature model (replaces filesystem-based features)
model Feature {
  id          String   @id @default(uuid())
  projectId   String   @map("project_id")
  featureId   String   // e.g., "001-user-login" (from spec)
  name        String
  description String?
  stage       String   @default("specify") // specify, plan, tasks, implement, complete
  status      String   @default("backlog") // backlog, planning, in_progress, done

  // Relations
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  userStories UserStory[]
  tasks       Task[]

  @@unique([projectId, featureId])
}

// NEW: User Story model
model UserStory {
  id          String   @id @default(uuid())
  featureId   String   @map("feature_id")
  storyId     String   // e.g., "US1"
  title       String
  description String?
  status      String   @default("pending") // pending, in_progress, completed
  order       Int      @default(0)

  // Relations
  feature     Feature  @relation(fields: [featureId], references: [id], onDelete: Cascade)
  tasks       Task[]

  @@unique([featureId, storyId])
}

// NEW: Task model (granular than markdown tasks)
model Task {
  id          String   @id @default(uuid())
  userStoryId String?  @map("user_story_id")
  featureId   String   @map("feature_id")
  taskId      String   // e.g., "T001"
  title       String
  description String?
  status      String   @default("pending")
  priority    String   @default("P") // P, M, L
  order       Int      @default(0)

  // Relations
  userStory   UserStory? @relation(fields: [userStoryId], references: [id], onDelete: SetNull)
  feature     Feature    @relation(fields: [featureId], references: [id], onDelete: Cascade)

  @@unique([featureId, taskId])
}

// Extended: Project model for database-first
model Project {
  id          String   @id @default(uuid())
  name        String   @unique
  displayName String   @map("display_name")
  description String?
  filePath    String?  @map("file_path") // Optional - for migration from filesystem

  // New database-first fields
  isCloud     Boolean  @default(false) @map("is_cloud")

  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  features    Feature[]

  @@map("projects")
}
```

### 1.3 API Design

**REST API Routes:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/projects` | List/Create projects |
| GET/PUT/DELETE | `/api/projects/:id` | CRUD project |
| GET/POST | `/api/projects/:id/features` | List/Create features |
| GET/PUT/DELETE | `/api/features/:id` | CRUD feature |
| GET/POST | `/api/features/:id/stories` | List/Create user stories |
| GET/PUT/DELETE | `/api/stories/:id` | CRUD user story |
| GET/POST | `/api/features/:id/tasks` | List/Create tasks |
| GET/PUT/DELETE | `/api/tasks/:id` | CRUD task |
| GET | `/api/projects/:id/kanban` | Get kanban data |

### 1.4 Real-Time Strategy

- **Primary**: SSE (Server-Sent Events) - keep existing
- **Enhancement**: Add database change listeners via Prisma
- **Polling fallback**: For clients that can't do SSE

### 1.5 Migration Strategy

**Phase 1: Dual Mode**
- Keep filesystem reading for existing projects with `filePath`
- New projects use database-first

**Phase 2: Migration Tool**
- One-time migration script
- Parse existing markdown → insert to database
- Keep filePath for reference, then remove

**Phase 3: Database-Only**
- Remove filesystem dependency
- Full CRUD in database

### 1.6 Risk Assessment

| Risk | Level | Mitigation |
|------|-------|------------|
| Data loss during migration | High | Backup before migration, verify checksums |
| Breaking changes | Medium | Dual-mode approach |
| Performance (large datasets) | Medium | Pagination, caching |
| Offline support complexity | Low | Future enhancement |

---

## 2. UX Analysis

### 2.1 Research: Task Management Tools

| Tool | Strengths | Weaknesses |
|------|-----------|------------|
| **Linear** | Keyboard-first, minimal UI, dark mode, fast | Limited customization, no free tier |
| **Asana** | Rich features, templates, timelines | Complex, slow for large projects |
| **Jira** | Enterprise workflows, reporting | Steep learning curve, expensive |
| **ClickUp** | All-in-one, customizable | Overwhelming, performance issues |

### 2.2 SpecBoard UX - Proposed

**Design Philosophy:**
- **Minimal & Fast** like Linear (keyboard-first)
- **AI-powered** like modern tools (PRD → user stories)
- **Real-time** collaboration

**Key Features:**

1. **Dashboard View**
   - Project list with recent activity
   - Quick create (Cmd+K)
   - Search/filter projects

2. **Kanban Board** (database-driven)
   - Drag-drop columns: Backlog → Planning → In Progress → Done
   - Real-time updates (SSE)
   - Keyboard navigation (j/k, Enter)

3. **Feature Detail**
   - User stories as swimlanes
   - Task list with priorities
   - Rich text editor for descriptions

4. **AI Integration**
   - PRD → User Stories generation
   - Task breakdown suggestions
   - Auto-status updates

### 2.3 User Journey

```
Create Project → Add Features → Add User Stories → Add Tasks → Track Progress
     ↓              ↓              ↓              ↓              ↓
  Database      Database       Database       Database       Database
```

---

## 3. Devil's Advocate Review

### 3.1 Concerns

| # | Concern | Risk | Solution |
|---|---------|------|----------|
| 1 | REST API sẽ có N+1 query problems | Medium | Use Prisma `include` for eager loading, consider DataLoader |
| 2 | Migration có thể mất dữ liệu | High | Backup trước, checksum verification, dry-run mode |
| 3 | Không có GraphQL - flexibility hạn chế | Low | REST đủ cho current needs, có thể add sau |
| 4 | Concurrent edits có thể overwrite | Medium | Optimistic locking, timestamps |
| 5 | Large projects (1000+ tasks) performance | Medium | Pagination, virtual scrolling |

### 3.2 Additional Edge Cases

- **Offline mode**: Future enhancement - localStorage cache + sync when online
- **Import/Export**: Need migration tool cho existing spec-kit files
- **Permissions**: Cloud projects cần role-based access (VIEW/EDIT/ADMIN)
- **Search**: Full-text search sẽ cần Elasticsearch hoặc PostgreSQL full-text

### 3.3 Recommendations

1. **Start simple**: Không cần GraphQL ngay, REST đủ
2. **Dual-mode**: Keep filesystem support cho existing projects
3. **Pagination**: Always paginate list endpoints
4. **Timestamps**: Use `updatedAt` for optimistic locking

---

## 4. Implementation Tasks

### Backend
- [ ] Update Prisma schema
- [ ] Create migration
- [ ] Implement CRUD API routes
- [ ] Add input validation (Zod)

### Frontend
- [ ] Update Zustand store
- [ ] Create new components
- [ ] Implement optimistic updates
- [ ] Add loading/error states

### Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
