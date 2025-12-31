'use client';

import { BookOpen } from 'lucide-react';
import { MarkdownRenderer } from './markdown-renderer';
import { cn } from '@/lib/utils';

interface ResearchViewerProps {
  content: string | null;
  filePath?: string;
  className?: string;
}

export function ResearchViewer({ content, filePath, className }: ResearchViewerProps) {
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
      <MarkdownRenderer content={content} />
    </div>
  );
}
