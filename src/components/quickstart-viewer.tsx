'use client';

import { useState, useMemo } from 'react';
import { Rocket, ChevronDown, ChevronRight, Terminal, CheckCircle2, Circle, FileCode, Globe, Calendar, Play, ScrollText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseQuickstartContent } from '@/lib/markdown-parsers';
import type { ParsedQuickstart, SetupStep, VerificationItem, QuickstartSection } from '@/types';

interface QuickstartViewerProps {
  content: string | null;
  filePath?: string;
  className?: string;
}

function PrerequisitesSection({ prerequisites }: { prerequisites: string[] }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (prerequisites.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2 hover:bg-[var(--secondary)]/30 p-2 rounded-lg transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <h3 className="font-semibold">Prerequisites</h3>
        <span className="text-xs text-[var(--muted-foreground)] ml-auto">{prerequisites.length} items</span>
      </button>
      {isExpanded && (
        <ul className="space-y-1 p-3 bg-[var(--secondary)]/30 rounded-lg">
          {prerequisites.map((prereq, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
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
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">
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
                    <span className="absolute top-1 right-2 text-xs text-zinc-500">{cmd.language}</span>
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

function SetupStepsSection({ steps }: { steps: SetupStep[] }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (steps.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2 hover:bg-[var(--secondary)]/30 p-2 rounded-lg transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <Terminal className="w-4 h-4 text-green-500" />
        <h3 className="font-semibold">Setup Steps</h3>
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

function VerificationChecklistSection({ items }: { items: VerificationItem[] }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (items.length === 0) return null;

  const checkedCount = items.filter(i => i.checked).length;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2 hover:bg-[var(--secondary)]/30 p-2 rounded-lg transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <CheckCircle2 className="w-4 h-4 text-green-500" />
        <h3 className="font-semibold">Verification Checklist</h3>
        <span className="text-xs text-[var(--muted-foreground)] ml-auto">
          {checkedCount}/{items.length} complete
        </span>
      </button>
      {isExpanded && (
        <ul className="space-y-1 p-3 bg-[var(--secondary)]/30 rounded-lg">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              {item.checked ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-[var(--muted-foreground)] mt-0.5 flex-shrink-0" />
              )}
              <span className={item.checked ? 'text-[var(--muted-foreground)]' : ''}>{item.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function KeyFilesSection({ files }: { files: string[] }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (files.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2 hover:bg-[var(--secondary)]/30 p-2 rounded-lg transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <FileCode className="w-4 h-4 text-purple-500" />
        <h3 className="font-semibold">Key Files to Create</h3>
        <span className="text-xs text-[var(--muted-foreground)] ml-auto">{files.length} files</span>
      </button>
      {isExpanded && (
        <ol className="space-y-1 p-3 bg-[var(--secondary)]/30 rounded-lg list-decimal list-inside">
          {files.map((file, idx) => (
            <li key={idx} className="text-sm">
              <code className="px-1.5 py-0.5 bg-[var(--secondary)] rounded text-xs font-mono">{file}</code>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function BrowserSupportSection({ browsers }: { browsers: string[] }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (browsers.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2 hover:bg-[var(--secondary)]/30 p-2 rounded-lg transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <Globe className="w-4 h-4 text-cyan-500" />
        <h3 className="font-semibold">Browser Support</h3>
      </button>
      {isExpanded && (
        <ul className="space-y-1 p-3 bg-[var(--secondary)]/30 rounded-lg">
          {browsers.map((browser, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
              <span>{browser}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DevelopmentCommandsSection({ commands }: { commands: { title: string; command: string; description?: string }[] }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (commands.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2 hover:bg-[var(--secondary)]/30 p-2 rounded-lg transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <Play className="w-4 h-4 text-orange-500" />
        <h3 className="font-semibold">Development Commands</h3>
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

function ProjectScriptsSection({ scripts }: { scripts?: string }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!scripts) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left mb-2 hover:bg-[var(--secondary)]/30 p-2 rounded-lg transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <ScrollText className="w-4 h-4 text-yellow-500" />
        <h3 className="font-semibold">Project Scripts</h3>
      </button>
      {isExpanded && (
        <pre className="text-xs font-mono bg-zinc-900 text-zinc-100 p-3 rounded-lg overflow-x-auto">
          {scripts}
        </pre>
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

      <PrerequisitesSection prerequisites={parsed.prerequisites} />
      <SetupStepsSection steps={parsed.setupSteps} />
      <DevelopmentCommandsSection commands={parsed.developmentCommands} />
      <ProjectScriptsSection scripts={parsed.projectScripts} />
      <VerificationChecklistSection items={parsed.verificationChecklist} />
      <KeyFilesSection files={parsed.keyFilesToCreate} />
      <BrowserSupportSection browsers={parsed.browserSupport} />

      {/* Other sections not specifically parsed */}
      {parsed.otherSections.map((section, idx) => (
        <OtherSectionCard key={idx} section={section} />
      ))}
    </div>
  );
}

export function QuickstartViewer({ content, filePath, className }: QuickstartViewerProps) {
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);

  const parsed = useMemo(() => {
    if (!content) return null;
    return parseQuickstartContent(content);
  }, [content]);

  if (!content) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-zinc-500', className)}>
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
