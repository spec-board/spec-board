'use client';

import React, { useState, useMemo } from 'react';
import { Rocket, ChevronDown, ChevronRight, Terminal, CheckCircle2, Circle, FileCode, Globe, Calendar, Play, ScrollText, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseQuickstartAST } from '@/lib/markdown';
import type { ParsedQuickstart, SetupStep, VerificationItem, VerificationData, KeyFilesData, BrowserSupportData, QuickstartSection, DevelopmentSection, QuickstartSectionOrder } from '@/types';

interface QuickstartViewerProps {
  content: string | null;
  filePath?: string;
  className?: string;
}

function PrerequisitesSection({ prerequisites, title }: { prerequisites: string[]; title?: string }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (prerequisites.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2 hover:bg-[var(--secondary)]/30 p-2 rounded-lg transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <h3 className="font-semibold">{title ?? 'Prerequisites'}</h3>
        <span className="text-xs text-[var(--muted-foreground)] ml-auto">{prerequisites.length} items</span>
      </button>
      {isExpanded && (
        <ul className="space-y-1 p-3 bg-[var(--secondary)]/30 rounded-lg">
          {prerequisites.map((prereq, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--tag-text-info)' }} />
              <span>{prereq}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SetupStepCard({ step }: { step: SetupStep }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden mb-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left p-3 bg-[var(--secondary)]/30 hover:bg-[var(--secondary)]/50 transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-xs font-bold" style={{ color: 'var(--tag-text-info)' }}>
          {step.id}
        </span>
        <h4 className="font-medium flex-1">{step.title}</h4>
      </button>

      {isExpanded && step.commands.length > 0 && (
        <div className="p-3 space-y-2">
          {step.commands.map((cmd, idx) => (
            <div key={idx}>
              {cmd.description && (
                <p className="text-xs text-[var(--muted-foreground)] mb-1">{cmd.description}</p>
              )}
              <div className="relative">
                <pre className="text-xs font-mono bg-zinc-900 text-zinc-100 p-3 rounded-lg overflow-x-auto">
                  {cmd.language && (
                    <span className="absolute top-1 right-2 text-xs text-[var(--muted-foreground)]">{cmd.language}</span>
                  )}
                  {cmd.code}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SetupStepsSection({ steps, title }: { steps: SetupStep[]; title?: string }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (steps.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2 hover:bg-[var(--secondary)]/30 p-2 rounded-lg transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <Terminal className="w-4 h-4" style={{ color: 'var(--tag-text-success)' }} />
        <h3 className="font-semibold">{title ?? 'Setup Steps'}</h3>
        <span className="text-xs text-[var(--muted-foreground)] ml-auto">{steps.length} steps</span>
      </button>
      {isExpanded && (
        <div className="space-y-2">
          {steps.map((step) => (
            <SetupStepCard key={step.id} step={step} />
          ))}
        </div>
      )}
    </div>
  );
}

function VerificationChecklistSection({ data, title }: { data: VerificationData; title?: string }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (data.items.length === 0) return null;

  const checkedCount = data.items.filter(i => i.checked).length;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2 hover:bg-[var(--secondary)]/30 p-2 rounded-lg transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--tag-text-success)' }} />
        <h3 className="font-semibold">{title ?? 'Verification Checklist'}</h3>
        <span className="text-xs text-[var(--muted-foreground)] ml-auto">
          {checkedCount}/{data.items.length} complete
        </span>
      </button>
      {isExpanded && (
        <div className="p-3 bg-[var(--secondary)]/30 rounded-lg">
          {data.intro && (
            <p className="text-sm text-[var(--muted-foreground)] mb-2">{data.intro}</p>
          )}
          <ul className="space-y-1">
            {data.items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                {item.checked ? (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--tag-text-success)' }} />
                ) : (
                  <Circle className="w-4 h-4 text-[var(--muted-foreground)] mt-0.5 flex-shrink-0" />
                )}
                <span className={item.checked ? 'text-[var(--muted-foreground)]' : ''}>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function KeyFilesSection({ data, title }: { data: KeyFilesData; title?: string }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (data.files.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2 hover:bg-[var(--secondary)]/30 p-2 rounded-lg transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <FileCode className="w-4 h-4" style={{ color: 'var(--tag-text-purple)' }} />
        <h3 className="font-semibold">{title ?? 'Key Files to Create'}</h3>
        <span className="text-xs text-[var(--muted-foreground)] ml-auto">{data.files.length} files</span>
      </button>
      {isExpanded && (
        <div className="p-3 bg-[var(--secondary)]/30 rounded-lg">
          {data.intro && (
            <p className="text-sm text-[var(--muted-foreground)] mb-2">{data.intro}</p>
          )}
          <ol className="space-y-1 list-decimal list-inside">
            {data.files.map((file, idx) => (
              <li key={idx} className="text-sm">
                <code className="px-1.5 py-0.5 bg-[var(--secondary)] rounded text-xs font-mono">{file}</code>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function BrowserSupportSection({ data, title }: { data: BrowserSupportData; title?: string }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const totalItems = data.subsections.reduce((sum, sub) => sum + sub.items.length, 0);
  if (totalItems === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2 hover:bg-[var(--secondary)]/30 p-2 rounded-lg transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <Globe className="w-4 h-4" style={{ color: 'var(--tag-text-cyan)' }} />
        <h3 className="font-semibold">{title ?? 'Browser Support'}</h3>
      </button>
      {isExpanded && (
        <div className="p-3 bg-[var(--secondary)]/30 rounded-lg space-y-4">
          {data.subsections.map((subsection, idx) => (
            <div key={idx}>
              {subsection.intro && (
                <p className="text-sm text-[var(--muted-foreground)] mb-2">{subsection.intro}</p>
              )}
              <ul className="space-y-1">
                {subsection.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--tag-text-cyan)' }} />
                    <span>{item}</span>
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

function DevelopmentCommandsSection({ commands, title }: { commands: { title: string; command: string; description?: string }[]; title?: string }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (commands.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2 hover:bg-[var(--secondary)]/30 p-2 rounded-lg transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <Play className="w-4 h-4" style={{ color: 'var(--tag-text-orange)' }} />
        <h3 className="font-semibold">{title ?? 'Development Commands'}</h3>
        <span className="text-xs text-[var(--muted-foreground)] ml-auto">{commands.length} commands</span>
      </button>
      {isExpanded && (
        <div className="space-y-2 p-3 bg-[var(--secondary)]/30 rounded-lg">
          {commands.map((cmd, idx) => (
            <div key={idx}>
              {cmd.description && (
                <p className="text-xs text-[var(--muted-foreground)] mb-1">{cmd.description}</p>
              )}
              <pre className="text-xs font-mono bg-zinc-900 text-zinc-100 p-2 rounded overflow-x-auto">
                {cmd.command}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectScriptsSection({ scripts }: { scripts?: { title: string; content: string } }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!scripts) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2 hover:bg-[var(--secondary)]/30 p-2 rounded-lg transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <ScrollText className="w-4 h-4" style={{ color: 'var(--tag-text-warning)' }} />
        <h3 className="font-semibold">{scripts.title}</h3>
      </button>
      {isExpanded && (
        <pre className="text-xs font-mono bg-zinc-900 text-zinc-100 p-3 rounded-lg overflow-x-auto">
          {scripts.content}
        </pre>
      )}
    </div>
  );
}

function DevelopmentSectionComponent({ development, title }: { development?: DevelopmentSection; title?: string }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!development) return null;

  const hasContent = development.intro || development.subsections.length > 0 || development.codeBlocks.length > 0;
  if (!hasContent) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2 hover:bg-[var(--secondary)]/30 p-2 rounded-lg transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <Code2 className="w-4 h-4" style={{ color: 'var(--tag-text-success)' }} />
        <h3 className="font-semibold">{title ?? 'Development'}</h3>
        {development.subsections.length > 0 && (
          <span className="text-xs text-[var(--muted-foreground)] ml-auto">
            {development.subsections.length} subsection{development.subsections.length !== 1 ? 's' : ''}
          </span>
        )}
      </button>
      {isExpanded && (
        <div className="space-y-3 p-3 bg-[var(--secondary)]/30 rounded-lg">
          {/* Intro text */}
          {development.intro && (
            <p className="text-sm whitespace-pre-wrap">{development.intro}</p>
          )}

          {/* Top-level code blocks */}
          {development.codeBlocks.map((block, idx) => (
            <div key={`top-${idx}`} className="relative">
              <pre className="text-xs font-mono bg-zinc-900 text-zinc-100 p-3 rounded-lg overflow-x-auto">
                {block.language && (
                  <span className="absolute top-1 right-2 text-xs text-[var(--muted-foreground)]">{block.language}</span>
                )}
                {block.code}
              </pre>
            </div>
          ))}

          {/* Subsections */}
          {development.subsections.map((subsection, idx) => (
            <div key={idx} className="border-l-2 border-emerald-500/30 pl-3">
              <h4 className="font-medium text-sm mb-2">{subsection.title}</h4>
              {subsection.content && (
                <p className="text-sm text-[var(--muted-foreground)] mb-2 whitespace-pre-wrap">{subsection.content}</p>
              )}
              {subsection.codeBlocks.map((block, blockIdx) => (
                <div key={blockIdx} className="relative mt-2">
                  <pre className="text-xs font-mono bg-zinc-900 text-zinc-100 p-3 rounded-lg overflow-x-auto">
                    {block.language && (
                      <span className="absolute top-1 right-2 text-xs text-[var(--muted-foreground)]">{block.language}</span>
                    )}
                    {block.code}
                  </pre>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OtherSectionCard({ section }: { section: QuickstartSection }) {
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

function StructuredQuickstartView({ parsed }: { parsed: ParsedQuickstart }) {
  const { sectionTitles, sectionOrder } = parsed;

  // Render a section by its type
  const renderSection = (item: { type: string; title: string; otherIndex?: number }) => {
    switch (item.type) {
      case 'prerequisites':
        if (parsed.prerequisites.length === 0) return null;
        return <PrerequisitesSection key={item.type} prerequisites={parsed.prerequisites} title={sectionTitles.prerequisites} />;
      case 'setupSteps':
        if (parsed.setupSteps.length === 0) return null;
        return <SetupStepsSection key={item.type} steps={parsed.setupSteps} title={sectionTitles.setupSteps} />;
      case 'development':
        if (!parsed.development) return null;
        return <DevelopmentSectionComponent key={item.type} development={parsed.development} title={sectionTitles.development} />;
      case 'developmentCommands':
        if (parsed.developmentCommands.length === 0) return null;
        return <DevelopmentCommandsSection key={item.type} commands={parsed.developmentCommands} title={sectionTitles.developmentCommands} />;
      case 'projectScripts':
        if (!parsed.projectScripts) return null;
        return <ProjectScriptsSection key={item.type} scripts={parsed.projectScripts} />;
      case 'verification':
        if (parsed.verificationChecklist.items.length === 0) return null;
        return <VerificationChecklistSection key={item.type} data={parsed.verificationChecklist} title={sectionTitles.verification} />;
      case 'keyFiles':
        if (parsed.keyFilesToCreate.files.length === 0) return null;
        return <KeyFilesSection key={item.type} data={parsed.keyFilesToCreate} title={sectionTitles.keyFiles} />;
      case 'browserSupport':
        const totalItems = parsed.browserSupport.subsections.reduce((sum, sub) => sum + sub.items.length, 0);
        if (totalItems === 0) return null;
        return <BrowserSupportSection key={item.type} data={parsed.browserSupport} title={sectionTitles.browserSupport} />;
      case 'other':
        if (item.otherIndex === undefined) return null;
        const section = parsed.otherSections[item.otherIndex];
        if (!section) return null;
        return <OtherSectionCard key={`other-${item.otherIndex}`} section={section} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      {/* Metadata */}
      {(parsed.feature || parsed.date) && (
        <div className="flex flex-wrap gap-4 p-3 bg-[var(--secondary)]/30 rounded-lg mb-4">
          {parsed.feature && (
            <div className="flex items-center gap-2 text-sm">
              <Rocket className="w-4 h-4 text-[var(--muted-foreground)]" />
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

      {/* Render sections in order from markdown */}
      {sectionOrder.map((item, idx) => (
        <React.Fragment key={`${item.type}-${idx}`}>
          {renderSection(item)}
        </React.Fragment>
      ))}
    </div>
  );
}

export function QuickstartViewer({ content, filePath, className }: QuickstartViewerProps) {
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);

  const parsed = useMemo(() => {
    if (!content) return null;
    return parseQuickstartAST(content);
  }, [content]);

  if (!content) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-[var(--muted-foreground)]', className)}>
        <Rocket className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No quickstart guide yet</p>
        <p className="text-sm mt-2">Create a quickstart.md file for getting started instructions</p>
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
        parsed && <StructuredQuickstartView parsed={parsed} />
      )}
    </div>
  );
}
