'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';
import type { DocumentSelectorProps } from './types';

export function DocumentSelector({ options, selected, onChange }: DocumentSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Show all document types - mark ones without content as disabled
  const allOptions = options;
  const availableOptions = options.filter(o => o.available);

  // Handle keyboard navigation for tabs
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = allOptions.findIndex(o => o.type === selected);

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % allOptions.length;
      onChange(allOptions[nextIndex].type);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = currentIndex === 0 ? allOptions.length - 1 : currentIndex - 1;
      onChange(allOptions[prevIndex].type);
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex items-center gap-1 overflow-x-auto"
      onKeyDown={handleKeyDown}
      role="tablist"
      aria-label="Document tabs"
    >
      {allOptions.map((option) => {
        const isAvailable = option.available;
        return (
          <button
            key={option.type}
            onClick={() => isAvailable && onChange(option.type)}
            disabled={!isAvailable}
            role="tab"
            aria-selected={option.type === selected}
            aria-controls={`panel-${option.type}`}
            aria-disabled={!isAvailable}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-1',
              option.type === selected
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                : isAvailable
                  ? 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'
                  : 'text-[var(--muted-foreground)] opacity-40 cursor-not-allowed'
            )}
          >
            {option.label}
            {!isAvailable && <span className="ml-1 text-xs">○</span>}
          </button>
        );
      })}

      {allOptions.length === 0 && (
        <span className="text-sm text-[var(--muted-foreground)] italic">
          No documents available
        </span>
      )}
    </div>
  );
}
