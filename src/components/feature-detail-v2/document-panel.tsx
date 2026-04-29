'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { FileText, Edit3, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DocumentPanelProps, DocumentType } from './types';
import { DocumentSelector } from './document-selector';
import { getDocumentOptions } from './types';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { MarkdownEditor } from '@/components/markdown-editor';

const DOCUMENT_FIELD_MAP: Record<DocumentType, string> = {
  spec: 'specContent',
  plan: 'planContent',
  tasks: 'tasksContent',
  clarifications: 'clarificationsContent',
  research: 'researchContent',
  'data-model': 'dataModelContent',
  quickstart: 'quickstartContent',
  contract: 'contractsContent',
  checklist: 'checklistsContent',
  analysis: 'analysisContent',
};

export function DocumentPanel({
  feature,
  featureId,
  selectedDocument,
  onDocumentChange,
  highlightTaskId,
  contentRef,
  onEditClarifications,
  onContentSaved,
}: DocumentPanelProps) {
  const documentOptions = useMemo(() => getDocumentOptions(feature), [feature]);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentContent = useMemo(() => {
    const option = documentOptions.find(o => o.type === selectedDocument);
    const raw = option?.content || null;
    if (!raw) return null;
    return raw.replace(/\[object Object\]/g, '').replace(/\n{3,}/g, '\n\n').trim();
  }, [documentOptions, selectedDocument]);

  // Reset editing state when switching documents
  useEffect(() => {
    setIsEditing(false);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }, [selectedDocument]);

  // Sync edit content when entering edit mode or content changes externally
  useEffect(() => {
    if (isEditing && currentContent) {
      setEditContent(currentContent);
    }
  }, [isEditing]);

  const handleToggleEdit = useCallback(() => {
    if (!isEditing && currentContent) {
      setEditContent(currentContent);
    }
    setIsEditing(prev => !prev);
  }, [isEditing, currentContent]);

  const handleContentChange = useCallback((value: string) => {
    setEditContent(value);

    // Debounced auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(async () => {
      const fieldName = DOCUMENT_FIELD_MAP[selectedDocument];
      if (!fieldName || !featureId) return;

      setIsSaving(true);
      try {
        const res = await fetch(`/api/features/${featureId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [fieldName]: value }),
        });
        if (res.ok) {
          onContentSaved?.();
        }
      } catch {
        // Silent fail — user can retry with manual save
      } finally {
        setIsSaving(false);
      }
    }, 1500);
  }, [selectedDocument, featureId, onContentSaved]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Scroll to highlighted task
  useEffect(() => {
    if (highlightTaskId && contentRef.current && !isEditing) {
      const taskElement = contentRef.current.querySelector(`[data-task-id="${highlightTaskId}"]`);
      if (taskElement) {
        taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        taskElement.classList.add('highlight-flash');
        setTimeout(() => taskElement.classList.remove('highlight-flash'), 2000);
      } else {
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
  }, [highlightTaskId, contentRef, isEditing]);

  if (!currentContent && !isEditing) {
    return (
      <div className="h-full flex flex-col bg-[var(--card)]">
        <div className="flex-shrink-0 px-4 py-3 border-b border-[var(--border)]">
          <DocumentSelector
            options={documentOptions}
            selected={selectedDocument}
            onChange={onDocumentChange}
          />
        </div>
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
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex-1">
          <DocumentSelector
            options={documentOptions}
            selected={selectedDocument}
            onChange={onDocumentChange}
          />
        </div>
        <div className="flex items-center gap-2 ml-3">
          {isSaving && (
            <span className="text-xs text-[var(--muted-foreground)]">Saving...</span>
          )}
          {selectedDocument === 'clarifications' && !isEditing && onEditClarifications && (
            <button
              onClick={onEditClarifications}
              className="btn btn-primary btn-sm"
            >
              Edit
            </button>
          )}
          {currentContent && selectedDocument !== 'clarifications' && (
            <button
              onClick={handleToggleEdit}
              className={cn(
                "btn-icon",
                isEditing && "bg-[var(--secondary)]"
              )}
              title={isEditing ? 'Preview' : 'Edit'}
            >
              {isEditing ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="flex-1 overflow-hidden">
          <MarkdownEditor
            value={editContent}
            onChange={handleContentChange}
            placeholder="Write markdown here..."
            className="h-full"
          />
        </div>
      ) : (
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto p-6"
        >
          <MarkdownRenderer content={currentContent || ''} />
        </div>
      )}

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
