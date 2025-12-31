'use client';

import { useState, useMemo } from 'react';
import {
  FileText,
  GitBranch, Calendar, FileCheck, MessageSquare,
  Target, CheckCircle2, ChevronDown, ChevronRight
} from 'lucide-react';
import { MarkdownRenderer } from './markdown-renderer';
import { cn } from '@/lib/utils';

interface SpecViewerProps {
  content: string | null;
  className?: string;
}

// Types for parsed spec
interface SpecMetadata {
  title: string;
  branch?: string;
  created?: string;
  status?: string;
  input?: string;
}

interface AcceptanceScenario {
  given: string;
  when: string;
  then: string;
}

interface UserStory {
  id: string;
  title: string;
  priority: 'P1' | 'P2' | 'P3';
  description: string;
  whyPriority?: string;
  independentTest?: string;
  acceptanceScenarios: AcceptanceScenario[];
}

interface ParsedSpec {
  metadata: SpecMetadata;
  userStories: UserStory[];
  clarifications: { question: string; answer: string }[];
  otherContent: string;
}

// Parse the spec content
function parseSpecContent(content: string): ParsedSpec {
  const lines = content.split('\n');
  const metadata: SpecMetadata = { title: '' };
  const userStories: UserStory[] = [];
  const clarifications: { question: string; answer: string }[] = [];
  let otherContent = '';

  let i = 0;

  // Parse title
  if (lines[0]?.startsWith('Feature Specification:')) {
    metadata.title = lines[0].replace('Feature Specification:', '').trim();
    i = 1;
  }

  // Parse metadata line
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('**Feature Branch**:')) {
      // Parse metadata from this line - handle both with and without backticks
      // Format: **Feature Branch**: `branch` **Created**: date **Status**: status **Input**: ...
      // Or: **Feature Branch**: branch **Created**: date **Status**: status **Input**: ...
      const metaMatch = line.match(/\*\*Feature Branch\*\*:\s*`?([^`\s]+)`?\s*\*\*Created\*\*:\s*(\S+)\s*\*\*Status\*\*:\s*(\S+)\s*\*\*Input\*\*:\s*(.+)/);
      if (metaMatch) {
        metadata.branch = metaMatch[1];
        metadata.created = metaMatch[2];
        metadata.status = metaMatch[3];
        metadata.input = metaMatch[4];
      }
      i++;
      break;
    }
    i++;
  }

  // Skip to User Scenarios section
  while (i < lines.length && !lines[i].includes('User Scenarios')) {
    i++;
  }
  i++; // Skip the header line

  // Parse User Stories
  let currentStory: UserStory | null = null;
  let inAcceptanceScenarios = false;
  let currentScenario: Partial<AcceptanceScenario> = {};

  while (i < lines.length) {
    const line = lines[i];

    // Check for clarifications section
    if (line.includes('Clarifications') || line.includes('## Q&A')) {
      break;
    }

    // New User Story
    const storyMatch = line.match(/^User Story (\d+) - (.+) \(Priority: (P[123])\)/);
    if (storyMatch) {
      if (currentStory) {
        userStories.push(currentStory);
      }
      currentStory = {
        id: `US${storyMatch[1]}`,
        title: storyMatch[2],
        priority: storyMatch[3] as 'P1' | 'P2' | 'P3',
        description: '',
        acceptanceScenarios: []
      };
      inAcceptanceScenarios = false;
      i++;
      continue;
    }

    if (currentStory) {
      // Description line (starts with "As a user...")
      if (line.startsWith('As a user,') || line.startsWith('As a ')) {
        currentStory.description = line;
      }
      // Why this priority
      else if (line.startsWith('**Why this priority**:')) {
        currentStory.whyPriority = line.replace('**Why this priority**:', '').trim();
      }
      // Independent Test
      else if (line.startsWith('**Independent Test**:')) {
        currentStory.independentTest = line.replace('**Independent Test**:', '').trim();
      }
      // Acceptance Scenarios header
      else if (line.includes('**Acceptance Scenarios**:')) {
        inAcceptanceScenarios = true;
      }
      // Given/When/Then
      else if (inAcceptanceScenarios) {
        if (line.startsWith('**Given**')) {
          if (currentScenario.given && currentScenario.when && currentScenario.then) {
            currentStory.acceptanceScenarios.push(currentScenario as AcceptanceScenario);
          }
          const parts = line.match(/\*\*Given\*\*\s*(.+?),\s*\*\*When\*\*\s*(.+?),\s*\*\*Then\*\*\s*(.+)/);
          if (parts) {
            currentScenario = {
              given: parts[1],
              when: parts[2],
              then: parts[3]
            };
            currentStory.acceptanceScenarios.push(currentScenario as AcceptanceScenario);
            currentScenario = {};
          }
        }
      }
    }

    i++;
  }

  // Add last story
  if (currentStory) {
    userStories.push(currentStory);
  }

  // Parse clarifications
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('**Q:**') || line.startsWith('Q:')) {
      const question = line.replace(/^\*\*Q:\*\*\s*/, '').replace(/^Q:\s*/, '');
      i++;
      if (i < lines.length && (lines[i].startsWith('**A:**') || lines[i].startsWith('A:'))) {
        const answer = lines[i].replace(/^\*\*A:\*\*\s*/, '').replace(/^A:\s*/, '');
        clarifications.push({ question, answer });
      }
    }
    i++;
  }

  return { metadata, userStories, clarifications, otherContent };
}

// Priority badge component
function PriorityBadge({ priority }: { priority: 'P1' | 'P2' | 'P3' }) {
  const colors = {
    P1: 'bg-red-500/20 text-red-400 border-red-500/30',
    P2: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    P3: 'bg-green-500/20 text-green-400 border-green-500/30',
  };

  const labels = {
    P1: 'Critical',
    P2: 'Important',
    P3: 'Nice to Have',
  };

  return (
    <span className={cn(
      'px-2 py-0.5 text-xs font-medium rounded-full border',
      colors[priority]
    )}>
      {priority} · {labels[priority]}
    </span>
  );
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Draft: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    'In Progress': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    Review: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    Approved: 'bg-green-500/20 text-green-400 border-green-500/30',
  };

  return (
    <span className={cn(
      'px-2 py-0.5 text-xs font-medium rounded-full border',
      colors[status] || colors.Draft
    )}>
      {status}
    </span>
  );
}

// User Story Card component
function UserStoryCard({ story }: { story: UserStory }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Story Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-[var(--secondary)]/30 transition-colors text-left"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
        )}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-xs font-mono text-[var(--muted-foreground)] bg-[var(--secondary)] px-2 py-0.5 rounded">
            {story.id}
          </span>
          <span className="font-medium truncate">{story.title}</span>
        </div>
        <PriorityBadge priority={story.priority} />
      </button>

      {/* Story Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Description */}
          {story.description && (
            <div className="pl-7">
              <p className="text-sm text-[var(--muted-foreground)] italic">
                "{story.description}"
              </p>
            </div>
          )}

          {/* Why this priority */}
          {story.whyPriority && (
            <div className="pl-7">
              <div className="flex items-start gap-2">
                <Target className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-xs font-medium text-amber-400 uppercase tracking-wide">Why this priority</span>
                  <p className="text-sm text-[var(--foreground)] mt-1">{story.whyPriority}</p>
                </div>
              </div>
            </div>
          )}

          {/* Independent Test */}
          {story.independentTest && (
            <div className="pl-7">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-xs font-medium text-green-400 uppercase tracking-wide">Independent Test</span>
                  <p className="text-sm text-[var(--foreground)] mt-1">{story.independentTest}</p>
                </div>
              </div>
            </div>
          )}

          {/* Acceptance Scenarios */}
          {story.acceptanceScenarios.length > 0 && (
            <div className="pl-7">
              <div className="flex items-center gap-2 mb-3">
                <FileCheck className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-medium text-blue-400 uppercase tracking-wide">
                  Acceptance Scenarios ({story.acceptanceScenarios.length})
                </span>
              </div>
              <div className="space-y-2">
                {story.acceptanceScenarios.map((scenario, idx) => (
                  <div
                    key={idx}
                    className="bg-[var(--secondary)]/30 rounded-lg p-3 text-sm border-l-2 border-blue-500/50"
                  >
                    <div className="flex flex-wrap gap-x-1">
                      <span className="font-semibold text-emerald-400">Given</span>
                      <span className="text-[var(--foreground)]">{scenario.given},</span>
                      <span className="font-semibold text-amber-400">When</span>
                      <span className="text-[var(--foreground)]">{scenario.when},</span>
                      <span className="font-semibold text-blue-400">Then</span>
                      <span className="text-[var(--foreground)]">{scenario.then}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Main SpecViewer component
export function SpecViewer({ content, className }: SpecViewerProps) {
  const [showRawMarkdown, setShowRawMarkdown] = useState(false);

  // Parse spec content
  const parsedSpec = useMemo(() => {
    if (!content) return null;
    try {
      const result = parseSpecContent(content);
      console.log('Parsed spec result:', {
        title: result.metadata.title,
        storiesCount: result.userStories.length,
        clarificationsCount: result.clarifications.length,
        firstLines: content.split('\n').slice(0, 5)
      });
      return result;
    } catch (e) {
      console.error('Parser error:', e);
      return null;
    }
  }, [content]);

  // Check if we have structured content to display
  const hasStructuredContent = parsedSpec && (
    parsedSpec.metadata.title ||
    parsedSpec.userStories.length > 0 ||
    parsedSpec.clarifications.length > 0
  );

  if (!content) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-[var(--muted-foreground)]', className)}>
        <FileText className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No specification yet</p>
        <p className="text-sm mt-2">Create a spec.md file to define feature requirements</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Toolbar */}
      {hasStructuredContent && (
        <div className="flex items-center gap-1 bg-[var(--secondary)] rounded-lg p-1 mb-4" role="tablist" aria-label="View mode">
          <button
            onClick={() => setShowRawMarkdown(false)}
            role="tab"
            aria-selected={!showRawMarkdown}
            aria-controls="spec-content"
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
            aria-controls="spec-content"
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
        <MarkdownRenderer content={content} />
      ) : (
        <div className="space-y-6">
          {/* Metadata Header */}
          {parsedSpec && parsedSpec.metadata.title && (
            <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-[var(--border)] rounded-xl p-6">
              <h1 className="text-2xl font-bold mb-4">{parsedSpec.metadata.title}</h1>

              <div className="flex flex-wrap gap-4 text-sm">
                {parsedSpec.metadata.branch && (
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-[var(--muted-foreground)]" />
                    <code className="bg-[var(--secondary)] px-2 py-0.5 rounded text-xs">
                      {parsedSpec.metadata.branch}
                    </code>
                  </div>
                )}
                {parsedSpec.metadata.created && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[var(--muted-foreground)]" />
                    <span className="text-[var(--muted-foreground)]">{parsedSpec.metadata.created}</span>
                  </div>
                )}
                {parsedSpec.metadata.status && (
                  <StatusBadge status={parsedSpec.metadata.status} />
                )}
              </div>

              {parsedSpec.metadata.input && (
                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-[var(--muted-foreground)] mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {parsedSpec.metadata.input.replace(/^User description:\s*"?|"$/g, '')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Stories */}
          {parsedSpec && parsedSpec.userStories.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-4 flex items-center gap-2">
                <Target className="w-4 h-4" />
                User Stories ({parsedSpec.userStories.length})
              </h2>
              <div className="space-y-3">
                {parsedSpec.userStories.map((story) => (
                  <UserStoryCard key={story.id} story={story} />
                ))}
              </div>
            </div>
          )}

          {/* Clarifications */}
          {parsedSpec && parsedSpec.clarifications.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Clarifications ({parsedSpec.clarifications.length})
              </h2>
              <div className="space-y-3">
                {parsedSpec.clarifications.map((qa, index) => (
                  <div key={index} className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-2">
                      <span className="text-xs font-bold text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded">Q</span>
                      <p className="text-sm font-medium">{qa.question}</p>
                    </div>
                    <div className="flex items-start gap-3 pl-7">
                      <span className="text-xs font-bold text-green-400 bg-green-500/20 px-2 py-0.5 rounded">A</span>
                      <p className="text-sm text-[var(--muted-foreground)]">{qa.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
