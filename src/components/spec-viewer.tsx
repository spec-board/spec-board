'use client';

import { useState, useMemo } from 'react';
import {
  FileText,
  GitBranch, Calendar, FileCheck, MessageSquare,
  Target, CheckCircle2, ChevronDown, ChevronRight,
  AlertTriangle, Database, ListChecks, Lightbulb, HelpCircle
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
  priority: string; // P1, P2, P3, etc.
  description: string;
  whyPriority?: string;
  independentTest?: string;
  acceptanceScenarios: AcceptanceScenario[];
}

interface EdgeCase {
  question: string;
  answer: string;
}

interface Requirement {
  id: string;
  text: string;
}

interface RequirementGroup {
  category: string;
  items: Requirement[];
}

interface Entity {
  name: string;
  description: string;
  properties: string[];
}

interface Clarification {
  session?: string;
  question: string;
  answer: string;
}

interface ParsedSpec {
  metadata: SpecMetadata;
  userStories: UserStory[];
  edgeCases: EdgeCase[];
  requirements: RequirementGroup[];
  entities: Entity[];
  successCriteria: Requirement[];
  clarifications: Clarification[];
  assumptions: string[];
  otherContent: string;
}

// Parse the spec content
function parseSpecContent(content: string): ParsedSpec {
  const result: ParsedSpec = {
    metadata: { title: '' },
    userStories: [],
    edgeCases: [],
    requirements: [],
    entities: [],
    successCriteria: [],
    clarifications: [],
    assumptions: [],
    otherContent: ''
  };

  // Split content into major sections by ## headers
  const sections = splitIntoSections(content);

  // Parse metadata from header
  result.metadata = parseMetadata(sections.header || '');

  // Parse User Stories and Edge Cases from User Scenarios section
  if (sections.userScenarios) {
    result.userStories = parseUserStories(sections.userScenarios);
    // Edge Cases is a ### subsection within User Scenarios
    result.edgeCases = parseEdgeCases(sections.userScenarios);
  }

  // Parse Requirements and Key Entities from Requirements section
  if (sections.requirements) {
    result.requirements = parseRequirements(sections.requirements);
    // Key Entities is a ### subsection within Requirements
    result.entities = parseEntities(sections.requirements);
  }

  // Parse Success Criteria
  if (sections.successCriteria) {
    result.successCriteria = parseSuccessCriteria(sections.successCriteria);
  }

  // Note: Clarifications are handled separately per user request
  // if (sections.clarifications) {
  //   result.clarifications = parseClarifications(sections.clarifications);
  // }

  // Parse Assumptions
  if (sections.assumptions) {
    result.assumptions = parseAssumptions(sections.assumptions);
  }

  return result;
}

