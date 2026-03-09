'use client';

import { useState, useCallback, useMemo } from 'react';
import { HelpCircle } from 'lucide-react';
import { BaseModal } from '../base/base-modal';
import type { BaseModalProps } from '../base/types';
import type { DocumentType } from '../types';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { ClarificationForm } from '../clarification-form';
import { DocumentSelector } from '../document-selector';
import { getDocumentOptions } from '../types';
import { toast } from 'sonner';
import { useProjectStore } from '@/lib/store';

interface SpecsModalProps extends BaseModalProps {
  onRefresh?: () => Promise<void>;
}

export function SpecsModal({
  feature,
  onClose,
  onDelete,
  onRefresh
}: SpecsModalProps) {
  const [selectedDoc, setSelectedDoc] = useState<DocumentType>('spec');

  const project = useProjectStore(state => state.project);
  const projectId = project?.projectId;

  const hasSpec = !!feature.specContent;
  const hasClarifications = !!feature.clarificationsContent;
  const isEditable = feature.stage === 'specs';

  // Check if there are any questions in clarifications
  const hasQuestions = useMemo(() => {
    if (!feature.clarificationsContent) return false;
    const lines = feature.clarificationsContent.split('\n');
    return lines.some(line => line.trim().startsWith('?') || line.includes('?'));
  }, [feature.clarificationsContent]);

  const handleAllAnsweredChange = useCallback((_answered: boolean) => {
    // No longer needed - stage transitions are manual via drag-drop
  }, []);

  const documentOptions = useMemo(() => getDocumentOptions(feature), [feature]);

  const selectedDocContent = useMemo(() => {
    const option = documentOptions.find(o => o.type === selectedDoc);
    return option?.content || null;
  }, [documentOptions, selectedDoc]);

  const handleSaveSuccess = useCallback(() => {
    toast.success('Clarifications saved');
    onRefresh?.();
  }, [onRefresh]);

  return (
    <BaseModal
      feature={feature}
      onClose={onClose}
      onDelete={onDelete}
      headerActions={null}
    >
      <div className="flex h-full">
        {/* Left: Interactive Q&A Panel */}
        <div className="w-[40%] border-r border-[var(--border)] p-6 overflow-y-auto">
          {hasSpec && hasClarifications ? (
            hasQuestions ? (
              <ClarificationForm
                content={feature.clarificationsContent || ''}
                featureId={feature.id}
                projectId={projectId || ''}
                onSaved={handleSaveSuccess}
                readOnly={!isEditable}
                onAllAnsweredChange={handleAllAnsweredChange}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-4">
                  <HelpCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p className="text-[var(--foreground)] font-medium mb-2">
                    No QnA for this feature
                  </p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    The spec is clear and doesn't need clarification questions.
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-4">
                <HelpCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-[var(--foreground)] font-medium mb-2">
                  No content available
                </p>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Spec content will appear here when the feature transitions from backlog to specs.
                </p>
              </div>
            </div>
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
                <p>No content available. Transition from backlog to generate spec.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
