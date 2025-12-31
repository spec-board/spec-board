'use client';

import { FileText } from 'lucide-react';
import { MarkdownRenderer } from './markdown-renderer';
import { cn } from '@/lib/utils';

interface ConstitutionViewerProps {
  content: string | null;
  className?: string;
}

export function ConstitutionViewer({ content, className }: ConstitutionViewerProps) {
  if (!content) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-zinc-500', className)}>
        <FileText className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No constitution defined</p>
        <p className="text-sm mt-2">Run <code className="bg-[var(--secondary)] px-1 rounded">/speckit.constitution</code> to create one</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)}>
      <MarkdownRenderer content={content} />
    </div>
  );
}
