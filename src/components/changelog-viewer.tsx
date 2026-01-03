'use client';

import { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Wrench,
  RefreshCw,
  AlertTriangle,
  Tag,
  Calendar,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from './markdown-renderer';

interface ChangelogViewerProps {
  content: string;
}

interface ChangeEntry {
  type: 'Added' | 'Changed' | 'Fixed' | 'Deprecated' | 'Removed' | 'Security';
  content: string;
}

interface Version {
  version: string;
  date: string | null;
  isUnreleased: boolean;
  entries: ChangeEntry[];
  rawContent: string;
}

const CHANGE_TYPE_CONFIG: Record<string, { icon: React.ReactNode; colorVar: string; bgColor: string }> = {
  'Added': {
    icon: <Plus className="w-3.5 h-3.5" />,
    colorVar: '--tag-text-success',
    bgColor: 'bg-green-500/10 border-green-500/20'
  },
  'Changed': {
    icon: <RefreshCw className="w-3.5 h-3.5" />,
    colorVar: '--tag-text-info',
    bgColor: 'bg-blue-500/10 border-blue-500/20'
  },
  'Fixed': {
    icon: <Wrench className="w-3.5 h-3.5" />,
    colorVar: '--tag-text-warning',
    bgColor: 'bg-yellow-500/10 border-yellow-500/20'
  },
  'Deprecated': {
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    colorVar: '--tag-text-orange',
    bgColor: 'bg-orange-500/10 border-orange-500/20'
  },
  'Removed': {
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    colorVar: '--tag-text-error',
    bgColor: 'bg-red-500/10 border-red-500/20'
  },
  'Security': {
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    colorVar: '--tag-text-purple',
    bgColor: 'bg-purple-500/10 border-purple-500/20'
  },
};

function parseChangelog(content: string): { header: string; versions: Version[] } {
  const lines = content.split('\n');
  const versions: Version[] = [];
  let header = '';
  let currentVersion: Version | null = null;
  let currentChangeType: string | null = null;
  let currentContent: string[] = [];
  let headerLines: string[] = [];
  let inHeader = true;

  for (const line of lines) {
    // Check for version headers (## [version] or ## [Unreleased])
    const versionMatch = line.match(/^## \[([^\]]+)\](?:\s*-\s*(\d{4}-\d{2}-\d{2}))?/);
    if (versionMatch) {
      // Save previous version
      if (currentVersion) {
        if (currentChangeType && currentContent.length > 0) {
          currentVersion.entries.push({
            type: currentChangeType as ChangeEntry['type'],
            content: currentContent.join('\n').trim(),
          });
        }
        versions.push(currentVersion);
      } else if (inHeader) {
        header = headerLines.join('\n').trim();
        inHeader = false;
      }

      const version = versionMatch[1];
      const date = versionMatch[2] || null;
      currentVersion = {
        version,
        date,
        isUnreleased: version.toLowerCase() === 'unreleased',
        entries: [],
        rawContent: '',
      };
      currentChangeType = null;
      currentContent = [];
      continue;
    }

    // Check for change type headers (### Added, ### Fixed, etc.)
    const changeTypeMatch = line.match(/^### (Added|Changed|Fixed|Deprecated|Removed|Security)/);
    if (changeTypeMatch && currentVersion) {
      // Save previous change type content
      if (currentChangeType && currentContent.length > 0) {
        currentVersion.entries.push({
          type: currentChangeType as ChangeEntry['type'],
          content: currentContent.join('\n').trim(),
        });
      }
      currentChangeType = changeTypeMatch[1];
      currentContent = [];
      continue;
    }

    // Accumulate content
    if (currentVersion) {
      currentContent.push(line);
      currentVersion.rawContent += line + '\n';
    } else if (inHeader) {
      headerLines.push(line);
    }
  }

  // Save last version
  if (currentVersion) {
    if (currentChangeType && currentContent.length > 0) {
      currentVersion.entries.push({
        type: currentChangeType as ChangeEntry['type'],
        content: currentContent.join('\n').trim(),
      });
    }
    versions.push(currentVersion);
  }

  return { header, versions };
}

function ChangeTypeSection({ type, content }: { type: string; content: string }) {
  const config = CHANGE_TYPE_CONFIG[type] || CHANGE_TYPE_CONFIG['Added'];

  return (
    <div className={cn('rounded-lg border p-3', config.bgColor)}>
      <div
        className="flex items-center gap-2 mb-2 font-medium text-sm"
        style={{ color: `var(${config.colorVar})` }}
      >
        {config.icon}
        <span>{type}</span>
      </div>
      <div className="text-sm">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  );
}

function VersionCard({ version, defaultExpanded = false }: { version: Version; defaultExpanded?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="relative">
      {/* Timeline dot and line */}
      <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col items-center">
        <div className={cn(
          'w-3 h-3 rounded-full border-2 mt-4 z-10',
          version.isUnreleased
            ? 'bg-blue-500 border-blue-400'
            : 'bg-[var(--secondary)] border-[var(--border)]'
        )} />
        <div className="flex-1 w-0.5 bg-[var(--border)]" />
      </div>

      {/* Version content */}
      <div className="ml-10 pb-6">
        <div
          className={cn(
            'border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--card)]',
            version.isUnreleased && 'border-blue-500/30'
          )}
        >
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
              'hover:bg-[var(--secondary)]/50',
              isExpanded && 'border-b border-[var(--border)]'
            )}
          >
            {/* Version badge */}
            <div className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono',
              version.isUnreleased
                ? 'bg-blue-500/20'
                : 'bg-[var(--secondary)] text-[var(--foreground)]'
            )}
            style={version.isUnreleased ? { color: 'var(--tag-text-info)' } : undefined}>
              <Tag className="w-3 h-3" />
              {version.isUnreleased ? 'Unreleased' : `v${version.version}`}
            </div>

            {/* Date */}
            {version.date && (
              <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                <Calendar className="w-3 h-3" />
                {version.date}
              </div>
            )}

            {/* Change type badges */}
            <div className="flex-1 flex items-center gap-1.5">
              {version.entries.map((entry, idx) => {
                const config = CHANGE_TYPE_CONFIG[entry.type];
                return (
                  <span
                    key={idx}
                    className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', config?.bgColor)}
                    style={{ color: config ? `var(${config.colorVar})` : undefined }}
                  >
                    {entry.type}
                  </span>
                );
              })}
            </div>

            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)]" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
            )}
          </button>

          {isExpanded && (
            <div className="p-4 space-y-3 bg-[var(--secondary)]/20">
              {version.entries.map((entry, idx) => (
                <ChangeTypeSection key={idx} type={entry.type} content={entry.content} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ChangelogViewer({ content }: ChangelogViewerProps) {
  const { header, versions } = useMemo(() => parseChangelog(content), [content]);

  return (
    <div className="space-y-4">
      {/* Header */}
      {header && (
        <div className="border-b border-[var(--border)] pb-4 mb-4">
          <MarkdownRenderer content={header} />
        </div>
      )}

      {/* Version timeline */}
      <div className="relative">
        {versions.map((version, index) => (
          <VersionCard
            key={version.version}
            version={version}
            defaultExpanded={index === 0} // Only first version expanded
          />
        ))}
      </div>
    </div>
  );
}
