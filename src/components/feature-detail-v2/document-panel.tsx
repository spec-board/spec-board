'use client';

import { useEffect, useMemo } from 'react';
import { FileText, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DocumentPanelProps } from './types';
import { DocumentSelector } from './document-selector';
import { getDocumentOptions } from './types';
import { MarkdownRenderer } from '@/components/markdown-renderer';

export function DocumentPanel({
  feature,
  selectedDocument,
  onDocumentChange,
  highlightTaskId,
  contentRef,
  onEditClarifications,
}: DocumentPanelProps) {
  const documentOptions = useMemo(() => getDocumentOptions(feature), [feature]);

  // Get current document content
  const currentContent = useMemo(() => {
    const option = documentOptions.find(o => o.type === selectedDocument);
    return option?.content || null;
  }, [documentOptions, selectedDocument]);

  // Scroll to highlighted task when it changes
  useEffect(() => {
    if (highlightTaskId && contentRef.current) {
      // Try to find the task ID in the content
      const taskElement = contentRef.current.querySelector(`[data-task-id="${highlightTaskId}"]`);
      if (taskElement) {
        taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add highlight animation
        taskElement.classList.add('highlight-flash');
        setTimeout(() => taskElement.classList.remove('highlight-flash'), 2000);
      } else {
        // Fallback: search for task ID text in the content
        const content = contentRef.current;
        const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
          if (node.textContent?.includes(highlightTaskId)) {
            const parent = node.parentElement;
            if (parent) {
              parent.scrollIntoView({ behavior: 'smooth', block: 'center' });
              parent.classList.add('highlight-flash');
              setTimeout(() => parent.classList.remove('highlight-flash'), 2000);
            }
            break;
          }
        }
      }
    }
  }, [highlightTaskId, contentRef]);

  // Empty state when no content
  if (!currentContent) {
    return (
      <div className="h-full flex flex-col bg-[var(--card)]">
        {/* Header with selector */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-[var(--border)]">
          <DocumentSelector
            options={documentOptions}
            selected={selectedDocument}
            onChange={onDocumentChange}
          />
        </div>

        {/* Empty state */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <FileText className="w-12 h-12 text-[var(--muted-foreground)] opacity-50 mb-3" />
          <p className="text-sm text-[var(--muted-foreground)]">No content available</p>
          <p className="text-xs text-[var(--muted-foreground)] opacity-70 mt-1">
            This document hasn&apos;t been created yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--card)]">
      {/* Header with selector */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex-1">
          <DocumentSelector
            options={documentOptions}
            selected={selectedDocument}
            onChange={onDocumentChange}
          />
        </div>
        {selectedDocument === 'clarifications' && onEditClarifications && (
          <button
            onClick={onEditClarifications}
            className="ml-3 btn btn-primary btn-sm"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit
          </button>
        )}
      </div>

      {/* Document content */}
      <div
        ref={contentRef}
        className={cn(
          'flex-1 overflow-y-auto p-6',
          'prose prose-sm max-w-none dark:prose-invert',
          'prose-headings:text-[var(--foreground)]',
          'prose-p:text-[var(--foreground)]',
          'prose-code:text-[var(--primary)] prose-code:bg-[var(--accent-muted)] prose-code:px-1 prose-code:rounded',
          'prose-pre:bg-[var(--muted)] prose-pre:text-[var(--foreground)]',
          'prose-li:text-[var(--foreground)]',
          'prose-a:text-[var(--primary)] prose-a:no-underline hover:prose-a:underline'
        )}
      >
        <MarkdownRenderer content={currentContent} />
      </div>

      {/* CSS for highlight animation */}
      <style jsx global>{`
        .highlight-flash {
          animation: highlight-pulse 2s ease-out;
        }

        @keyframes highlight-pulse {
          0% {
            background-color: var(--accent-muted);
            box-shadow: 0 0 0 2px var(--ring);
          }
          100% {
            background-color: transparent;
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  );
}
