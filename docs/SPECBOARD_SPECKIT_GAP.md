# SpecBoard vs Speckit Feature Gap Analysis

> **Date**: 2026-02-15
> **Purpose**: Document what SpecBoard is missing compared to Speckit's document generation capabilities (excluding implementation)

---

## Summary

SpecBoard currently focuses on **parsing and displaying** spec-kit documents, with limited **AI generation** for core files (spec.md, plan.md, tasks.md). It lacks interactive workflow commands and project-level document creation that Speckit provides.

---

## Current SpecBoard Capabilities (Updated)

### ✅ Document Parsing (Read-Only)

| Document Type | Status | Notes |
|---------------|--------|-------|
| `spec.md` | ✅ Complete | User stories, acceptance criteria, clarifications |
| `plan.md` | ✅ Complete | Technical context, approach |
| `tasks.md` | ✅ Complete | Tasks with phases, user story references |
| `constitution.md` | ✅ Complete | Project-level principles |
| `research.md` | ✅ Complete | Additional file parsing |
| `data-model.md` | ✅ Complete | Additional file parsing |
| `quickstart.md` | ✅ Complete | Additional file parsing |
| `contracts/*.md,*.yaml` | ✅ Complete | API contract files |
| `checklists/*.md` | ✅ Complete | Checklist files |
| `analysis/*.md` | ✅ Complete | AI analysis reports |

### ✅ AI Document Generation (Aligned with Speckit Workflow)

| Step | Endpoint | Status | Notes |
|------|----------|--------|-------|
| 1. Specify | `/api/spec-workflow/specify` | ✅ Implemented | Generate spec.md |
| 2. Clarify | `/api/spec-workflow/clarify` | ✅ Implemented | Generate clarification questions |
| 3. Plan | `/api/spec-workflow/plan` | ✅ Implemented | Generate plan.md |
| 4. Tasks | `/api/spec-workflow/tasks` | ✅ Implemented | Generate tasks.md |
| 5. Analyze | `/api/spec-workflow/analyze` | ✅ Implemented | Validate consistency |
| Constitution | `/api/spec-workflow/constitution` | ✅ Implemented | Create project constitution |

#### Legacy Endpoints (Still Available)
| Document Type | Status | Notes |
|---------------|--------|-------|
| `spec.md` | ✅ Available | Via `/api/features/ai-create` |
| `plan.md` | ✅ Available | Via `/api/features/ai-create` |
| `tasks.md` | ✅ Available | Via `/api/features/ai-create` |

---

## What SpecBoard Is Missing (Updated)

### ✅ Completed (v1.3.0)

The following features have been implemented:

| Feature | Status | Endpoint |
|---------|--------|----------|
| Constitution Creation | ✅ New | `/api/spec-workflow/constitution` |
| Clarify Questions | ✅ New | `/api/spec-workflow/clarify` |
| Analyze Validation | ✅ New | `/api/spec-workflow/analyze` |
| Step-by-step Workflow | ✅ New | `/api/spec-workflow/{specify,plan,tasks,analyze}` |

### ❌ Remaining Gaps

#### 1. Interactive Workflow UI

**Speckit** provides slash command UI in IDE

**SpecBoard**:
- ✅ Backend APIs available
- ❌ No interactive wizard UI for step-by-step workflow

**Gap**: Need UI for users to go through specify → clarify → plan → tasks → analyze

---

#### 2. Additional Document Generation

**Speckit** can generate:
- `research.md` - Technology research
- `data-model.md` - Data contracts/schema
- `quickstart.md` - Getting started guide

**SpecBoard**:
- ✅ Can parse all these files
- ❌ Cannot generate them via AI

**Gap**: Missing AI-assisted generation for supporting documents

---

#### 3. Contracts Generation

**Speckit**: Creates API contracts in `contracts/` directory

**SpecBoard**:
- ✅ Can parse contracts
- ❌ Cannot generate contracts

**Gap**: No API contract scaffolding

---

#### 4. Checklist Generation

**Speckit**: Can generate checklists from acceptance criteria

**SpecBoard**:
- ✅ Can parse checklists
- ✅ Can toggle checklist items (via API)
- ❌ Cannot generate checklists

**Gap**: No automatic checklist creation from acceptance criteria

---

## Feature Priority Matrix

| Priority | Feature | Impact | Effort |
|----------|---------|--------|--------|
| **High** | Constitution Creation | Enables project-level principles | Medium |
| **High** | Analyze Command | Quality assurance | Medium |
| **Medium** | Additional Docs Gen | Research/data-model/quickstart | High |
| **Medium** | Interactive Clarification | Better specs | High |
| **Low** | Contracts Generation | API scaffolding | High |
| **Low** | Checklist Generation | Task management | Medium |

---

## Recommendations

### Phase 1: Interactive Workflow UI (High Priority)

Create wizard UI to use the new backend APIs:
- Step 1: Specify (describe feature)
- Step 2: Clarify (interactive Q&A)
- Step 3: Plan (technical decisions)
- Step 4: Tasks (breakdown)
- Step 5: Analyze (validate)

**New API Endpoints Available:**
- `/api/spec-workflow/specify` - Generate spec.md
- `/api/spec-workflow/clarify` - Generate clarification questions
- `/api/spec-workflow/plan` - Generate plan.md
- `/api/spec-workflow/tasks` - Generate tasks.md
- `/api/spec-workflow/analyze` - Validate consistency
- `/api/spec-workflow/constitution` - Create project constitution

### Phase 2: Additional Document Generation

Add AI generation for:
- `research.md` - Technology research
- `data-model.md` - Data schema
- `quickstart.md` - Getting started

### Phase 3: Advanced Features

1. Contracts Generation - API contract scaffolding
2. Checklist Generation - Auto-create from acceptance criteria

---

## Related Files

### Core AI Modules
- Types: `src/lib/ai/types.ts` (updated with workflow types)
- Mock: `src/lib/ai/mock.ts` (updated with workflow functions)
- Index: `src/lib/ai/index.ts` (exports new functions)

### New API Endpoints
- `/api/spec-workflow/specify` - Generate spec from description
- `/api/spec-workflow/clarify` - Generate clarification questions
- `/api/spec-workflow/plan` - Generate technical plan
- `/api/spec-workflow/tasks` - Generate task breakdown
- `/api/spec-workflow/analyze` - Validate document consistency
- `/api/spec-workflow/constitution` - Create project constitution

### Legacy (Still Available)
- Parser: `src/lib/parser.ts`
- Feature Creation: `src/app/api/features/ai-create/route.ts`

---

## References

- [Speckit Documentation](https://github.com/github/spec-kit)
- [Spec-Driven Development](https://developer.microsoft.com/blog/spec-driven-development-spec-kit)
