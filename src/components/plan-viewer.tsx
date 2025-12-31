'use client';

import { FileText } from 'lucide-react';
import { MarkdownRenderer } from './markdown-renderer';
import { cn } from '@/lib/utils';

interface PlanViewerProps {
  content: string | null;
  filePath?: string;
  className?: string;
}

export function PlanViewer({ content, filePath, className }: PlanViewerProps) {
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
      <MarkdownRenderer content={content} />
    </div>
  );
}
