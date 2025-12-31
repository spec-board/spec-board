'use client';

import { useState } from 'react';
import { FileCode, ChevronDown, ChevronRight, FolderOpen } from 'lucide-react';
import { MarkdownRenderer } from './markdown-renderer';
import { cn } from '@/lib/utils';
import type { SpecKitFile } from '@/types';

interface ContractFileProps {
  file: SpecKitFile;
  defaultExpanded?: boolean;
}

function ContractFile({ file, defaultExpanded = false }: ContractFileProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const fileName = file.path.split('/').pop() || file.path;

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden mb-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-3 bg-[var(--secondary)]/30 hover:bg-[var(--secondary)]/50 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
        )}
        <FileCode className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <span className="font-mono text-sm flex-1 text-left truncate">{fileName}</span>
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-[var(--border)]">
          <MarkdownRenderer content={file.content} />
        </div>
      )}
    </div>
  );
}

interface ContractsViewerProps {
  contracts: SpecKitFile[];
  className?: string;
}

export function ContractsViewer({ contracts, className }: ContractsViewerProps) {
  if (!contracts || contracts.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-zinc-500', className)}>
        <FolderOpen className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No contracts yet</p>
        <p className="text-sm mt-2">Create files in the contracts/ directory to define API contracts</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[var(--muted-foreground)]">
          {contracts.length} contract{contracts.length !== 1 ? 's' : ''} defined
        </p>
      </div>
      <div>
        {contracts.map((contract, index) => (
          <ContractFile
            key={contract.path}
            file={contract}
            defaultExpanded={index === 0}
          />
        ))}
      </div>
    </div>
  );
}
