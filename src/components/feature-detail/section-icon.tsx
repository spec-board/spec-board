'use client';

import {
  FileText,
  BookOpen,
  Database,
  FileCode,
  ListTodo,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
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

// Get analysis severity
function getAnalysisSeverity(feature: Feature): 'good' | 'warning' | 'none' {
  if (!feature.analysis?.jsonData) return 'none';
  const alignment = feature.analysis.jsonData.specAlignment;
  if (alignment.missing > 0 || alignment.partial > 0) return 'warning';
  return 'good';
}

export function SectionIcon({ sectionId, feature, className }: SectionIconProps) {
  const baseClass = cn('w-4 h-4 flex-shrink-0', className);

  switch (sectionId) {
    case 'plan':
      return (
        <FileText
          className={cn(
            baseClass,
            feature.hasPlan ? 'text-green-400' : 'text-[var(--muted-foreground)]/50'
          )}
        />
      );

    case 'research':
      return (
        <BookOpen
          className={cn(
            baseClass,
            hasAdditionalFile(feature, 'research')
              ? 'text-green-400'
              : 'text-[var(--muted-foreground)]/50'
          )}
        />
      );

    case 'data-model':
      return (
        <Database
          className={cn(
            baseClass,
            hasAdditionalFile(feature, 'data-model')
              ? 'text-green-400'
              : 'text-[var(--muted-foreground)]/50'
          )}
        />
      );

    case 'spec':
      return (
        <div className="flex items-center gap-1">
          <FileCode
            className={cn(
              baseClass,
              feature.hasSpec ? 'text-green-400' : 'text-[var(--muted-foreground)]/50'
            )}
          />
          {feature.totalClarifications > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-blue-400">
              <MessageCircle className="w-3 h-3" />
              {feature.totalClarifications}
            </span>
          )}
        </div>
      );

    case 'tasks':
      return (
        <ListTodo
          className={cn(
            baseClass,
            feature.hasTasks ? 'text-green-400' : 'text-[var(--muted-foreground)]/50'
          )}
        />
      );

    case 'analysis': {
      const severity = getAnalysisSeverity(feature);
      if (severity === 'warning') {
        return <AlertTriangle className={cn(baseClass, 'text-orange-400')} />;
      }
      if (severity === 'good') {
        return <CheckCircle2 className={cn(baseClass, 'text-green-400')} />;
      }
      return <FileSearch className={cn(baseClass, 'text-[var(--muted-foreground)]/50')} />;
    }

    case 'checklists':
      return (
        <ClipboardCheck
          className={cn(
            baseClass,
            feature.hasChecklists ? 'text-green-400' : 'text-[var(--muted-foreground)]/50'
          )}
        />
      );

    default:
      return null;
  }
}