// Split content into sections by ## headers
function splitIntoSections(content: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = content.split('\n');

  let currentSection = 'header';
  let currentContent: string[] = [];

  for (const line of lines) {
    // Only match actual ## headers (not ### or other patterns)
    // Handle headers with optional *(mandatory)* suffix
    const isH2Header = line.match(/^## .+/);

    if (isH2Header) {
      // Save previous section
      if (currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n');
      }

      // Determine new section type from ## header
      const headerLower = line.toLowerCase();
      if (headerLower.includes('user scenario') || headerLower.includes('user stories')) {
        currentSection = 'userScenarios';
      } else if (headerLower.includes('requirement')) {
        currentSection = 'requirements';
      } else if (headerLower.includes('success criteria')) {
        currentSection = 'successCriteria';
      } else if (headerLower.includes('clarification')) {
        currentSection = 'clarifications';
      } else if (headerLower.includes('assumption')) {
        currentSection = 'assumptions';
      } else {
        // Unknown section - keep as generic
        currentSection = 'other_' + headerLower.replace(/[^a-z0-9]/g, '_').slice(0, 30);
      }

      currentContent = [line];
    } else {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentContent.length > 0) {
    sections[currentSection] = currentContent.join('\n');
  }

  return sections;
}

// Parse metadata from header section
function parseMetadata(header: string): SpecMetadata {
  const metadata: SpecMetadata = { title: '' };
  const lines = header.split('\n');

  for (const line of lines) {
    // Parse title from "# Feature Specification: Title"
    const titleMatch = line.match(/^#\s*Feature Specification:\s*(.+)/i);
    if (titleMatch) {
      metadata.title = titleMatch[1].trim();
      continue;
    }

    // Parse **Feature Branch**: `branch-name`
    const branchMatch = line.match(/\*\*Feature Branch\*\*:\s*`([^`]+)`/i);
    if (branchMatch) {
      metadata.branch = branchMatch[1].trim();
      continue;
    }

    // Parse **Created**: date
    const createdMatch = line.match(/\*\*Created\*\*:\s*(\S+)/i);
    if (createdMatch) {
      metadata.created = createdMatch[1].trim();
      continue;
    }

    // Parse **Status**: status
    const statusMatch = line.match(/\*\*Status\*\*:\s*(\S+)/i);
    if (statusMatch) {
      metadata.status = statusMatch[1].trim();
      continue;
    }

    // Parse **Input**: User description: "..."
    const inputMatch = line.match(/\*\*Input\*\*:\s*(.+)/i);
    if (inputMatch) {
      // Extract the description, removing "User description:" prefix and quotes if present
      let input = inputMatch[1].trim();
      const descMatch = input.match(/User description:\s*"?([^"]+)"?/i);
      if (descMatch) {
        input = descMatch[1].trim();
      }
      metadata.input = input;
      continue;
    }
  }

  return metadata;
}

// Parse User Stories section
function parseUserStories(section: string): UserStory[] {
  const stories: UserStory[] = [];
  const lines = section.split('\n');

  let currentStory: UserStory | null = null;
  let inAcceptanceScenarios = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // New User Story - match "### User Story N - Title (Priority: PN)"
    const storyMatch = line.match(/^###\s*User Story (\d+)\s*[-–]\s*(.+?)\s*\(Priority:\s*(P\d+)\)/i);
    if (storyMatch) {
      if (currentStory) {
        stories.push(currentStory);
      }
      currentStory = {
        id: `US${storyMatch[1]}`,
        title: storyMatch[2].trim(),
        priority: storyMatch[3].toUpperCase(),
        description: '',
        acceptanceScenarios: []
      };
      inAcceptanceScenarios = false;
      continue;
    }

    // Edge Cases header within User Scenarios section - stop parsing user stories
    if (line.match(/^###\s*Edge Cases/i)) {
      if (currentStory) {
        stories.push(currentStory);
        currentStory = null;
      }
      break;
    }

    if (currentStory) {
      // Description line (starts with "As a user..." or "As a...")
      if (line.match(/^As a\s/i)) {
        currentStory.description = line;
      }
      // Why this priority - handle **Why this priority**:
      else if (line.match(/^\*\*Why this priority\*\*:/i)) {
        currentStory.whyPriority = line.replace(/^\*\*Why this priority\*\*:\s*/i, '').trim();
      }
      // Independent Test - handle **Independent Test**:
      else if (line.match(/^\*\*Independent Test\*\*:/i)) {
        currentStory.independentTest = line.replace(/^\*\*Independent Test\*\*:\s*/i, '').trim();
      }
      // Acceptance Scenarios header - handle **Acceptance Scenarios**:
      else if (line.match(/^\*\*Acceptance Scenarios\*\*:/i)) {
        inAcceptanceScenarios = true;
      }
      // Horizontal rule or next story - reset acceptance scenarios flag
      else if (line.match(/^---\s*$/)) {
        inAcceptanceScenarios = false;
      }
      // Given/When/Then scenarios - handle numbered format with bold markers:
      // "1. **Given** X, **When** Y, **Then** Z"
      else if (inAcceptanceScenarios && line.match(/^\d+\.\s*\*\*Given\*\*/i)) {
        // Parse format: N. **Given** X, **When** Y, **Then** Z
        const scenarioMatch = line.match(/^\d+\.\s*\*\*Given\*\*\s+(.+?),\s*\*\*When\*\*\s+(.+?),\s*\*\*Then\*\*\s+(.+)/i);
        if (scenarioMatch) {
          currentStory.acceptanceScenarios.push({
            given: scenarioMatch[1].trim(),
            when: scenarioMatch[2].trim(),
            then: scenarioMatch[3].trim()
          });
        }
      }
    }
  }

  // Add last story
  if (currentStory) {
    stories.push(currentStory);
  }

  return stories;
}

// Parse Edge Cases section (handles ### Edge Cases within User Scenarios or standalone)
function parseEdgeCases(section: string): EdgeCase[] {
  const edgeCases: EdgeCase[] = [];
  const lines = section.split('\n');

  // Find the Edge Cases subsection if it exists
  let inEdgeCases = section.toLowerCase().includes('edge case');
  let foundEdgeCasesHeader = false;

  for (const line of lines) {
    // Check for ### Edge Cases header
    if (line.match(/^###\s*Edge Cases/i)) {
      foundEdgeCasesHeader = true;
      inEdgeCases = true;
      continue;
    }

    // Stop at next ### header after Edge Cases
    if (foundEdgeCasesHeader && line.match(/^###\s+/)) {
      break;
    }

    if (inEdgeCases) {
      // Match "- What happens when/if X? Answer." format
      const match = line.match(/^[-*]\s*What happens (?:when|if)\s+(.+?\?)\s*(.+)$/i);
      if (match) {
        edgeCases.push({
          question: `What happens ${match[1]}`,
          answer: match[2].trim()
        });
      }
    }
  }

  return edgeCases;
}

// Parse Requirements section (grouped by category)
// Handles format: **Category** followed by - **FR-XXX**: text
function parseRequirements(section: string): RequirementGroup[] {
  const groups: RequirementGroup[] = [];
  const lines = section.split('\n');

  let currentGroup: RequirementGroup | null = null;
  let inFunctionalRequirements = false;

  for (const line of lines) {
    // Check for ### Functional Requirements header
    if (line.match(/^###\s*Functional Requirements/i)) {
      inFunctionalRequirements = true;
      continue;
    }

    // Stop at next ### header (like Key Entities)
    if (inFunctionalRequirements && line.match(/^###\s+/) && !line.match(/^###\s*Functional Requirements/i)) {
      break;
    }

    if (inFunctionalRequirements || !section.includes('### Functional Requirements')) {
      // Category header - bold format: **Task Management**
      const categoryMatch = line.match(/^\*\*([^*]+)\*\*\s*$/);
      if (categoryMatch) {
        if (currentGroup && currentGroup.items.length > 0) {
          groups.push(currentGroup);
        }
        currentGroup = {
          category: categoryMatch[1].trim(),
          items: []
        };
        continue;
      }

      // Requirement item - format: - **FR-XXX**: text
      const reqMatch = line.match(/^[-*]\s*\*\*(FR-\d+)\*\*:\s*(.+)$/);
      if (reqMatch) {
        if (!currentGroup) {
          currentGroup = { category: 'General', items: [] };
        }
        currentGroup.items.push({
          id: reqMatch[1],
          text: reqMatch[2].trim()
        });
      }
    }
  }

  // Add last group
  if (currentGroup && currentGroup.items.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

// Parse Key Entities section (within Requirements section as ### Key Entities)
// Handles format: - **Entity**: Description followed by indented properties
function parseEntities(section: string): Entity[] {
  const entities: Entity[] = [];
  const lines = section.split('\n');

  let currentEntity: Entity | null = null;
  let inKeyEntities = false;

  for (const line of lines) {
    // Check for ### Key Entities header
    if (line.match(/^###\s*Key Entities/i)) {
      inKeyEntities = true;
      continue;
    }

    // Stop at next ## header
    if (inKeyEntities && line.match(/^##\s+/)) {
      break;
    }

    if (inKeyEntities || !section.includes('### Key Entities')) {
      // Entity header - format: - **Entity**: Description
      const entityMatch = line.match(/^[-*]\s*\*\*([^*]+)\*\*:\s*(.+)$/);
      if (entityMatch) {
        if (currentEntity) {
          entities.push(currentEntity);
        }
        currentEntity = {
          name: entityMatch[1].trim(),
          description: entityMatch[2].trim(),
          properties: []
        };
        continue;
      }

      // Property line - indented bullet point under entity (2+ spaces before -)
      if (currentEntity && line.match(/^\s{2,}[-*]\s+/)) {
        const property = line.replace(/^\s+[-*]\s+/, '').trim();
        if (property) {
          currentEntity.properties.push(property);
        }
      }
    }
  }

  // Add last entity
  if (currentEntity) {
    entities.push(currentEntity);
  }

  return entities;
}

// Parse Success Criteria section
// Handles format: - **SC-XXX**: text
function parseSuccessCriteria(section: string): Requirement[] {
  const criteria: Requirement[] = [];
  const lines = section.split('\n');

  let inMeasurableOutcomes = false;

  for (const line of lines) {
    // Check for ### Measurable Outcomes header
    if (line.match(/^###\s*Measurable Outcomes/i)) {
      inMeasurableOutcomes = true;
      continue;
    }

    // Stop at next ## header
    if (inMeasurableOutcomes && line.match(/^##\s+/)) {
      break;
    }

    if (inMeasurableOutcomes || !section.includes('### Measurable Outcomes')) {
      // Success Criteria item - format: - **SC-XXX**: text
      const match = line.match(/^[-*]\s*\*\*(SC-\d+)\*\*:\s*(.+)$/);
      if (match) {
        criteria.push({
          id: match[1],
          text: match[2].trim()
        });
      }
    }
  }

  return criteria;
}

// Parse Clarifications section
function parseClarifications(section: string): Clarification[] {
  const clarifications: Clarification[] = [];
  const lines = section.split('\n');

  let currentSession: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Session header (e.g., "Session 2025-12-29")
    const sessionMatch = line.match(/^(?:###?\s*)?Session\s+(\S+)/i);
    if (sessionMatch) {
      currentSession = sessionMatch[1];
      continue;
    }

    // Q&A format: "Q: question → A: answer" or "**Q:** question"
    const qaMatch = line.match(/^(?:\*\*)?Q(?:\*\*)?:\s*(.+?)(?:\s*→\s*(?:\*\*)?A(?:\*\*)?:\s*(.+))?$/i);
    if (qaMatch) {
      const question = qaMatch[1].trim();
      let answer = qaMatch[2]?.trim() || '';

      // If answer not on same line, check next line
      if (!answer && i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        const answerMatch = nextLine.match(/^(?:\*\*)?A(?:\*\*)?:\s*(.+)$/i);
        if (answerMatch) {
          answer = answerMatch[1].trim();
          i++; // Skip the answer line
        }
      }

      if (question) {
        clarifications.push({
          session: currentSession,
          question,
          answer
        });
      }
    }
  }

  return clarifications;
}

// Parse Assumptions section
function parseAssumptions(section: string): string[] {
  const assumptions: string[] = [];
  const lines = section.split('\n');

  for (const line of lines) {
    // Bullet point items
    const match = line.match(/^[-*]\s+(.+)$/);
    if (match) {
      assumptions.push(match[1].trim());
    }
  }

  return assumptions;
}

// Format User Story description with line breaks for "As a / I want / so that" structure
function formatUserStoryDescription(description: string): string {
  // Add line break before "I want" and "so that"
  return description
    .replace(/,?\s*(I want\s)/i, ',\n$1')
    .replace(/,?\s*(so that\s)/i,'\nso that ')
    .replace(/,?\s*(and mark\s)/i, ',\nand mark ');
}

// Priority badge component - supports any priority level (P1, P2, ... P20, etc.)
function PriorityBadge({ priority }: { priority: string }) {
  // Extract priority number for dynamic styling
  const priorityNum = parseInt(priority.replace(/\D/g, ''), 10) || 1;

  // Predefined colors for common priorities, fallback for higher numbers
  const colorMap: Record<number, string> = {
    1: 'bg-red-500/20 text-red-400 border-red-500/30',
    2: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    3: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    4: 'bg-green-500/20 text-green-400 border-green-500/30',
    5: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    6: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  // Fallback color for P7+
  const color = colorMap[priorityNum] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';

  // Dynamic labels based on priority number
  const getLabel = (num: number): string => {
    if (num === 1) return 'Critical';
    if (num === 2) return 'Important';
    if (num === 3) return 'Medium';
    if (num <= 5) return 'Low';
    return 'Minor';
  };

  return (
    <span className={cn(
      'px-2 py-0.5 text-xs font-medium rounded-full border',
      color
    )}>
      {priority} · {getLabel(priorityNum)}
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
          {/* Description - formatted with line breaks for As a/I want/so that */}
          {story.description && (
            <div className="pl-7">
              <p className="text-sm text-[var(--muted-foreground)] italic whitespace-pre-line">
                "{formatUserStoryDescription(story.description)}"
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
      return parseSpecContent(content);
    } catch (e) {
      console.error('Parser error:', e);
      return null;
    }
  }, [content]);

  // Check if we have structured content to display
  const hasStructuredContent = parsedSpec && (
    parsedSpec.metadata.title ||
    parsedSpec.userStories.length > 0 ||
    parsedSpec.edgeCases.length > 0 ||
    parsedSpec.requirements.length > 0 ||
    parsedSpec.entities.length > 0 ||
    parsedSpec.successCriteria.length > 0 ||
    parsedSpec.clarifications.length > 0 ||
    parsedSpec.assumptions.length > 0
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

          {/* Edge Cases */}
          {parsedSpec && parsedSpec.edgeCases.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Edge Cases ({parsedSpec.edgeCases.length})
              </h2>
              <div className="space-y-2">
                {parsedSpec.edgeCases.map((edgeCase, index) => (
                  <div key={index} className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <HelpCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[var(--foreground)]">{edgeCase.question}</p>
                        <p className="text-sm text-[var(--muted-foreground)] mt-1">{edgeCase.answer}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Requirements */}
          {parsedSpec && parsedSpec.requirements.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-4 flex items-center gap-2">
                <ListChecks className="w-4 h-4" />
                Functional Requirements ({parsedSpec.requirements.reduce((acc, g) => acc + g.items.length, 0)})
              </h2>
              <div className="space-y-4">
                {parsedSpec.requirements.map((group, groupIndex) => (
                  <div key={groupIndex} className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
                    <div className="px-4 py-2 bg-[var(--secondary)]/50 border-b border-[var(--border)]">
                      <h3 className="text-sm font-medium">{group.category}</h3>
                    </div>
                    <div className="p-4 space-y-2">
                      {group.items.map((req) => (
                        <div key={req.id} className="flex items-start gap-3 text-sm">
                          <code className="text-xs font-mono bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded flex-shrink-0">
                            {req.id}
                          </code>
                          <span className="text-[var(--foreground)]">{req.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Entities */}
          {parsedSpec && parsedSpec.entities.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-4 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Key Entities ({parsedSpec.entities.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {parsedSpec.entities.map((entity, index) => (
                  <div key={index} className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">{entity.name}</h3>
                    <p className="text-xs text-[var(--muted-foreground)] mb-3">{entity.description}</p>
                    {entity.properties.length > 0 && (
                      <ul className="space-y-1">
                        {entity.properties.map((prop, propIndex) => (
                          <li key={propIndex} className="text-xs text-[var(--muted-foreground)] flex items-start gap-2">
                            <span className="text-[var(--muted-foreground)]">•</span>
                            <span>{prop}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success Criteria */}
          {parsedSpec && parsedSpec.successCriteria.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Success Criteria ({parsedSpec.successCriteria.length})
              </h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 space-y-2">
                {parsedSpec.successCriteria.map((criterion) => (
                  <div key={criterion.id} className="flex items-start gap-3 text-sm">
                    <code className="text-xs font-mono bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded flex-shrink-0">
                      {criterion.id}
                    </code>
                    <span className="text-[var(--foreground)]">{criterion.text}</span>
                  </div>
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
                    {qa.session && (
                      <div className="text-xs text-[var(--muted-foreground)] mb-2">Session {qa.session}</div>
                    )}
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

          {/* Assumptions */}
          {parsedSpec && parsedSpec.assumptions.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-4 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Assumptions ({parsedSpec.assumptions.length})
              </h2>
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
                <ul className="space-y-2">
                  {parsedSpec.assumptions.map((assumption, index) => (
                    <li key={index} className="text-sm text-[var(--foreground)] flex items-start gap-2">
                      <span className="text-[var(--muted-foreground)]">•</span>
                      <span>{assumption}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
