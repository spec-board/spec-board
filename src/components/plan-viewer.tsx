'use client';

import { useState, useMemo } from 'react';
import { FileText, GitBranch, Calendar, CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronRight, FolderTree } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parsePlanContent } from '@/lib/markdown-parsers';
import { MarkdownRenderer } from './markdown-renderer';
import type { ParsedPlan, ConstitutionCheckData, ComplexityTrackingData, ProjectStructureItem, PlanSection } from '@/types';

interface PlanViewerProps {
  content: string | null;
  filePath?: string;
  className?: string;
}

function StatusIcon({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase().trim();
  if (normalizedStatus.includes('✅') || normalizedStatus.includes('yes') || normalizedStatus.includes('pass')) {
    return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  }
  if (normalizedStatus.includes('❌') || normalizedStatus.includes('no') || normalizedStatus.includes('fail')) {
    return <XCircle className="w-4 h-4 text-red-500" />;
  }
  return <AlertCircle className="w-4 h-4 text-yellow-500" />;
}

function MetadataSection({ metadata }: { metadata: ParsedPlan['metadata'] }) {
  if (!metadata.branch && !metadata.date && !metadata.specLink && !metadata.input) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-4 p-3 bg-[var(--secondary)]/30 rounded-lg mb-4">
      {metadata.branch && (
        <div className="flex items-center gap-2 text-sm">
          <GitBranch className="w-4 h-4 text-[var(--muted-foreground)]" />
          <code className="px-2 py-0.5 bg-[var(--secondary)] rounded text-xs">{metadata.branch}</code>
        </div>
      )}
      {metadata.date && (
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-[var(--muted-foreground)]" />
          <span>{metadata.date}</span>
        </div>
      )}
      {metadata.input && (
        <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <span className="font-medium">Input:</span>
          <span>{metadata.input}</span>
        </div>
      )}
    </div>
  );
}

