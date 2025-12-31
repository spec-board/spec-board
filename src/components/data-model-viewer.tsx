'use client';

import { Database } from 'lucide-react';
import { MarkdownRenderer } from './markdown-renderer';
import { cn } from '@/lib/utils';

interface DataModelViewerProps {
  content: string | null;
  filePath?: string;
  className?: string;
}

export function DataModelViewer({ content, filePath, className }: DataModelViewerProps) {
  if (!content) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-zinc-500', className)}>
        <Database className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No data model yet</p>
        <p className="text-sm mt-2">Create a data-model.md file to define data structures</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)}>
      <MarkdownRenderer content={content} />
    </div>
  );
}
