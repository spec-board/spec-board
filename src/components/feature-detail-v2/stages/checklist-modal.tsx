'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2, CheckSquare, AlertCircle, CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { BaseModal } from '../base/base-modal';
import type { BaseModalProps } from '../base/types';
import type { DocumentType } from '../types';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { DocumentSelector } from '../document-selector';
import { getDocumentOptions } from '../types';
import { cn } from '@/lib/utils';
import { STAGES, getStageConfig } from '../base/types';

interface ChecklistModalProps extends BaseModalProps {
  onGenerateChecklist?: () => Promise<void>;
}

type ChecklistStatus = 'idle' | 'generating' | 'ready' | 'error';

// Parse checklist content (simple markdown format)
interface ChecklistItem {
  text: string;
  checked: boolean;
  lineIndex: number;
}

interface ChecklistSection {
  title: string;
  items: ChecklistItem[];
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

export function ChecklistModal({ feature, onClose, onStageChange, onDelete, onGenerateChecklist }: ChecklistModalProps) {
  const [status, setStatus] = useState<ChecklistStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [localContent, setLocalContent] = useState<string>('');
  const [selectedDoc, setSelectedDoc] = useState<DocumentType>('checklist');

  // Check state
  const hasChecklist = !!feature.checklistsContent;
  const hasPlan = !!feature.planContent;

  // Get next stage config
  const currentIndex = STAGES.findIndex(s => s.stage === feature.stage);
  const nextStage = STAGES[currentIndex + 1];
  const nextStageConfig = nextStage ? getStageConfig(nextStage.stage) : null;

  // Get available document options
  const documentOptions = useMemo(() => getDocumentOptions(feature), [feature]);

  // Get content for selected document
  const selectedDocContent = useMemo(() => {
    const option = documentOptions.find(o => o.type === selectedDoc);
    return option?.content || null;
  }, [documentOptions, selectedDoc]);

  // Set initial status
  useEffect(() => {
    if (hasChecklist) {
      setStatus('ready');
      setLocalContent(feature.checklistsContent || '');
    } else if (hasPlan) {
      setStatus('idle');
    }
  }, [hasChecklist, hasPlan, feature.checklistsContent]);

  // Parse checklist content
  const parsedChecklist = useMemo(() => {
    if (!localContent) return [];
    return parseChecklistContent(localContent);
  }, [localContent]);

  // Calculate progress
  const { total, completed, percentage } = useMemo(() => {
    const allItems = parsedChecklist.flatMap(s => s.items);
    const total = allItems.length;
    const completed = allItems.filter(i => i.checked).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  }, [parsedChecklist]);

  const handleGenerateChecklist = async () => {
    if (!onGenerateChecklist) {
      // Would call API here when available
      setError('Checklist generation API not yet implemented');
      setStatus('error');
      return;
    }

    setStatus('generating');
    setError(null);

    try {
      await onGenerateChecklist();
      setStatus('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate checklist');
      setStatus('error');
    }
  };

  // Handle "Continue to Next Stage" button click
  const handleContinueToNextStage = () => {
    if (onStageChange && nextStageConfig) {
      onStageChange(nextStage.stage as any);
    }
  };

  return (
    <BaseModal
      feature={feature}
      onClose={onClose}
      onStageChange={onStageChange}
      onDelete={onDelete}
      headerActions={
        <div className="flex items-center gap-2">
          {hasChecklist && nextStageConfig ? (
            <button
              onClick={handleContinueToNextStage}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors"
            >
              {nextStageConfig.label}
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : status !== 'generating' && (
            <button
              onClick={handleGenerateChecklist}
              disabled={!hasPlan}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
            >
              <CheckSquare className="w-4 h-4" />
              Generate Checklist
            </button>
          )}
        </div>
      }
      showNavigation={hasPlan}
    >
      <div className="flex h-full">
        {/* Left: Progress Overview */}
        <div className="w-[30%] border-r border-[var(--border)] p-6 overflow-y-auto">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
            Checklist Progress
          </h3>

          {status === 'generating' && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 mx-auto mb-4 text-blue-500 animate-spin" />
              <p className="text-[var(--foreground)] font-medium">
                Generating Checklist...
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                Creating quality assurance checklist
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-500 mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Error</span>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] mb-2">
                {error || 'Failed to generate checklist'}
              </p>
              <button
                onClick={handleGenerateChecklist}
                className="text-sm text-blue-500 hover:text-blue-400"
              >
                Try again →
              </button>
            </div>
          )}

          {status === 'idle' && !hasChecklist && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                <CheckSquare className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-[var(--foreground)] font-medium mb-2">
                Quality Assurance Checklist
              </p>
              <p className="text-sm text-[var(--muted-foreground)]">
                Generate a checklist to validate your requirements quality.
              </p>
            </div>
          )}

          {(status === 'ready' || hasChecklist) && parsedChecklist.length > 0 && (
            <div className="space-y-6">
              {/* Progress circle */}
              <div className="flex items-center justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-[var(--muted)]"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${percentage * 3.52} 352`}
                      strokeLinecap="round"
                      className={cn(
                        "transition-all duration-500",
                        percentage >= 80 ? "text-green-500" : percentage > 0 ? "text-blue-500" : "text-[var(--muted)]"
                      )}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-[var(--foreground)]">
                      {percentage}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="text-center">
                <p className="text-sm text-[var(--muted-foreground)]">
                  {completed} of {total} items completed
                </p>
              </div>

              {/* Section summary */}
              <div className="space-y-3">
                {parsedChecklist.map((section, idx) => {
                  const sectionCompleted = section.items.filter(i => i.checked).length;
                  const sectionTotal = section.items.length;
                  return (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm text-[var(--foreground)]">
                        {section.title}
                      </span>
                      <span className={cn(
                        "text-sm",
                        sectionCompleted === sectionTotal
                          ? "text-green-500"
                          : "text-[var(--muted-foreground)]"
                      )}>
                        {sectionCompleted}/{sectionTotal}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Document Viewer with Tabs */}
        <div className="w-[70%] flex flex-col overflow-hidden">
          {/* Horizontal tabs */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
            <DocumentSelector
              options={documentOptions}
              selected={selectedDoc}
              onChange={setSelectedDoc}
            />
          </div>

          {/* Document content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Show checklist when selectedDoc is 'checklist' */}
            {selectedDoc === 'checklist' && !hasChecklist && status === 'idle' && (
              <div className="flex items-center justify-center h-full text-[var(--muted-foreground)]">
                <p>No checklist yet. Click "Generate Checklist" to create one.</p>
              </div>
            )}

            {selectedDoc === 'checklist' && parsedChecklist.length > 0 && (
              <div className="space-y-8">
                {parsedChecklist.map((section, sectionIdx) => (
                  <div key={sectionIdx}>
                    <h3 className="text-md font-semibold text-[var(--foreground)] mb-3 pb-2 border-b border-[var(--border)]">
                      {section.title}
                    </h3>
                    <div className="space-y-2">
                      {section.items.map((item, itemIdx) => (
                        <div
                          key={itemIdx}
                          className={cn(
                            "flex items-start gap-3 p-3 rounded-lg transition-colors",
                            item.checked
                              ? "bg-green-500/10"
                              : "hover:bg-[var(--muted)]/50"
                          )}
                        >
                          {item.checked ? (
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
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}

            {/* Show other document content */}
            {selectedDoc !== 'checklist' && (
              selectedDocContent ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <MarkdownRenderer content={selectedDocContent} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-[var(--muted-foreground)]">
                  <p>No content available for this document.</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
