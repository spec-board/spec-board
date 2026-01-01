'use client';

import { useState, useMemo } from 'react';
import { CheckCircle2, Circle, FolderOpen, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SpecKitFile } from '@/types';

// Parsed checklist types
interface ChecklistItem {
  text: string;
  checked: boolean;
  tag?: string; // e.g., "[Gap]", "[Clarity]", "[Assumption]"
}

interface ChecklistSection {
  title: string;
  items: ChecklistItem[];
}

interface SummaryTableRow {
  dimension: string;
  items: string;
  status: string;
}

interface ParsedChecklist {
  title: string;
  purpose?: string;
  created?: string;
  feature?: string;
  sections: ChecklistSection[];
  notes: string[];
  summaryTable: SummaryTableRow[];
}

// Parse checklist markdown content
function parseChecklistContent(content: string): ParsedChecklist {
  const lines = content.split('\n');
  const result: ParsedChecklist = {
    title: '',
    sections: [],
    notes: [],
    summaryTable: [],
  };

  let currentSection: ChecklistSection | null = null;
  let inNotesSection = false;
  let inSummarySection = false;
  let summaryTableStarted = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Parse title (# heading)
    if (trimmed.startsWith('# ')) {
      result.title = trimmed.slice(2).trim();
      continue;
    }

    // Parse metadata
    if (trimmed.startsWith('**Purpose**:')) {
      result.purpose = trimmed.replace('**Purpose**:', '').trim();
      continue;
    }
    if (trimmed.startsWith('**Created**:')) {
      result.created = trimmed.replace('**Created**:', '').trim();
      continue;
    }
    if (trimmed.startsWith('**Feature**:')) {
      result.feature = trimmed.replace('**Feature**:', '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
      continue;
    }

    // Parse section headers (## heading)
    if (trimmed.startsWith('## ')) {
      const sectionTitle = trimmed.slice(3).trim();
      const lowerTitle = sectionTitle.toLowerCase();

      if (lowerTitle === 'notes') {
        inNotesSection = true;
        inSummarySection = false;
        currentSection = null;
      } else if (lowerTitle === 'summary') {
        inSummarySection = true;
        inNotesSection = false;
        currentSection = null;
        summaryTableStarted = false;
      } else {
        inNotesSection = false;
        inSummarySection = false;
        currentSection = { title: sectionTitle, items: [] };
        result.sections.push(currentSection);
      }
      continue;
    }

    // Parse summary table rows
    if (inSummarySection && trimmed.startsWith('|')) {
      // Skip header row and separator row
      if (trimmed.includes('Dimension') || trimmed.match(/^\|[-\s|]+\|$/)) {
        summaryTableStarted = true;
        continue;
      }

      if (summaryTableStarted) {
        // Parse table row: | Dimension | Items | Status |
        const cells = trimmed.split('|').map(c => c.trim()).filter(c => c);
        if (cells.length >= 3) {
          // Skip total row (bold text)
          if (!cells[0].startsWith('**')) {
            result.summaryTable.push({
              dimension: cells[0],
              items: cells[1],
              status: cells[2],
            });
          }
        }
      }
      continue;
    }

    // Parse checklist items
    const checkboxMatch = trimmed.match(/^-\s*\[([ xX])\]\s*(.+)$/);
    if (checkboxMatch && currentSection) {
      const checked = checkboxMatch[1].toLowerCase() === 'x';
      let text = checkboxMatch[2].trim();

      // Extract tag like [Gap], [Clarity], [Assumption]
      let tag: string | undefined;
      const tagMatch = text.match(/\[([^\]]+)\]$/);
      if (tagMatch) {
        tag = tagMatch[1];
        text = text.replace(/\s*\[[^\]]+\]$/, '').trim();
      }

      currentSection.items.push({ text, checked, tag });
      continue;
    }

    // Parse notes section content
    if (inNotesSection && trimmed.startsWith('-')) {
      result.notes.push(trimmed.slice(1).trim());
    } else if (inNotesSection && trimmed && !trimmed.startsWith('#')) {
      result.notes.push(trimmed);
    }
  }

  return result;
}

