'use client';

import { useState } from 'react';
import {
  FileText,
  Scale,
  ChevronDown,
  ChevronRight,
  Calendar,
  Tag,
  BookOpen,
  Shield,
  Workflow,
  Gavel,
  ListChecks
} from 'lucide-react';
import { MarkdownRenderer } from './markdown-renderer';
import { cn } from '@/lib/utils';
import type { Constitution, ConstitutionPrinciple, ConstitutionSection } from '@/types';

interface ConstitutionViewerProps {
  constitution: Constitution | null;
  className?: string;
}

// Get icon for section based on name
function getSectionIcon(name: string) {
  const nameLower = name.toLowerCase();
  if (nameLower.includes('quality')) return ListChecks;
  if (nameLower.includes('workflow') || nameLower.includes('development')) return Workflow;
  if (nameLower.includes('governance')) return Gavel;
  if (nameLower.includes('security')) return Shield;
  return BookOpen;
}

// Principle Card component
function PrincipleCard({ principle, index }: { principle: ConstitutionPrinciple; index: number }) {
  const [isExpanded, setIsExpanded] = useState(index === 0); // First one expanded by default

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-[var(--secondary)]/30 transition-colors text-left"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
        )}
        <Scale className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <span className="font-medium flex-1">{principle.name}</span>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pl-11">
          <div className="text-sm text-[var(--muted-foreground)] prose prose-invert prose-sm max-w-none">
            <MarkdownRenderer content={principle.description} />
          </div>
        </div>
      )}
    </div>
  );
}

// Section Card component
function SectionCard({ section }: { section: ConstitutionSection }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const Icon = getSectionIcon(section.name);

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-[var(--secondary)]/30 transition-colors text-left"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
        )}
        <Icon className="w-4 h-4 text-purple-400 flex-shrink-0" />
        <span className="font-medium flex-1">{section.name}</span>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 pl-11">
          <div className="text-sm text-[var(--muted-foreground)] prose prose-invert prose-sm max-w-none">
            <MarkdownRenderer content={section.content} />
          </div>
        </div>
      )}
    </div>
  );
}

export function ConstitutionViewer({ constitution, className }: ConstitutionViewerProps) {
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);

  if (!constitution) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-[var(--muted-foreground)]', className)}>
        <FileText className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No constitution defined</p>
        <p className="text-sm mt-2">Run <code className="bg-[var(--secondary)] px-1 rounded">/speckit.constitution</code> to create one</p>
      </div>
    );
  }

  // Check if we have structured content
  const hasStructuredContent = constitution.principles.length > 0 || constitution.sections.length > 0;

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Toolbar */}
      {hasStructuredContent && (
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
      )}

      {/* Content */}
      {showRawMarkdown || !hasStructuredContent ? (
        <MarkdownRenderer content={constitution.rawContent} />
      ) : (
        <div className="space-y-6">
          {/* Header with version info */}
          <div className="bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 border border-[var(--border)] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Gavel className="w-6 h-6 text-purple-400" />
              <h1 className="text-xl font-bold">Project Constitution</h1>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              {constitution.version && (
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[var(--muted-foreground)]" />
                  <span className="text-[var(--muted-foreground)]">Version</span>
                  <code className="bg-[var(--secondary)] px-2 py-0.5 rounded text-xs">
                    {constitution.version}
                  </code>
                </div>
              )}
              {constitution.ratifiedDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[var(--muted-foreground)]" />
                  <span className="text-[var(--muted-foreground)]">Ratified</span>
                  <span className="text-[var(--foreground)]">{constitution.ratifiedDate}</span>
                </div>
              )}
              {constitution.lastAmendedDate && constitution.lastAmendedDate !== constitution.ratifiedDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[var(--muted-foreground)]" />
                  <span className="text-[var(--muted-foreground)]">Amended</span>
                  <span className="text-[var(--foreground)]">{constitution.lastAmendedDate}</span>
                </div>
              )}
            </div>
          </div>

          {/* Core Principles */}
          {constitution.principles.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-4 flex items-center gap-2">
                <Scale className="w-4 h-4" />
                Core Principles ({constitution.principles.length})
              </h2>
              <div className="space-y-3">
                {constitution.principles.map((principle, index) => (
                  <PrincipleCard key={index} principle={principle} index={index} />
                ))}
              </div>
            </div>
          )}

          {/* Other Sections */}
          {constitution.sections.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Sections ({constitution.sections.length})
              </h2>
              <div className="space-y-3">
                {constitution.sections.map((section, index) => (
                  <SectionCard key={index} section={section} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
