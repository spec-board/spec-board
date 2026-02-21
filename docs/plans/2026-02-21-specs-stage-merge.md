# SPECS Stage Merge Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Merge Specify and Clarify stages into a single "SPECS" stage. Left column shows interactive Q&A, right column shows User Stories with markdown rendering.

**Architecture:** Replace two separate stage modals with one unified SPECS modal. Left panel: ClarificationForm for interactive Q&A. Right panel: DocumentSelector + MarkdownRenderer showing User Stories. Auto-migrate existing specify/clarify stages to specs. Auto-generate spec + questions when transitioning from backlog to specs.

**Tech Stack:** Next.js 15, TypeScript, React, Zustand, Prisma

---

## Phase 1: Type Updates

### Task 1: Update FeatureStage type

**Files:**
- Modify: `src/types/index.ts:1`

**Step 1: Read current type**

```bash
cat src/types/index.ts | head -5
```

**Step 2: Edit FeatureStage**

Replace line 1:
```typescript
// Before
export type FeatureStage = 'backlog' | 'specify' | 'clarify' | 'plan' | 'tasks' | 'analyze';

// After
export type FeatureStage = 'backlog' | 'specs' | 'plan' | 'tasks' | 'analyze';
```

**Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: rename specify+clarify to specs in FeatureStage type"
```

---

### Task 2: Update STAGES configuration

**Files:**
- Modify: `src/components/feature-detail-v2/base/types.ts:34-41`

**Step 1: Read current STAGES**

```bash
cat src/components/feature-detail-v2/base/types.ts | grep -A10 "STAGES:"
```

**Step 2: Edit STAGES array**

Replace lines 34-41:
```typescript
// Before
export const STAGES: StageConfig[] = [
  { stage: 'backlog', label: 'Backlog', description: 'Feature ideas and descriptions' },
  { stage: 'specify', label: 'Specify', description: 'Creating specification' },
  { stage: 'clarify', label: 'Clarify', description: 'Answering questions' },
  { stage: 'plan', label: 'Plan', description: 'Implementation plan with checklist' },
  { stage: 'tasks', label: 'Tasks', description: 'Task breakdown' },
  { stage: 'analyze', label: 'Analyze', description: 'Consistency analysis' },
];

// After
export const STAGES: StageConfig[] = [
  { stage: 'backlog', label: 'Backlog', description: 'Feature ideas and descriptions' },
  { stage: 'specs', label: 'Specs', description: 'Spec + Clarifications' },
  { stage: 'plan', label: 'Plan', description: 'Implementation plan with checklist' },
  { stage: 'tasks', label: 'Tasks', description: 'Task breakdown' },
  { stage: 'analyze', label: 'Analyze', description: 'Consistency analysis' },
];
```

**Step 3: Commit**

```bash
git add src/components/feature-detail-v2/base/types.ts
git commit -m "feat: update STAGES config - merge specify+clarify to specs"
```

---

## Phase 2: Create SPECS Modal

### Task 3: Create SpecsModal component

**Files:**
- Create: `src/components/feature-detail-v2/stages/specs-modal.tsx`

**Step 1: Create the SpecsModal**

```typescript
'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Loader2, HelpCircle, Play, AlertCircle, ArrowRight } from 'lucide-react';
import { BaseModal } from '../base/base-modal';
import type { BaseModalProps } from '../base/types';
import type { DocumentType } from '@/types';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { ClarificationForm } from '../clarification-form';
import { DocumentSelector } from '../document-selector';
import { getDocumentOptions } from '../types';
import { STAGES, getStageConfig } from '../base/types';
import { toast } from 'sonner';
import { useProjectStore } from '@/lib/store';

interface SpecsModalProps extends BaseModalProps {
  onGenerateSpec?: () => Promise<void>;
  onGenerateQuestions?: () => Promise<void>;
  onRefresh?: () => Promise<void>;
}

type SpecsStatus = 'idle' | 'generating_spec' | 'generating_questions' | 'ready' | 'error';

