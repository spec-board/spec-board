'use client';

import { useState, useEffect, useCallback } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { InlineMarkdown } from '@/components/markdown-renderer';

export interface ClarificationQuestion {
  question: string;
  answer?: string;
}

interface ClarificationFormProps {
  content: string; // Markdown content from clarificationsContent
  featureId: string;
  projectId: string;
  onSaved?: () => void;
  readOnly?: boolean;
  onAllAnsweredChange?: (allAnswered: boolean) => void;
}

export function ClarificationForm({
  content,
  featureId,
  projectId,
  onSaved,
  readOnly = false,
  onAllAnsweredChange,
}: ClarificationFormProps) {
  const [questions, setQuestions] = useState<ClarificationQuestion[]>([]);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Parse markdown content to extract Q&A
  useEffect(() => {
    const parsed = parseClarificationsMarkdown(content);
    setQuestions(parsed);
  }, [content]);

  // Notify parent when all questions are answered
  useEffect(() => {
    const allAnswered = questions.length > 0 && questions.every(q => q.answer && q.answer.trim() !== '');
    onAllAnsweredChange?.(allAnswered);
  }, [questions, onAllAnsweredChange]);

  const handleAnswerChange = (index: number, answer: string) => {
    setQuestions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], answer };
      return updated;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    setSaving(true);
    try {
      const response = await fetch('/api/spec-workflow/clarify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          featureId,
          questions: questions.map(q => ({
            question: q.question,
            answer: q.answer || '',
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save clarifications');
      }

      setHasChanges(false);
      toast.success('Clarifications saved');
      onSaved?.();
    } catch (error) {
      console.error('Error saving clarifications:', error);
      toast.error('Failed to save clarifications');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with save button */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <h3 className="font-medium text-sm">Clarification Questions</h3>
        {!readOnly && hasChanges && (
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium',
              'bg-primary text-primary-foreground hover:bg-primary/90',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : 'Save Answers'}
          </button>
        )}
      </div>

      {/* Questions list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {questions.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)] text-center py-8">
            No clarification questions yet
          </p>
        ) : (
          questions.map((item, index) => (
            <div key={index} className={cn('space-y-2', readOnly && 'opacity-80')}>
              <label className="block text-sm font-medium text-[var(--foreground)]">
                <span className="text-[var(--muted-foreground)]">{index + 1}.</span>{' '}
                <InlineMarkdown content={item.question} />
              </label>
              {readOnly ? (
                <div className="px-3 py-2 rounded-md text-sm bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)]">
                  {item.answer || <span className="italic text-[var(--muted-foreground)]">No answer provided</span>}
                </div>
              ) : (
                <textarea
                  value={item.answer || ''}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  placeholder="Enter your answer..."
                  rows={3}
                  className={cn(
                    'w-full px-3 py-2 rounded-md text-sm',
                    'bg-[var(--background)] text-[var(--foreground)]',
                    'border border-[var(--border)]',
                    'focus:outline-none focus:ring-2 focus:ring-primary/50',
                    'resize-none'
                  )}
                />
              )}
            </div>
          ))
        )}
      </div>

      {/* Auto-save hint */}
      {!readOnly && hasChanges && (
        <div className="flex-shrink-0 px-4 py-2 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)]">
          Click &quot;Save Answers&quot; to save your changes before moving to the next stage
        </div>
      )}
    </div>
  );
}

// Parse markdown content to extract Q&A
function parseClarificationsMarkdown(content: string): ClarificationQuestion[] {
  const questions: ClarificationQuestion[] = [];

  // Split content by Q: sections and parse each
  const sections = content.split(/^### Q:/m);

  for (const section of sections) {
    if (!section.trim()) continue;

    // Extract question and answer
    const lines = section.trim().split('\n');
    let question = lines[0]?.trim() || '';

    // Skip header sections (e.g., "# Clarifications", "## Questions & Answers")
    if (!question || question.startsWith('#')) continue;

    // Find answer line
    let answer = '';
    for (const line of lines) {
      const answerMatch = line.match(/^\*\*A\*\*:\s*(.+)$/);
      if (answerMatch) {
        answer = answerMatch[1].trim();
        break;
      }
    }

    // Filter out "_Pending_" as empty answer
    const filteredAnswer = answer === '_Pending_' ? '' : answer;

    questions.push({ question, answer: filteredAnswer });
  }

  return questions;
}
