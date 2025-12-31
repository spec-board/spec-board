'use client';

import { Rocket } from 'lucide-react';
import { MarkdownRenderer } from './markdown-renderer';
import { cn } from '@/lib/utils';

interface QuickstartViewerProps {
  content: string | null;
  filePath?: string;
  className?: string;
}

export function QuickstartViewer({ content, filePath, className }: QuickstartViewerProps) {
  if (!content) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-zinc-500', className)}>
        <Rocket className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No quickstart guide yet</p>
        <p className="text-sm mt-2">Create a quickstart.md file for getting started instructions</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)}>
      <MarkdownRenderer content={content} />
    </div>
  );
}