export function SpecsModal({
  feature,
  onClose,
  onStageChange,
  onDelete,
  onGenerateSpec,
  onGenerateQuestions,
  onRefresh
}: SpecsModalProps) {
  const [specStatus, setSpecStatus] = useState<SpecsStatus>('idle');
  const [questionStatus, setQuestionStatus] = useState<SpecsStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocumentType>('spec');
  const [allAnswered, setAllAnswered] = useState(false);

  const project = useProjectStore(state => state.project);
  const projectId = project?.projectId;

  const hasSpec = !!feature.specContent;
  const hasClarifications = !!feature.clarificationsContent;
  const isEditable = feature.stage === 'specs';

  // Set initial status based on existing content
  useEffect(() => {
    if (hasSpec) setSpecStatus('ready');
    if (hasClarifications) setQuestionStatus('ready');
  }, [hasSpec, hasClarifications]);

  const handleAllAnsweredChange = useCallback((answered: boolean) => {
    setAllAnswered(answered);
  }, []);

  const currentIndex = STAGES.findIndex(s => s.stage === feature.stage);
  const nextStage = STAGES[currentIndex + 1];
  const nextStageConfig = nextStage ? getStageConfig(nextStage.stage) : null;

  const documentOptions = useMemo(() => getDocumentOptions(feature), [feature]);

  const selectedDocContent = useMemo(() => {
    const option = documentOptions.find(o => o.type === selectedDoc);
    return option?.content || null;
  }, [documentOptions, selectedDoc]);

  const handleGenerateSpec = async () => {
    if (!onGenerateSpec) {
      try {
        setSpecStatus('generating_spec');
        setError(null);

        const response = await fetch('/api/spec-workflow/specify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            featureId: feature.id,
            name: feature.name,
            description: feature.description,
          }),
        });

        if (!response.ok) throw new Error('Failed to generate spec');

        setSpecStatus('ready');
        toast.success('Spec generated');
        onRefresh?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate spec');
        setSpecStatus('error');
      }
      return;
    }

    setSpecStatus('generating_spec');
    try {
      await onGenerateSpec();
      setSpecStatus('ready');
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate spec');
      setSpecStatus('error');
    }
  };

  const handleGenerateQuestions = async () => {
    if (!onGenerateQuestions) {
      try {
        setQuestionStatus('generating_questions');
        setError(null);

        const response = await fetch('/api/spec-workflow/clarify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            featureId: feature.id,
            specContent: feature.specContent,
          }),
        });

        if (!response.ok) throw new Error('Failed to generate questions');

        setQuestionStatus('ready');
        toast.success('Questions generated');
        onRefresh?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate questions');
        setQuestionStatus('error');
      }
      return;
    }

    setQuestionStatus('generating_questions');
    try {
      await onGenerateQuestions();
      setQuestionStatus('ready');
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate questions');
      setQuestionStatus('error');
    }
  };

  const handleSaveSuccess = useCallback(() => {
    toast.success('Clarifications saved');
    onRefresh?.();
  }, [onRefresh]);

  const handleContinueToNextStage = () => {
    if (onStageChange && nextStageConfig) {
      onStageChange(nextStageConfig.stage as any);
    }
  };

  const isGenerating = specStatus === 'generating_spec' || questionStatus === 'generating_questions';

  return (
    <BaseModal
      feature={feature}
      onClose={onClose}
      onStageChange={onStageChange}
      onDelete={onDelete}
      headerActions={
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateSpec}
            disabled={isGenerating}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-md font-medium text-sm transition-colors"
          >
            {specStatus === 'generating_spec' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Generate Spec
          </button>
          <button
            onClick={handleGenerateQuestions}
            disabled={isGenerating || !hasSpec}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white rounded-md font-medium text-sm transition-colors"
            title={!hasSpec ? 'Generate spec first' : undefined}
          >
            {questionStatus === 'generating_questions' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <HelpCircle className="w-4 h-4" />
            )}
            Generate Questions
          </button>
          {hasSpec && nextStageConfig && (
            <button
              onClick={handleContinueToNextStage}
              disabled={!allAnswered}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
              title={!allAnswered ? 'Please answer all questions before continuing' : undefined}
            >
              {nextStageConfig.label}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      }
      showNavigation={hasSpec}
    >
      <div className="flex h-full">
        {/* Left: Interactive Q&A Panel */}
        <div className="w-[40%] border-r border-[var(--border)] p-6 overflow-y-auto">
          {isGenerating && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 mx-auto mb-4 text-blue-500 animate-spin" />
                <p className="text-[var(--foreground)] font-medium mb-2">
                  {specStatus === 'generating_spec' ? 'Generating Spec...' : 'Generating Questions...'}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center p-4">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 max-w-md">
                <div className="flex items-center gap-2 text-red-500 mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Generation Failed</span>
                </div>
                <p className="text-sm text-[var(--muted-foreground)] mb-4">{error}</p>
              </div>
            </div>
          )}

          {!isGenerating && !error && (
            <ClarificationForm
              content={feature.clarificationsContent || ''}
              featureId={feature.id}
              projectId={projectId || ''}
              onSaved={handleSaveSuccess}
              readOnly={!isEditable}
              onAllAnsweredChange={handleAllAnsweredChange}
            />
          )}
        </div>

        {/* Right: Document Viewer */}
        <div className="w-[60%] overflow-hidden flex flex-col">
          <div className="flex-shrink-0 px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
            <DocumentSelector
              options={documentOptions}
              selected={selectedDoc}
              onChange={setSelectedDoc}
            />
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {selectedDocContent ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <MarkdownRenderer content={selectedDocContent} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-[var(--muted-foreground)]">
                <p>No content available. Click "Generate Spec" to start.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/feature-detail-v2/stages/specs-modal.tsx
git commit -m "feat: create SpecsModal component merging specify+clarify"
```

---

## Phase 3: Update Stage Router

### Task 4: Update STAGE_MODALS in index.tsx

**Files:**
- Modify: `src/components/feature-detail-v2/index.tsx:26-41`

**Step 1: Read current STAGE_MODALS**

```bash
cat src/components/feature-detail-v2/index.tsx | grep -A15 "STAGE_MODALS"
```

**Step 2: Edit STAGE_MODALS**

Replace lines 26-41:
```typescript
// Before
const STAGE_MODALS = {
  backlog: SpecifyModal,
  specify: SpecifyModal,
  clarify: ClarifyModal,
  plan: PlanModal,
  tasks: TasksModal,
  analyze: AnalyzeModal,
} as const;

// After
const STAGE_MODALS = {
  backlog: SpecifyModal, // Will auto-generate spec+questions
  specs: SpecsModal,
  plan: PlanModal,
  tasks: TasksModal,
  analyze: AnalyzeModal,
} as const;
```

**Step 3: Add import for SpecsModal**

Add import at top:
```typescript
import { SpecsModal } from './stages/specs-modal';
```

**Step 4: Commit**

```bash
git add src/components/feature-detail-v2/index.tsx
git commit -m "feat: route specs stage to SpecsModal"
```

---

## Phase 4: API - Migration & Auto-Generate

### Task 5: Add migration logic to features API

**Files:**
- Modify: `src/app/api/features/[id]/route.ts`

**Step 1: Read current PATCH handler**

```bash
cat src/app/api/features/[id]/route.ts | grep -A50 "PATCH"
```

**Step 2: Add migration logic**

Find where stage is updated and add migration:

```typescript
// In PATCH handler, when changing stage:
// - specify -> specs: keep specContent
// - clarify -> specs: keep clarificationsContent
// - backlog -> specs: will be handled by data route (auto-generate)

if (body.stage === 'specs' && (currentStage === 'specify' || currentStage === 'clarify')) {
  // Migrate to specs - no content changes needed
  // Just update the stage field
}
```

**Step 3: Commit**

```bash
git add src/app/api/features/[id]/route.ts
git commit -m "feat: handle specify/clarify to specs migration"
```

---

### Task 6: Add auto-generate logic for backlog → specs

**Files:**
- Modify: `src/app/api/project/[name]/data/route.ts`

**Step 1: Read current data loading logic**

```bash
cat src/app/api/project/[name]/data/route.ts | grep -A30 "export async function GET"
```

**Step 2: Add auto-generate trigger**

When loading feature with `stage = 'specs'` from `previousStage = 'backlog'`, trigger auto-generate:

```typescript
// After loading feature data, check if we need to auto-generate
// This happens when transitioning from backlog to specs
// The actual generation is handled client-side after modal opens
```

Actually, the auto-generate should happen in the feature detail modal when it loads, not in the data route. Let's update the client-side instead.

**Step 3: Commit**

```bash
git add src/app/api/project/[name]/data/route.ts
git commit -m "feat: add data route support for specs stage"
```

---

## Phase 5: Database Migration

### Task 7: Create Prisma migration for stage names

**Step 1: Generate migration**

```bash
pnpm prisma migrate dev --name merge_specify_clarify_to_specs
```

**Step 2: This will update the database enum**

The migration should:
- Rename 'specify' to 'specs' in the database
- Rename 'clarify' to 'specs' in the database

**Step 3: Commit**

```bash
git add prisma/
git commit -m "feat: add migration for specify/clarify to specs stage merge"
```

---

## Phase 6: Testing

### Task 8: Test the SPECS modal

**Step 1: Start dev server**

```bash
pnpm dev
```

**Step 2: Test scenarios**

1. Create new feature → should show in backlog
2. Click "Chuyển sang Specs" → should auto-generate spec + questions → show SPECS modal
3. Existing feature in 'specify' → open → should show SPECS modal with content
4. Existing feature in 'clarify' → open → should show SPECS modal with content
5. Generate Spec button → should create spec content
6. Generate Questions button → should create questions (enabled even without spec per design)
7. Answer questions → All Answered checkbox → Next: Plan button enables

**Step 3: Commit**

```bash
git add .
git commit -m "test: verify SPECS modal functionality"
```

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Update FeatureStage type |
| 2 | Update STAGES config |
| 3 | Create SpecsModal component |
| 4 | Update STAGE_MODALS router |
| 5 | Add migration logic to features API |
| 6 | Add data route support |
| 7 | Create Prisma migration |
| 8 | Test and verify |