// Checklist item component
function ChecklistItemRow({ item }: { item: ChecklistItem }) {
  return (
    <div className={cn(
      'flex items-start gap-3 py-2 px-3 rounded-lg transition-colors',
      item.checked ? 'bg-emerald-500/5' : 'hover:bg-[var(--secondary)]/30'
    )}>
      {item.checked ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
      ) : (
        <Circle className="w-4 h-4 text-[var(--muted-foreground)] mt-0.5 flex-shrink-0" />
      )}
      <span className={cn(
        'text-sm flex-1',
        item.checked && 'text-[var(--muted-foreground)]'
      )}>
        {item.text}
      </span>
      {item.tag && (
        <span className={cn(
          'text-[10px] px-1.5 py-0.5 rounded font-medium',
          item.tag === 'Gap' && 'bg-red-500/20 text-red-400',
          item.tag === 'Clarity' && 'bg-amber-500/20 text-amber-400',
          item.tag === 'Assumption' && 'bg-blue-500/20 text-blue-400',
          !['Gap', 'Clarity', 'Assumption'].includes(item.tag) && 'bg-[var(--secondary)] text-[var(--muted-foreground)]'
        )}>
          {item.tag}
        </span>
      )}
    </div>
  );
}

// Section component with progress
function ChecklistSectionView({ section }: { section: ChecklistSection }) {
  const completed = section.items.filter(i => i.checked).length;
  const total = section.items.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isComplete = completed === total;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-sm">{section.title}</h3>
        <span className={cn(
          'text-xs font-mono',
          isComplete ? 'text-emerald-400' : 'text-[var(--muted-foreground)]'
        )}>
          {completed}/{total}
        </span>
      </div>
      <div className="h-1 bg-[var(--secondary)] rounded-full overflow-hidden mb-3">
        <div
          className={cn(
            'h-full transition-all duration-300',
            isComplete ? 'bg-emerald-500' : 'bg-blue-500'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="space-y-1">
        {section.items.map((item, index) => (
          <ChecklistItemRow key={index} item={item} />
        ))}
      </div>
    </div>
  );
}

// Summary table component
function SummaryTableView({ rows }: { rows: SummaryTableRow[] }) {
  if (rows.length === 0) return null;

  // Calculate totals
  const totalItems = rows.reduce((sum, r) => sum + parseInt(r.items) || 0, 0);

  return (
    <div className="mb-6">
      <h3 className="font-medium text-sm mb-3">Summary</h3>
      <div className="border border-[var(--border)] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--secondary)]/50">
            <tr>
              <th className="text-left p-2 font-medium">Dimension</th>
              <th className="text-center p-2 font-medium w-20">Items</th>
              <th className="text-center p-2 font-medium w-24">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-t border-[var(--border)]">
                <td className="p-2">{row.dimension}</td>
                <td className="p-2 text-center font-mono text-xs">{row.items}</td>
                <td className="p-2 text-center">
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded',
                    row.status.toLowerCase() === 'pending' && 'bg-amber-500/20 text-amber-400',
                    row.status.toLowerCase() === 'complete' && 'bg-emerald-500/20 text-emerald-400',
                    row.status.toLowerCase() === 'in progress' && 'bg-blue-500/20 text-blue-400',
                    !['pending', 'complete', 'in progress'].includes(row.status.toLowerCase()) && 'bg-[var(--secondary)] text-[var(--muted-foreground)]'
                  )}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
            {/* Total row */}
            <tr className="border-t border-[var(--border)] bg-[var(--secondary)]/30 font-medium">
              <td className="p-2">Total</td>
              <td className="p-2 text-center font-mono text-xs">{totalItems}</td>
              <td className="p-2"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Structured view component
function StructuredChecklistView({ parsed, totalItems, completedItems }: {
  parsed: ParsedChecklist;
  totalItems: number;
  completedItems: number;
}) {
  return (
    <div>
      {/* Header with metadata */}
      {(parsed.purpose || parsed.created || parsed.feature) && (
        <div className="mb-6 p-4 bg-[var(--secondary)]/30 rounded-lg border border-[var(--border)]">
          {parsed.purpose && (
            <p className="text-sm text-[var(--muted-foreground)] mb-1">
              <span className="font-medium text-[var(--foreground)]">Purpose:</span> {parsed.purpose}
            </p>
          )}
          <div className="flex gap-4 text-xs text-[var(--muted-foreground)]">
            {parsed.created && <span>Created: {parsed.created}</span>}
            {parsed.feature && <span>Feature: {parsed.feature}</span>}
          </div>
        </div>
      )}

      {/* Summary table */}
      <SummaryTableView rows={parsed.summaryTable} />

      {/* Overall progress */}
      {totalItems > 0 && (
        <div className="mb-6 flex items-center gap-3">
          <div className="flex-1 h-2 bg-[var(--secondary)] rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-300',
                completedItems === totalItems ? 'bg-emerald-500' : 'bg-blue-500'
              )}
              style={{ width: `${totalItems > 0 ? (completedItems / totalItems) * 100 : 0}%` }}
            />
          </div>
          <span className={cn(
            'text-sm font-mono',
            completedItems === totalItems ? 'text-emerald-400' : 'text-[var(--muted-foreground)]'
          )}>
            {completedItems}/{totalItems}
          </span>
        </div>
      )}

      {/* Sections */}
      {parsed.sections.map((section, index) => (
        <ChecklistSectionView key={index} section={section} />
      ))}

      {/* Notes */}
      {parsed.notes.length > 0 && (
        <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-blue-400" />
            <span className="font-medium text-sm text-blue-400">Notes</span>
          </div>
          <ul className="space-y-1">
            {parsed.notes.map((note, index) => (
              <li key={index} className="text-sm text-[var(--muted-foreground)]">
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Single checklist file component
function ChecklistContent({ file }: { file: SpecKitFile }) {
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);
  const parsed = useMemo(() => parseChecklistContent(file.content), [file.content]);

  // Calculate overall progress
  const totalItems = parsed.sections.reduce((sum, s) => sum + s.items.length, 0);
  const completedItems = parsed.sections.reduce((sum, s) => sum + s.items.filter(i => i.checked).length, 0);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-1 bg-[var(--secondary)] rounded-lg p-1 mb-4" role="tablist" aria-label="View mode">
        <button
          onClick={() => setShowRawMarkdown(false)}
          role="tab"
          aria-selected={!showRawMarkdown}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
            !showRawMarkdown
              ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          )}
        >
          Structured
        </button>
        <button
          onClick={() => setShowRawMarkdown(true)}
          role="tab"
          aria-selected={showRawMarkdown}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
            showRawMarkdown
              ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          )}
        >
          Markdown
        </button>
      </div>

      {/* Content */}
      {showRawMarkdown ? (
        <pre className="text-sm font-mono whitespace-pre-wrap bg-[var(--secondary)]/30 p-4 rounded-lg overflow-auto">
          {file.content}
        </pre>
      ) : (
        <StructuredChecklistView
          parsed={parsed}
          totalItems={totalItems}
          completedItems={completedItems}
        />
      )}
    </div>
  );
}

interface ChecklistViewerProps {
  checklists: SpecKitFile[];
  className?: string;
}

export function ChecklistViewer({ checklists, className }: ChecklistViewerProps) {
  if (!checklists || checklists.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-zinc-500', className)}>
        <FolderOpen className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No checklists yet</p>
        <p className="text-sm mt-2 text-center">
          Run <code className="bg-[var(--secondary)] px-1.5 py-0.5 rounded">/speckit.checklist</code> to generate domain-specific checklists
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {checklists.map((checklist) => (
        <ChecklistContent key={checklist.path} file={checklist} />
      ))}
    </div>
  );
}
