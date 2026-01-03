'use client';

import { TrendingUp } from 'lucide-react';
import { MarkdownRenderer } from './markdown-renderer';
import { cn } from '@/lib/utils';
import type { FeatureAnalysis } from '@/types';

interface AnalysisViewerProps {
  analysis: FeatureAnalysis;
  className?: string;
}

export function AnalysisViewer({ analysis, className }: AnalysisViewerProps) {
  const { markdownContent } = analysis;

  // No analysis data available - show instructions
  if (!markdownContent) {
    return (
      <div className={cn('flex flex-col py-6', className)}>
        <div className="flex flex-col items-center mb-6 text-[var(--muted-foreground)]">
          <TrendingUp className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">No analysis yet</p>
        </div>

        <div className="space-y-4 text-sm">
          <div className="p-4 bg-[var(--secondary)]/30 rounded-lg">
            <h4 className="font-medium mb-2">How to Generate Analysis</h4>
            <ol className="text-[var(--muted-foreground)] space-y-2 list-decimal list-inside">
              <li>Run <code className="bg-zinc-800 px-1.5 py-0.5 rounded">/speckit.analyze</code> in Claude Code</li>
              <li>Save the analysis report to <code className="bg-zinc-800 px-1.5 py-0.5 rounded">specs/&lt;feature&gt;/analysis/analysis.md</code></li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <MarkdownRenderer content={markdownContent} />
    </div>
  );
}
