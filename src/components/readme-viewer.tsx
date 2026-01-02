'use client';

import { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Rocket,
  Layers,
  Terminal,
  Link2,
  Database,
  FileText,
  Scale,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from './markdown-renderer';

interface ReadmeViewerProps {
  content: string;
}

interface Section {
  title: string;
  level: number;
  content: string;
  icon?: React.ReactNode;
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  'features': <Sparkles className="w-4 h-4" />,
  'how it works': <Layers className="w-4 h-4" />,
  'quick start': <Rocket className="w-4 h-4" />,
  'url structure': <Link2 className="w-4 h-4" />,
  'tech stack': <Database className="w-4 h-4" />,
  'documentation': <FileText className="w-4 h-4" />,
  'license': <Scale className="w-4 h-4" />,
};

function getIconForSection(title: string): React.ReactNode {
  const lowerTitle = title.toLowerCase();
  for (const [key, icon] of Object.entries(SECTION_ICONS)) {
    if (lowerTitle.includes(key)) {
      return icon;
    }
  }
  return <BookOpen className="w-4 h-4" />;
}

function parseReadme(content: string): { header: string; sections: Section[] } {
  const lines = content.split('\n');
  const sections: Section[] = [];
  let header = '';
  let currentSection: Section | null = null;
  let currentContent: string[] = [];
  let inHeader = true;

  for (const line of lines) {
    // Check for h2 headers (## )
    const h2Match = line.match(/^## (.+)$/);
    if (h2Match) {
      // Save previous section
      if (currentSection) {
        currentSection.content = currentContent.join('\n').trim();
        sections.push(currentSection);
      } else if (inHeader) {
        header = currentContent.join('\n').trim();
        inHeader = false;
      }

      const title = h2Match[1];
      currentSection = {
        title,
        level: 2,
        content: '',
        icon: getIconForSection(title),
      };
      currentContent = [];
      continue;
    }

    // Check for h3 headers (### )
    const h3Match = line.match(/^### (.+)$/);
    if (h3Match && currentSection) {
      currentContent.push(line);
      continue;
    }

    currentContent.push(line);
  }

  // Save last section
  if (currentSection) {
    currentSection.content = currentContent.join('\n').trim();
    sections.push(currentSection);
  } else if (inHeader) {
    header = currentContent.join('\n').trim();
  }

  return { header, sections };
}

function SectionCard({ section, defaultExpanded = true }: { section: Section; defaultExpanded?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--card)]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
          'hover:bg-[var(--secondary)]/50',
          isExpanded && 'border-b border-[var(--border)]'
        )}
      >
        <span className="text-blue-400">
          {section.icon}
        </span>
        <span className="flex-1 font-medium text-sm">{section.title}</span>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 bg-[var(--secondary)]/20">
          <MarkdownRenderer content={section.content} />
        </div>
      )}
    </div>
  );
}

export function ReadmeViewer({ content }: ReadmeViewerProps) {
  const { header, sections } = useMemo(() => parseReadme(content), [content]);

  return (
    <div className="space-y-4">
      {/* Header section with title and description */}
      {header && (
        <div className="border-b border-[var(--border)] pb-4 mb-4">
          <MarkdownRenderer content={header} />
        </div>
      )}

      {/* Collapsible sections */}
      <div className="space-y-3">
        {sections.map((section, index) => (
          <SectionCard
            key={index}
            section={section}
            defaultExpanded={index < 3} // First 3 sections expanded by default
          />
        ))}
      </div>
    </div>
  );
}
