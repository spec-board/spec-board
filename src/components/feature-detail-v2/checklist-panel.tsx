'use client';

import { useState, useMemo, useCallback } from 'react';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Feature } from '@/types';

interface ChecklistItem {
  text: string;
  checked: boolean;
  lineIndex: number;
}

interface ChecklistSection {
  title: string;
  items: ChecklistItem[];
}

interface ChecklistPanelProps {
  feature: Feature;
  checklistsContent: string | null;
  onSave?: (content: string) => Promise<void>;
}

function parseChecklistContent(content: string): ChecklistSection[] {
  const lines = content.split('\n');
  const sections: ChecklistSection[] = [];
  let currentSection: ChecklistSection | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Section header
    if (trimmed.startsWith('## ')) {
      currentSection = { title: trimmed.slice(3), items: [] };
      sections.push(currentSection);
      continue;
    }

    // Checklist item
    const checkboxMatch = trimmed.match(/^[-*]\s*\[([ xX])\]\s*(.+)$/);
    if (checkboxMatch && currentSection) {
      currentSection.items.push({
        text: checkboxMatch[2],
        checked: checkboxMatch[1].toLowerCase() === 'x',
        lineIndex: i,
      });
    }
  }

  return sections;
}

function stringifyChecklistContent(sections: ChecklistSection[]): string {
  return sections
    .map(section => {
      const items = section.items
        .map(item => `- [${item.checked ? 'x' : ' '}] ${item.text}`)
        .join('\n');
      return `## ${section.title}\n${items}`;
    })
    .join('\n\n');
}

export function ChecklistPanel({
  feature,
  checklistsContent,
  onSave,
}: ChecklistPanelProps) {
  const [sections, setSections] = useState<ChecklistSection[]>(() => {
    if (!checklistsContent) return [];
    return parseChecklistContent(checklistsContent);
  });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Update sections when content changes
  useMemo(() => {
    if (checklistsContent) {
      setSections(parseChecklistContent(checklistsContent));
    }
  }, [checklistsContent]);

  // Calculate progress
  const { total, completed, percentage } = useMemo(() => {
    const allItems = sections.flatMap(s => s.items);
    const total = allItems.length;
    const completed = allItems.filter(i => i.checked).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  }, [sections]);

  // Toggle a checklist item
  const handleToggle = useCallback((sectionIdx: number, itemIdx: number) => {
    // Compute new content first
    const newSections = [...sections];
    const item = { ...newSections[sectionIdx].items[itemIdx] };
    item.checked = !item.checked;
    newSections[sectionIdx].items[itemIdx] = item;
    const newContent = stringifyChecklistContent(newSections);

    // Update UI immediately (optimistic update)
    setSections(newSections);

    // Then save to database if onSave is provided
    if (!onSave) return;

    setSavingId(`${sectionIdx}-${itemIdx}`);
    onSave(newContent)
      .then(() => {
        setLastSaved(new Date());
      })
      .catch((error) => {
        // Revert on error
        if (checklistsContent) {
          setSections(parseChecklistContent(checklistsContent));
        }
        console.error('Failed to save checklist:', error);
      })
      .finally(() => {
        setSavingId(null);
      });
  }, [sections, checklistsContent, onSave]);

  if (!checklistsContent || sections.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="text-[var(--muted-foreground)] mb-2">
          <Circle className="w-12 h-12 mx-auto mb-3 opacity-50" />
        </div>
        <p className="text-sm text-[var(--muted-foreground)]">No checklist available</p>
        <p className="text-xs text-[var(--muted-foreground)] opacity-70 mt-1">
          Generate a checklist first
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--muted)]">
      {/* Header with progress */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">Checklist</h2>
          <span className="text-xs text-[var(--muted-foreground)]">
            {completed}/{total} items
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              completed === total && total > 0
                ? 'bg-[var(--color-success)]'
                : 'bg-[var(--primary)]'
            )}
            style={{ width: total > 0 ? `${(completed / total) * 100}%` : '0%' }}
          />
        </div>
        {/* Last saved indicator */}
        {lastSaved && (
          <p className="text-xs text-[var(--muted-foreground)] mt-2 text-right">
            Saved {lastSaved.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Scrollable checklist */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {sections.map((section, sectionIdx) => (
          <div key={sectionIdx} className="bg-[var(--card)] rounded-lg shadow-sm border border-[var(--border)] overflow-hidden">
            {/* Section header */}
            <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--card)]">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">
                  {section.title}
                </h3>
                <span className="text-xs text-[var(--muted-foreground)]">
                  {section.items.filter(i => i.checked).length}/{section.items.length}
                </span>
              </div>
            </div>

            {/* Checklist items */}
            <div className="divide-y divide-[var(--border)]">
              {section.items.map((item, itemIdx) => {
                const isSaving = savingId === `${sectionIdx}-${itemIdx}`;
                return (
                  <button
                    key={itemIdx}
                    onClick={() => handleToggle(sectionIdx, itemIdx)}
                    disabled={isSaving}
                    className={cn(
                      "w-full px-4 py-3 flex items-start gap-3 text-left transition-colors",
                      "hover:bg-[var(--muted)]/50 disabled:opacity-50",
                      item.checked && "bg-green-500/5"
                    )}
                  >
                    {isSaving ? (
                      <Loader2 className="w-5 h-5 text-[var(--muted-foreground)] mt-0.5 flex-shrink-0 animate-spin" />
                    ) : item.checked ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-[var(--muted-foreground)] mt-0.5 flex-shrink-0" />
                    )}
                    <span className={cn(
                      "text-sm",
                      item.checked
                        ? "text-[var(--foreground)] line-through opacity-70"
                        : "text-[var(--foreground)]"
                    )}>
                      {item.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