function ConstitutionCheckSection({ data }: { data: ConstitutionCheckData }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (data.items.length === 0 && !data.note) return null;

  const passCount = data.items.filter(i =>
    i.status.toLowerCase().includes('✅') ||
    i.status.toLowerCase().includes('yes') ||
    i.status.toLowerCase().includes('pass')
  ).length;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2 hover:bg-[var(--secondary)]/30 p-2 rounded-lg transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <h3 className="font-semibold">Constitution Check</h3>
        {data.items.length > 0 && (
          <span className="text-xs text-[var(--muted-foreground)] ml-auto">
            {passCount}/{data.items.length} passed
          </span>
        )}
      </button>
      {isExpanded && (
        <div className="space-y-3">
          {data.items.length > 0 && (
            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[var(--secondary)]/50">
                  <tr>
                    <th className="text-left p-2 font-medium">Principle</th>
                    <th className="text-left p-2 font-medium">Requirement</th>
                    <th className="text-center p-2 font-medium w-20">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item, idx) => (
                    <tr key={idx} className="border-t border-[var(--border)]">
                      <td className="p-2 font-medium">{item.principle}</td>
                      <td className="p-2 text-[var(--muted-foreground)]">{item.requirement}</td>
                      <td className="p-2 text-center">
                        <StatusIcon status={item.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {data.note && (
            <div className="p-3 bg-[var(--secondary)]/30 rounded-lg border-l-4 border-green-500">
              <p className="text-sm text-[var(--muted-foreground)] italic">{data.note}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TechnicalContextSection({ context }: { context: Record<string, string> }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const entries = Object.entries(context);

  if (entries.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2 hover:bg-[var(--secondary)]/30 p-2 rounded-lg transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <h3 className="font-semibold">Technical Context</h3>
      </button>
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 bg-[var(--secondary)]/30 rounded-lg">
          {entries.map(([key, value]) => (
            <div key={key} className="flex flex-col">
              <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">{key}</span>
              <span className="text-sm font-medium">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QualityGatesSection({ gates }: { gates: string[] }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (gates.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2 hover:bg-[var(--secondary)]/30 p-2 rounded-lg transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <h3 className="font-semibold">Quality Gates</h3>
        <span className="text-xs text-[var(--muted-foreground)] ml-auto">{gates.length} gates</span>
      </button>
      {isExpanded && (
        <ul className="space-y-1 p-3 bg-[var(--secondary)]/30 rounded-lg">
          {gates.map((gate, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>{gate}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProjectStructureSection({ structures }: { structures: ProjectStructureItem[] }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (structures.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2 hover:bg-[var(--secondary)]/30 p-2 rounded-lg transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <FolderTree className="w-4 h-4" />
        <h3 className="font-semibold">Project Structure</h3>
      </button>
      {isExpanded && (
        <div className="space-y-3">
          {structures.map((structure, idx) => (
            <div key={idx}>
              <h4 className="text-sm font-medium mb-1 text-[var(--muted-foreground)]">{structure.title}</h4>
              <pre className="text-xs font-mono bg-[var(--secondary)]/50 p-3 rounded-lg overflow-x-auto">
                {structure.codeBlock}
              </pre>
              {structure.description && (
                <div className="mt-2">
                  <MarkdownRenderer content={structure.description} className="text-sm" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ComplexityTrackingSection({ data }: { data: ComplexityTrackingData }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (data.items.length === 0 && !data.note) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2 hover:bg-[var(--secondary)]/30 p-2 rounded-lg transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <h3 className="font-semibold">Complexity Tracking</h3>
      </button>
      {isExpanded && (
        <div className="space-y-3">
          {data.note && (
            <div className="p-3 bg-[var(--secondary)]/30 rounded-lg border-l-4 border-green-500">
              <p className="text-sm text-[var(--muted-foreground)] italic">{data.note}</p>
            </div>
          )}
          {data.items.length > 0 && (
            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[var(--secondary)]/50">
                  <tr>
                    <th className="text-left p-2 font-medium">Aspect</th>
                    <th className="text-left p-2 font-medium">Decision</th>
                    <th className="text-left p-2 font-medium">Rationale</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item, idx) => (
                    <tr key={idx} className="border-t border-[var(--border)]">
                      <td className="p-2 font-medium">{item.aspect}</td>
                      <td className="p-2">{item.decision}</td>
                      <td className="p-2 text-[var(--muted-foreground)]">{item.rationale}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OtherSectionCard({ section }: { section: PlanSection }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2 hover:bg-[var(--secondary)]/30 p-2 rounded-lg transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <h3 className="font-semibold">{section.title}</h3>
      </button>
      {isExpanded && (
        <div className="p-3 bg-[var(--secondary)]/30 rounded-lg">
          <pre className="text-sm whitespace-pre-wrap font-sans">{section.content}</pre>
        </div>
      )}
    </div>
  );
}

function StructuredPlanView({ parsed }: { parsed: ParsedPlan }) {
  return (
    <div className="space-y-2">
      <MetadataSection metadata={parsed.metadata} />

      {parsed.summary && (
        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h3 className="font-semibold mb-2 text-blue-400">Summary</h3>
          <p className="text-sm">{parsed.summary}</p>
        </div>
      )}

      <TechnicalContextSection context={parsed.technicalContext} />
      <ConstitutionCheckSection data={parsed.constitutionCheck} />
      <QualityGatesSection gates={parsed.qualityGates} />
      <ProjectStructureSection structures={parsed.projectStructure} />
      <ComplexityTrackingSection data={parsed.complexityTracking} />

      {/* Other sections not specifically parsed */}
      {parsed.otherSections.map((section, idx) => (
        <OtherSectionCard key={idx} section={section} />
      ))}
    </div>
  );
}

export function PlanViewer({ content, filePath, className }: PlanViewerProps) {
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);

  const parsed = useMemo(() => {
    if (!content) return null;
    return parsePlanContent(content);
  }, [content]);

  if (!content) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-zinc-500', className)}>
        <FileText className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No plan yet</p>
        <p className="text-sm mt-2">Create a plan.md file to define implementation details</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)}>
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
          {content}
        </pre>
      ) : (
        parsed && <StructuredPlanView parsed={parsed} />
      )}
    </div>
  );
}
