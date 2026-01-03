'use client';

import {
  FileText,
  BookOpen,
  Database,
  FileCode,
  ListTodo,
  ClipboardCheck,
  MessageCircle,
  FileSearch,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SectionId } from './types';
import type { Feature } from '@/types';

interface SectionIconProps {
  sectionId: SectionId;
  feature: Feature;
  className?: string;
}

// Helper to check if additional file exists
function hasAdditionalFile(feature: Feature, type: string): boolean {
  return feature.additionalFiles?.some(f => f.type === type && f.exists) ?? false;
}

// Check if analysis exists (markdown-only now)
function hasAnalysis(feature: Feature): boolean {
  return !!feature.analysis?.markdownContent;
}

export function SectionIcon({ sectionId, feature, className }: SectionIconProps) {
  const baseClass = cn('w-4 h-4 flex-shrink-0', className);

  switch (sectionId) {
    case 'plan':
      return (
        <FileText
          className={baseClass}
          style={{ color: feature.hasPlan ? 'var(--tag-text-success)' : 'var(--muted-foreground)' }}
        />
      );

    case 'research':
      return (
        <BookOpen
          className={baseClass}
          style={{ color: hasAdditionalFile(feature, 'research') ? 'var(--tag-text-success)' : 'var(--muted-foreground)' }}
        />
      );

    case 'data-model':
      return (
        <Database
          className={baseClass}
          style={{ color: hasAdditionalFile(feature, 'data-model') ? 'var(--tag-text-success)' : 'var(--muted-foreground)' }}
        />
      );

    case 'spec':
      return (
        <div className="flex items-center gap-1">
          <FileCode
            className={baseClass}
            style={{ color: feature.hasSpec ? 'var(--tag-text-success)' : 'var(--muted-foreground)' }}
          />
          {feature.totalClarifications > 0 && (
            <span className="flex items-center gap-0.5 text-xs" style={{ color: 'var(--tag-text-info)' }}>
              <MessageCircle className="w-3 h-3" />
              {feature.totalClarifications}
            </span>
          )}
        </div>
      );

    case 'tasks':
      return (
        <ListTodo
          className={baseClass}
          style={{ color: feature.hasTasks ? 'var(--tag-text-success)' : 'var(--muted-foreground)' }}
        />
      );

    case 'analysis': {
      return (
        <FileSearch
          className={baseClass}
          style={{ color: hasAnalysis(feature) ? 'var(--tag-text-success)' : 'var(--muted-foreground)' }}
        />
      );
    }

    case 'checklists':
      return (
        <ClipboardCheck
          className={baseClass}
          style={{ color: feature.hasChecklists ? 'var(--tag-text-success)' : 'var(--muted-foreground)' }}
        />
      );

    default:
      return null;
  }
}
