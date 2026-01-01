'use client';

import { useState, useMemo } from 'react';
import { BookOpen, ChevronDown, ChevronRight, Lightbulb, Calendar, XCircle, Zap, Accessibility, Keyboard, Tag, Focus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseResearchAST } from '@/lib/markdown';
import type { ParsedResearch, TechnologyDecision, ResearchSection } from '@/types';

interface ResearchViewerProps {
  content: string | null;
  filePath?: string;
  className?: string;
}

function TechnologyDecisionCard({ decision }: { decision: TechnologyDecision }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden mb-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left p-3 bg-[var(--secondary)]/30 hover:bg-[var(--secondary)]/50 transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <span className="text-xs text-[var(--muted-foreground)] font-mono">#{decision.id}</span>
        <h4 className="font-medium flex-1">{decision.title}</h4>
      </button>

      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Decision */}
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Decision</span>
              <p className="text-sm font-medium">{decision.decision}</p>
            </div>
          </div>

          {/* Rationale */}
          {decision.rationale.length > 0 && (
            <div>
              <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Rationale</span>
              <ul className="mt-1 space-y-1">
                {decision.rationale.map((item, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Alternatives */}
          {decision.alternatives.length > 0 && (
            <div>
              <span className="text-xs text-[var(--muted-foreground)] uppercase tracking-wide">Alternatives Considered</span>
              <ul className="mt-1 space-y-1">
                {decision.alternatives.map((alt, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <XCircle className="w-3 h-3 text-red-400 mt-1 flex-shrink-0" />
                    <span>
                      <span className="font-medium">{alt.name}:</span>{' '}
                      <span className="text-[var(--muted-foreground)]">{alt.reason}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TechnologyDecisionsSection({ decisions }: { decisions: TechnologyDecision[] }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (decisions.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2 hover:bg-[var(--secondary)]/30 p-2 rounded-lg transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <Lightbulb className="w-4 h-4 text-yellow-500" />
        <h3 className="font-semibold">Technology Decisions</h3>
        <span className="text-xs text-[var(--muted-foreground)] ml-auto">{decisions.length} decisions</span>
      </button>
      {isExpanded && (
        <div className="space-y-2">
          {decisions.map((decision) => (
            <TechnologyDecisionCard key={decision.id} decision={decision} />
          ))}
        </div>
      )}
    </div>
  );
}

function OtherSectionCard({ section }: { section: ResearchSection }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="mb-3">
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

function parseSubsections(content: string): { title: string; items: string[] }[] {
  const subsections: { title: string; items: string[] }[] = [];
  const regex = /### ([^\n]+)\n([\s\S]*?)(?=\n### |$)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const title = match[1].trim();
    const itemsContent = match[2].trim();
    const items: string[] = [];
    const lines = itemsContent.split('\n');
    for (const line of lines) {
      const itemMatch = line.match(/^-\s*(.+)/);
      if (itemMatch) items.push(itemMatch[1].trim());
    }
    subsections.push({ title, items });
  }
  return subsections;
}

function renderCodeInText(text: string, colorClass: string) {
  return text.split('`').map((part, i) =>
    i % 2 === 1 ? (
      <code key={i} className={cn('px-1 py-0.5 rounded text-xs font-mono', colorClass)}>
        {part}
      </code>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function PerformanceSection({ section }: { section: ResearchSection }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const subsections = parseSubsections(section.content);

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2 hover:bg-[var(--secondary)]/30 p-2 rounded-lg transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <Zap className="w-4 h-4 text-orange-500" />
        <h3 className="font-semibold">{section.title}</h3>
      </button>
      {isExpanded && (
        <div className="border border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-yellow-500/5 rounded-lg p-4 space-y-4">
          {subsections.map((sub, idx) => (
            <div key={idx} className="bg-[var(--background)]/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-3 h-3 text-orange-400" />
                <h4 className="text-sm font-semibold text-orange-400">{sub.title}</h4>
              </div>
              <ul className="space-y-1.5">
                {sub.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="text-sm flex items-start gap-2">
                    <span className="text-orange-500 mt-1">▸</span>
                    <span>{renderCodeInText(item, 'bg-orange-500/20 text-orange-300')}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AccessibilitySection({ section }: { section: ResearchSection }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const subsections = parseSubsections(section.content);

  const getSubsectionStyle = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('keyboard')) return { icon: Keyboard, color: 'blue' };
    if (t.includes('aria')) return { icon: Tag, color: 'purple' };
    if (t.includes('focus')) return { icon: Focus, color: 'cyan' };
    return { icon: Accessibility, color: 'blue' };
  };

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2 hover:bg-[var(--secondary)]/30 p-2 rounded-lg transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <Accessibility className="w-4 h-4 text-blue-500" />
        <h3 className="font-semibold">{section.title}</h3>
      </button>
      {isExpanded && (
        <div className="border border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {subsections.map((sub, idx) => {
              const style = getSubsectionStyle(sub.title);
              const Icon = style.icon;
              const colorMap = {
                blue: { text: 'text-blue-400', bullet: 'text-blue-500', code: 'bg-blue-500/20 text-blue-300' },
                purple: { text: 'text-purple-400', bullet: 'text-purple-500', code: 'bg-purple-500/20 text-purple-300' },
                cyan: { text: 'text-cyan-400', bullet: 'text-cyan-500', code: 'bg-cyan-500/20 text-cyan-300' },
              } as const;
              const colorClasses = colorMap[style.color as keyof typeof colorMap] ?? colorMap.blue;
              return (
                <div key={idx} className="bg-[var(--background)]/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={cn('w-3 h-3', colorClasses.text)} />
                    <h4 className={cn('text-sm font-semibold', colorClasses.text)}>{sub.title}</h4>
                  </div>
                  <ul className="space-y-1.5">
                    {sub.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="text-xs flex items-start gap-1.5">
                        <span className={cn('mt-0.5', colorClasses.bullet)}>•</span>
                        <span className="text-[var(--muted-foreground)]">
                          {renderCodeInText(item, colorClasses.code)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function renderSection(section: ResearchSection, idx: number) {
  const titleLower = section.title.toLowerCase();
  if (titleLower.includes('performance')) {
    return <PerformanceSection key={idx} section={section} />;
  }
  if (titleLower.includes('accessibility')) {
    return <AccessibilitySection key={idx} section={section} />;
  }
  return <OtherSectionCard key={idx} section={section} />;
}

function StructuredResearchView({ parsed }: { parsed: ParsedResearch }) {
  return (
    <div className="space-y-2">
      {/* Metadata */}
      {(parsed.feature || parsed.date) && (
        <div className="flex flex-wrap gap-4 p-3 bg-[var(--secondary)]/30 rounded-lg mb-4">
          {parsed.feature && (
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="w-4 h-4 text-[var(--muted-foreground)]" />
              <span className="font-medium">{parsed.feature}</span>
            </div>
          )}
          {parsed.date && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-[var(--muted-foreground)]" />
              <span>{parsed.date}</span>
            </div>
          )}
        </div>
      )}

      {/* Technology Decisions */}
      <TechnologyDecisionsSection decisions={parsed.technologyDecisions} />

      {/* Other Sections - with special rendering for Performance and Accessibility */}
      {parsed.otherSections.map((section, idx) => renderSection(section, idx))}
    </div>
  );
}

export function ResearchViewer({ content, filePath, className }: ResearchViewerProps) {
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);

  const parsed = useMemo(() => {
    if (!content) return null;
    return parseResearchAST(content);
  }, [content]);

  if (!content) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-zinc-500', className)}>
        <BookOpen className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No research notes yet</p>
        <p className="text-sm mt-2">Create a research.md file to document technical research</p>
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
        parsed && <StructuredResearchView parsed={parsed} />
      )}
    </div>
  );
}
