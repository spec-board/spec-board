'use client';

import { useState } from 'react';
import { ClipboardCheck, ChevronDown, ChevronRight, FolderOpen } from 'lucide-react';
import { MarkdownRenderer } from './markdown-renderer';
import { cn } from '@/lib/utils';
import type { SpecKitFile } from '@/types';

interface ChecklistFileProps {
  file: SpecKitFile;
  defaultExpanded?: boolean;
}

function ChecklistFile({ file, defaultExpanded = false }: ChecklistFileProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const fileName = file.path.split('/').pop() || file.path;

  // Extract checklist name from filename (e.g., "ux-checklist.md" -> "UX Checklist")
  const displayName = fileName
    .replace('.md', '')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden mb-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        className="w-full flex items-center gap-3 p-3 bg-[var(--secondary)]/30 hover:bg-[var(--secondary)]/50 transition-colors cursor-pointer"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
        )}
        <ClipboardCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span className="font-medium text-sm flex-1 text-left truncate">{displayName}</span>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-[var(--border)]">
          <MarkdownRenderer content={file.content} />
        </div>
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
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[var(--muted-foreground)]">
          {checklists.length} checklist{checklists.length !== 1 ? 's' : ''} available
        </p>
      </div>
      <div>
        {checklists.map((checklist, index) => (
          <ChecklistFile
            key={checklist.path}
            file={checklist}
            defaultExpanded={index === 0}
          />
        ))}
      </div>
    </div>
  );
}
